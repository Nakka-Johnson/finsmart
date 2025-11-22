package com.finsmart.service;

import com.finsmart.domain.entity.*;
import com.finsmart.domain.enums.AccountType;
import com.finsmart.domain.enums.TransactionDirection;
import com.finsmart.domain.repo.*;
import com.finsmart.util.TransactionHashUtil;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Service for managing demo data (seeding and clearing). */
@Slf4j
@Service
@RequiredArgsConstructor
public class DemoDataService {

  private final UserRepository userRepository;
  private final AccountRepository accountRepository;
  private final CategoryRepository categoryRepository;
  private final TransactionRepository transactionRepository;
  private final BudgetRepository budgetRepository;
  private final RuleRepository ruleRepository;
  private final PasswordEncoder passwordEncoder;

  /** Seed demo data (idempotent - checks hashes before inserting). */
  @Transactional
  public SeedResult seedDemoData() {
    log.info("Starting demo data seed...");

    int usersCreated = 0;
    int accountsCreated = 0;
    int categoriesCreated = 0;
    int transactionsCreated = 0;
    int budgetsCreated = 0;
    int rulesCreated = 0;

    // Create demo user if not exists
    String demoEmail = "demo@finsmart.com";
    User demoUser =
        userRepository
            .findByEmail(demoEmail)
            .orElseGet(
                () -> {
                  User user = new User();
                  user.setEmail(demoEmail);
                  user.setPasswordHash(passwordEncoder.encode("Demo1234!"));
                  user.setFullName("Demo User");
                  return userRepository.save(user);
                });

    if (demoUser
        .getCreatedAt()
        .isAfter(Instant.now().minus(5, ChronoUnit.SECONDS))) { // Just created
      usersCreated++;
      log.info("Created demo user: {}", demoEmail);
    }

    // Create categories if not exist
    List<Category> categories = createDemoCategories(demoUser.getId());
    categoriesCreated = categories.size();

    // Create accounts if not exist
    List<Account> accounts = createDemoAccounts(demoUser.getId());
    accountsCreated = accounts.size();

    // Create transactions (with hash-based deduplication)
    transactionsCreated = createDemoTransactions(demoUser.getId(), accounts, categories);

    // Create budgets
    budgetsCreated = createDemoBudgets(demoUser.getId(), categories);

    // Create rules
    rulesCreated = createDemoRules(demoUser.getId(), categories);

    log.info(
        "Demo seed completed: {} users, {} accounts, {} categories, {} transactions, {} budgets, {}"
            + " rules",
        usersCreated,
        accountsCreated,
        categoriesCreated,
        transactionsCreated,
        budgetsCreated,
        rulesCreated);

    return new SeedResult(
        usersCreated,
        accountsCreated,
        categoriesCreated,
        transactionsCreated,
        budgetsCreated,
        rulesCreated);
  }

  /** Clear all demo data. */
  @Transactional
  public ClearResult clearDemoData() {
    log.info("Starting demo data clear...");

    String demoEmail = "demo@finsmart.com";
    User demoUser = userRepository.findByEmail(demoEmail).orElse(null);

    if (demoUser == null) {
      log.info("No demo user found, nothing to clear");
      return new ClearResult(0, 0, 0, 0, 0, 0);
    }

    UUID userId = demoUser.getId();

    // Delete in reverse order (respect FK constraints)
    int transactionsDeleted = transactionRepository.deleteByAccountUserId(userId);
    int budgetsDeleted = budgetRepository.deleteByUserId(userId);
    int rulesDeleted = ruleRepository.deleteAllByUserId(userId);
    int accountsDeleted = accountRepository.deleteByUserId(userId);
    userRepository.delete(demoUser);

    log.info(
        "Demo clear completed: 1 user, {} accounts, {} transactions, {} budgets, {} rules",
        accountsDeleted,
        transactionsDeleted,
        budgetsDeleted,
        rulesDeleted);

    return new ClearResult(
        1, accountsDeleted, 0, transactionsDeleted, budgetsDeleted, rulesDeleted);
  }

