package com.finsmart.service;

import com.finsmart.domain.entity.Account;
import com.finsmart.domain.entity.Category;
import com.finsmart.domain.entity.Transaction;
import com.finsmart.domain.enums.TransactionDirection;
import com.finsmart.domain.repo.AccountRepository;
import com.finsmart.domain.repo.CategoryRepository;
import com.finsmart.domain.repo.TransactionRepository;
import com.finsmart.service.ai.AiClientService;
import com.finsmart.service.ai.TxnPayload;
import com.finsmart.util.CsvTransactionParser;
import com.finsmart.web.dto.transaction.ImportPreviewResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

  private final TransactionRepository transactionRepository;
  private final AccountRepository accountRepository;
  private final CategoryRepository categoryRepository;
  private final AiClientService aiClientService;

  @Transactional(readOnly = true)
  public Page<Transaction> listTransactions(
      UUID userId,
      UUID accountId,
      Instant dateFrom,
      Instant dateTo,
      TransactionDirection direction,
      UUID categoryId,
      BigDecimal minAmount,
      BigDecimal maxAmount,
      String query,
      Pageable pageable) {

    // If accountId is provided, verify it belongs to user
    // If not provided, get all user's accounts
    List<Account> accounts;
    if (accountId != null) {
      Account account = getAccountAndVerifyOwnership(userId, accountId);
      accounts = List.of(account);
    } else {
      accounts = accountRepository.findByUserId(userId);
      if (accounts.isEmpty()) {
        // User has no accounts, return empty page
        return Page.empty(pageable);
      }
    }

    Specification<Transaction> spec =
        (root, criteriaQuery, criteriaBuilder) -> {
          List<Predicate> predicates = new ArrayList<>();

          // Filter by user's accounts
          predicates.add(root.get("account").in(accounts));

          if (dateFrom != null) {
            predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("postedAt"), dateFrom));
          }
          if (dateTo != null) {
            predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("postedAt"), dateTo));
          }
          if (direction != null) {
            predicates.add(criteriaBuilder.equal(root.get("direction"), direction));
          }
          if (categoryId != null) {
            predicates.add(criteriaBuilder.equal(root.get("category").get("id"), categoryId));
          }
          if (minAmount != null) {
            predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("amount"), minAmount));
          }
          if (maxAmount != null) {
            predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("amount"), maxAmount));
          }
          if (query != null && !query.trim().isEmpty()) {
            String pattern = "%" + query.toLowerCase() + "%";
            predicates.add(
                criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("merchant")), pattern)));
          }

          return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

    return transactionRepository.findAll(spec, pageable);
  }

  @Transactional(readOnly = true)
  public Transaction getById(UUID userId, UUID transactionId) {
    Transaction transaction =
        transactionRepository
            .findById(transactionId)
            .orElseThrow(
                () ->
                    new EntityNotFoundException("Transaction not found with id: " + transactionId));

    // Verify ownership via account
    if (!transaction.getAccount().getUser().getId().equals(userId)) {
      throw new EntityNotFoundException("Transaction not found with id: " + transactionId);
    }

    return transaction;
  }

  @Transactional
  public Transaction createTransaction(
      UUID userId,
      UUID accountId,
      Instant postedAt,
      BigDecimal amount,
      TransactionDirection direction,
      String description,
      UUID categoryId,
      String merchant,
      String notes) {

    Account account = getAccountAndVerifyOwnership(userId, accountId);

    Transaction transaction = new Transaction();
    transaction.setAccount(account);
    transaction.setPostedAt(postedAt);
    transaction.setAmount(amount);
    transaction.setDirection(direction);
    transaction.setDescription(description);
    transaction.setMerchant(merchant);
    transaction.setNotes(notes);

    if (categoryId != null) {
      Category category =
          categoryRepository
              .findById(categoryId)
              .orElseThrow(
                  () -> new EntityNotFoundException("Category not found with id: " + categoryId));
      transaction.setCategory(category);
    }

    // Update account balance
    updateAccountBalance(account, amount, direction, true);

    Transaction saved = transactionRepository.save(transaction);
    log.info(
        "Created transaction: {} {} for account {} (id: {})",
        direction,
        amount,
        account.getName(),
        saved.getId());
    return saved;
  }

  @Transactional
  public Transaction updateTransaction(
      UUID userId,
      UUID transactionId,
      Instant postedAt,
      BigDecimal amount,
      TransactionDirection direction,
      String description,
      UUID categoryId,
      String merchant,
      String notes) {

    Transaction transaction = getById(userId, transactionId);

    // Revert old balance impact
    updateAccountBalance(
        transaction.getAccount(), transaction.getAmount(), transaction.getDirection(), false);

    // Update fields
    transaction.setPostedAt(postedAt);
    transaction.setAmount(amount);
    transaction.setDirection(direction);
    transaction.setDescription(description);
    transaction.setMerchant(merchant);
    transaction.setNotes(notes);

    if (categoryId != null) {
      Category category =
          categoryRepository
              .findById(categoryId)
              .orElseThrow(
                  () -> new EntityNotFoundException("Category not found with id: " + categoryId));
      transaction.setCategory(category);
    } else {
      transaction.setCategory(null);
    }

    // Apply new balance impact
    updateAccountBalance(transaction.getAccount(), amount, direction, true);

    Transaction saved = transactionRepository.save(transaction);
    log.info("Updated transaction: {} (id: {})", saved.getId(), transactionId);
    return saved;
  }

  @Transactional
  public void deleteTransaction(UUID userId, UUID transactionId) {
    Transaction transaction = getById(userId, transactionId);

    // Revert balance impact
    updateAccountBalance(
        transaction.getAccount(), transaction.getAmount(), transaction.getDirection(), false);

    transactionRepository.delete(transaction);
    log.info("Deleted transaction: {} (id: {})", transactionId, transactionId);
  }

  private Account getAccountAndVerifyOwnership(UUID userId, UUID accountId) {
    Account account =
        accountRepository
            .findById(accountId)
            .orElseThrow(
                () -> new EntityNotFoundException("Account not found with id: " + accountId));

    if (!account.getUser().getId().equals(userId)) {
      throw new EntityNotFoundException("Account not found with id: " + accountId);
    }

    return account;
  }

  private void updateAccountBalance(
      Account account, BigDecimal amount, TransactionDirection direction, boolean isAdd) {
    BigDecimal currentBalance = account.getBalance();
    BigDecimal change = amount;

    // If removing (isAdd=false), invert the change
    if (!isAdd) {
      change = change.negate();
    }

    // Apply direction
    if (direction == TransactionDirection.CREDIT) {
      account.setBalance(currentBalance.add(change));
    } else {
      account.setBalance(currentBalance.subtract(change));
    }

    accountRepository.save(account);
  }

  /**
   * Import transactions from parsed CSV data.
   *
   * @param userId User ID
   * @param parseResult Parsed CSV data
   * @param preview If true, return preview with AI categorization; if false, persist transactions
   * @return ImportPreviewResponse if preview=true, or null if persisted
   */
  @Transactional
  public ImportPreviewResponse importTransactions(
      UUID userId, CsvTransactionParser.ParseResult parseResult, boolean preview) {

    if (parseResult.hasErrors()) {
      // Return error response with validation errors
      List<ImportPreviewResponse.RowError> errors =
          parseResult.errors().stream()
              .map(e -> new ImportPreviewResponse.RowError(e.rowNumber(), e.message()))
              .toList();

      return new ImportPreviewResponse(
          parseResult.totalRows(),
          parseResult.validRows().size(),
          errors.size(),
          List.of(),
          errors);
    }

    List<CsvTransactionParser.ParsedRow> validRows = parseResult.validRows();

    // Verify all accounts belong to user and collect them
    Map<UUID, Account> accountCache = new HashMap<>();
    for (var row : validRows) {
      if (!accountCache.containsKey(row.accountId())) {
        Account account = getAccountAndVerifyOwnership(userId, row.accountId());
        accountCache.put(row.accountId(), account);
      }
    }

    if (preview) {
      // Preview mode: call AI service for categorization
      return generatePreview(validRows, accountCache);
    } else {
      // Persist mode: save all transactions
      return persistTransactions(validRows, accountCache);
    }
  }

  private ImportPreviewResponse generatePreview(
      List<CsvTransactionParser.ParsedRow> rows, Map<UUID, Account> accountCache) {

    // Build TxnPayload list for AI categorization
    List<TxnPayload> txnPayloads =
        rows.stream()
            .map(
                row ->
                    TxnPayload.builder()
                        .date(row.postedAt().toString())
                        .amount(row.amount())
                        .category(row.category() != null ? row.category() : "None")
                        .direction(row.direction().name())
                        .description(row.description())
                        .merchant(row.merchant())
                        .build())
            .toList();

    // Call AI service with fallback to rule-based categorization
    List<Map<String, Object>> aiPredictions;
    try {
      aiPredictions = aiClientService.categorize(txnPayloads);
    } catch (Exception e) {
      log.error("AI categorization failed", e);
      // If AI fails, return preview without suggestions
      aiPredictions = List.of();
    }

    // Build preview rows
    List<ImportPreviewResponse.RowPreview> previews = new ArrayList<>();
    for (int i = 0; i < rows.size(); i++) {
      var row = rows.get(i);

      String suggestedCategory = null;
      String reason = null;

      if (i < aiPredictions.size()) {
        Map<String, Object> prediction = aiPredictions.get(i);
        suggestedCategory = (String) prediction.get("guessCategory");
        reason = (String) prediction.get("reason");
      }

      previews.add(
          new ImportPreviewResponse.RowPreview(
              row.rowNumber(),
              row.postedAt(),
              row.amount(),
              row.direction().name(),
              row.description(),
              row.merchant(),
              row.category(),
              suggestedCategory,
              reason));
    }

    return new ImportPreviewResponse(rows.size(), rows.size(), 0, previews, List.of());
  }

  private ImportPreviewResponse persistTransactions(
      List<CsvTransactionParser.ParsedRow> rows, Map<UUID, Account> accountCache) {

    int insertedCount = 0;

    for (var row : rows) {
      Account account = accountCache.get(row.accountId());

      Transaction transaction = new Transaction();
      transaction.setAccount(account);
      transaction.setPostedAt(row.postedAt());
      transaction.setAmount(row.amount());
      transaction.setDirection(row.direction());
      transaction.setDescription(row.description());
      transaction.setMerchant(row.merchant());

      // Try to match category by name if provided
      if (row.category() != null && !row.category().isBlank()) {
        categoryRepository.findAll().stream()
            .filter(c -> c.getName().equalsIgnoreCase(row.category().trim()))
            .findFirst()
            .ifPresent(transaction::setCategory);
      }

      // Update account balance
      updateAccountBalance(account, row.amount(), row.direction(), true);

      transactionRepository.save(transaction);
      insertedCount++;
    }

    log.info("Imported {} transactions from CSV", insertedCount);

    // Return success response (null for non-preview mode, controller will convert)
    return new ImportPreviewResponse(rows.size(), insertedCount, 0, List.of(), List.of());
  }

  /**
   * Bulk delete transactions.
   *
   * @param userId User ID
   * @param transactionIds List of transaction IDs to delete
   * @return Number of deleted transactions
   */
  @Transactional
  public int bulkDelete(UUID userId, List<UUID> transactionIds) {
    int deletedCount = 0;

    for (UUID transactionId : transactionIds) {
      try {
        Transaction transaction = getById(userId, transactionId);

        // Revert balance impact
        updateAccountBalance(
            transaction.getAccount(), transaction.getAmount(), transaction.getDirection(), false);

        transactionRepository.delete(transaction);
        deletedCount++;
      } catch (EntityNotFoundException e) {
        log.warn("Transaction {} not found or not owned by user {}", transactionId, userId);
        // Skip non-existent or unauthorized transactions
      }
    }

    log.info("Bulk deleted {} transactions for user {}", deletedCount, userId);
    return deletedCount;
  }

  /**
   * Bulk recategorize transactions.
   *
   * @param userId User ID
   * @param transactionIds List of transaction IDs to recategorize
   * @param categoryId New category ID (null to clear category)
   * @return Number of recategorized transactions
   */
  @Transactional
  public int bulkRecategorise(UUID userId, List<UUID> transactionIds, UUID categoryId) {
    Category category = null;

    if (categoryId != null) {
      category =
          categoryRepository
              .findById(categoryId)
              .orElseThrow(
                  () -> new EntityNotFoundException("Category not found with id: " + categoryId));
    }

    int recategorizedCount = 0;

    for (UUID transactionId : transactionIds) {
      try {
        Transaction transaction = getById(userId, transactionId);
        transaction.setCategory(category);
        transactionRepository.save(transaction);
        recategorizedCount++;
      } catch (EntityNotFoundException e) {
        log.warn("Transaction {} not found or not owned by user {}", transactionId, userId);
        // Skip non-existent or unauthorized transactions
      }
    }

    log.info("Bulk recategorized {} transactions for user {}", recategorizedCount, userId);
    return recategorizedCount;
  }
}