  private List<Category> createDemoCategories(UUID userId) {
    // Categories are global, just check if they exist
    List<Category> categories = categoryRepository.findAll();
    if (!categories.isEmpty()) {
      log.info("Categories already exist, skipping creation");
      return categories;
    }

    List<Category> newCategories = new ArrayList<>();
    String[] names = {
      "Groceries", "Dining", "Transportation", "Utilities", "Entertainment", "Healthcare", "Salary"
    };
    String[] colors = {"#4CAF50", "#FF9800", "#2196F3", "#9C27B0", "#E91E63", "#00BCD4", "#8BC34A"};

    for (int i = 0; i < names.length; i++) {
      Category category = new Category();
      category.setName(names[i]);
      category.setColor(colors[i]);
      newCategories.add(categoryRepository.save(category));
    }

    log.info("Created {} demo categories", newCategories.size());
    return newCategories;
  }

  private List<Account> createDemoAccounts(UUID userId) {
    User user = userRepository.findById(userId).orElseThrow();
    List<Account> existing = accountRepository.findByUserId(userId);
    if (!existing.isEmpty()) {
      log.info("Accounts already exist for user {}, skipping creation", userId);
      return existing;
    }

    List<Account> accounts = new ArrayList<>();

    // Checking account
    Account checking = new Account();
    checking.setUser(user);
    checking.setName("Primary Checking");
    checking.setInstitution("Demo Bank");
    checking.setType(AccountType.CHECKING);
    checking.setBalance(new BigDecimal("5432.10"));
    checking.setCurrency("USD");
    accounts.add(accountRepository.save(checking));

    // Savings account
    Account savings = new Account();
    savings.setUser(user);
    savings.setName("High-Yield Savings");
    savings.setInstitution("Demo Bank");
    savings.setType(AccountType.SAVINGS);
    savings.setBalance(new BigDecimal("12500.00"));
    savings.setCurrency("USD");
    accounts.add(accountRepository.save(savings));

    log.info("Created {} demo accounts", accounts.size());
    return accounts;
  }

  private int createDemoTransactions(
      UUID userId, List<Account> accounts, List<Category> categories) {
    if (accounts.isEmpty()) {
      log.warn("No accounts available, skipping transaction creation");
      return 0;
    }

    Account checkingAccount = accounts.get(0);
    Instant now = Instant.now();
    int created = 0;

    // Generate transactions for the past 4 months
    for (int monthOffset = 0; monthOffset < 4; monthOffset++) {
      Instant monthStart =
          LocalDate.now()
              .minusMonths(monthOffset)
              .withDayOfMonth(1)
              .atStartOfDay(ZoneOffset.UTC)
              .toInstant();

      // Salary (credit)
      created +=
          createTransactionIfNotExists(
              userId,
              checkingAccount,
              findCategoryByName(categories, "Salary"),
              monthStart.plus(1, ChronoUnit.DAYS),
              new BigDecimal("5000.00"),
              TransactionDirection.CREDIT,
              "Employer Inc",
              "Monthly Salary");

      // Groceries (debits)
      created +=
          createTransactionIfNotExists(
              userId,
              checkingAccount,
              findCategoryByName(categories, "Groceries"),
              monthStart.plus(5, ChronoUnit.DAYS),
              new BigDecimal("125.43"),
              TransactionDirection.DEBIT,
              "Whole Foods",
              "Grocery shopping");

      created +=
          createTransactionIfNotExists(
              userId,
              checkingAccount,
              findCategoryByName(categories, "Groceries"),
              monthStart.plus(12, ChronoUnit.DAYS),
              new BigDecimal("89.21"),
              TransactionDirection.DEBIT,
              "Trader Joes",
              "Weekly groceries");

      created +=
          createTransactionIfNotExists(
              userId,
              checkingAccount,
              findCategoryByName(categories, "Groceries"),
              monthStart.plus(19, ChronoUnit.DAYS),
              new BigDecimal("67.89"),
              TransactionDirection.DEBIT,
              "Safeway",
              "Food supplies");

      // Dining
      created +=
          createTransactionIfNotExists(
              userId,
              checkingAccount,
              findCategoryByName(categories, "Dining"),
              monthStart.plus(7, ChronoUnit.DAYS),
              new BigDecimal("45.67"),
              TransactionDirection.DEBIT,
              "Chipotle",
              "Lunch");

      created +=
          createTransactionIfNotExists(
              userId,
              checkingAccount,
              findCategoryByName(categories, "Dining"),
              monthStart.plus(14, ChronoUnit.DAYS),
              new BigDecimal("78.90"),
              TransactionDirection.DEBIT,
              "Olive Garden",
              "Dinner with friends");

      // Utilities
      created +=
          createTransactionIfNotExists(
              userId,
              checkingAccount,
              findCategoryByName(categories, "Utilities"),
              monthStart.plus(15, ChronoUnit.DAYS),
              new BigDecimal("150.00"),
              TransactionDirection.DEBIT,
              "PG&E",
              "Electricity bill");

      created +=
          createTransactionIfNotExists(
              userId,
              checkingAccount,
              findCategoryByName(categories, "Utilities"),
              monthStart.plus(20, ChronoUnit.DAYS),
              new BigDecimal("60.00"),
              TransactionDirection.DEBIT,
              "Comcast",
              "Internet service");

      // Transportation
      created +=
          createTransactionIfNotExists(
              userId,
              checkingAccount,
              findCategoryByName(categories, "Transportation"),
              monthStart.plus(10, ChronoUnit.DAYS),
              new BigDecimal("45.00"),
              TransactionDirection.DEBIT,
              "Shell",
              "Gas");

      // Entertainment
      created +=
          createTransactionIfNotExists(
              userId,
              checkingAccount,
              findCategoryByName(categories, "Entertainment"),
              monthStart.plus(22, ChronoUnit.DAYS),
              new BigDecimal("15.99"),
              TransactionDirection.DEBIT,
              "Netflix",
              "Subscription");
    }

    log.info("Created {} demo transactions", created);
    return created;
  }

  private int createTransactionIfNotExists(
      UUID userId,
      Account account,
      Category category,
      Instant postedAt,
      BigDecimal amount,
      TransactionDirection direction,
      String merchant,
      String description) {

    String hash =
        TransactionHashUtil.computeHash(
            postedAt, amount, direction, merchant, description, account.getId());

    if (transactionRepository.existsByHash(hash)) {
      return 0;
    }

    Transaction txn = new Transaction();
    txn.setAccount(account);
    txn.setCategory(category);
    txn.setPostedAt(postedAt);
    txn.setAmount(amount);
    txn.setDirection(direction);
    txn.setMerchant(merchant);
    txn.setDescription(description);
    txn.setHash(hash);

    transactionRepository.save(txn);
    return 1;
  }

  private int createDemoBudgets(UUID userId, List<Category> categories) {
    Instant now = Instant.now();
    LocalDate currentMonth = LocalDate.now().withDayOfMonth(1);
    int year = currentMonth.getYear();
    int month = currentMonth.getMonthValue();

    int created = 0;

    // Create budgets for common categories
    created +=
        createBudgetIfNotExists(
            userId, findCategoryByName(categories, "Groceries"), year, month, "400.00");
    created +=
        createBudgetIfNotExists(
            userId, findCategoryByName(categories, "Dining"), year, month, "200.00");
    created +=
        createBudgetIfNotExists(
            userId, findCategoryByName(categories, "Transportation"), year, month, "150.00");
    created +=
        createBudgetIfNotExists(
            userId, findCategoryByName(categories, "Utilities"), year, month, "250.00");
    created +=
        createBudgetIfNotExists(
            userId, findCategoryByName(categories, "Entertainment"), year, month, "100.00");

    log.info("Created {} demo budgets", created);
    return created;
  }

  private int createBudgetIfNotExists(
      UUID userId, Category category, int year, int month, String limitAmount) {
    if (category == null) {
      return 0;
    }

    boolean exists =
        budgetRepository.existsByUserIdAndCategoryIdAndMonthAndYear(
            userId, category.getId(), month, year);

    if (exists) {
      return 0;
    }

    User user = userRepository.findById(userId).orElseThrow();
    Budget budget = new Budget();
    budget.setUser(user);
    budget.setCategory(category);
    budget.setYear(year);
    budget.setMonth(month);
    budget.setLimitAmount(new BigDecimal(limitAmount));
    budget.setRollover(false);
    budget.setCarryIn(BigDecimal.ZERO);

    budgetRepository.save(budget);
    return 1;
  }

  private int createDemoRules(UUID userId, List<Category> categories) {
    int created = 0;

    // Groceries rules
    created +=
        createRuleIfNotExists(
            userId, findCategoryByName(categories, "Groceries"), "whole foods", "merchant", 10);
    created +=
        createRuleIfNotExists(
            userId, findCategoryByName(categories, "Groceries"), "trader joe", "merchant", 11);
    created +=
        createRuleIfNotExists(
            userId, findCategoryByName(categories, "Groceries"), "safeway", "merchant", 12);

    // Dining rules
    created +=
        createRuleIfNotExists(
            userId, findCategoryByName(categories, "Dining"), "chipotle", "merchant", 20);
    created +=
        createRuleIfNotExists(
            userId, findCategoryByName(categories, "Dining"), "olive garden", "merchant", 21);

    // Utilities rules
    created +=
        createRuleIfNotExists(
            userId, findCategoryByName(categories, "Utilities"), "pg&e", "merchant", 30);
    created +=
        createRuleIfNotExists(
            userId, findCategoryByName(categories, "Utilities"), "comcast", "merchant", 31);

    // Transportation rules
    created +=
        createRuleIfNotExists(
            userId, findCategoryByName(categories, "Transportation"), "shell", "merchant", 40);

    // Entertainment rules
    created +=
        createRuleIfNotExists(
            userId, findCategoryByName(categories, "Entertainment"), "netflix", "merchant", 50);

    log.info("Created {} demo rules", created);
    return created;
  }

  private int createRuleIfNotExists(
      UUID userId, Category category, String pattern, String field, int priority) {
    if (category == null) {
      return 0;
    }

    // Check if similar rule exists (same user, category, pattern, field)
    boolean exists =
        ruleRepository.findByUserIdOrderByPriorityAscCreatedAtAsc(userId).stream()
            .anyMatch(
                r ->
                    r.getCategory().getId().equals(category.getId())
                        && r.getPattern().equalsIgnoreCase(pattern)
                        && r.getField().equalsIgnoreCase(field));

    if (exists) {
      return 0;
    }

    Rule rule = new Rule();
    rule.setUserId(userId);
    rule.setCategory(category);
    rule.setPattern(pattern);
    rule.setField(field);
    rule.setPriority(priority);
    rule.setActive(true);

    ruleRepository.save(rule);
    return 1;
  }

  private Category findCategoryByName(List<Category> categories, String name) {
    return categories.stream()
        .filter(c -> c.getName().equalsIgnoreCase(name))
        .findFirst()
        .orElse(null);
  }

  /** Result of seed operation. */
  public record SeedResult(
      int usersCreated,
      int accountsCreated,
      int categoriesCreated,
      int transactionsCreated,
      int budgetsCreated,
      int rulesCreated) {}

  /** Result of clear operation. */
  public record ClearResult(
      int usersDeleted,
      int accountsDeleted,
      int categoriesDeleted,
      int transactionsDeleted,
      int budgetsDeleted,
      int rulesDeleted) {}
}
