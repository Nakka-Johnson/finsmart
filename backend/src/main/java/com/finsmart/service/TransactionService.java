package com.finsmart.service;

import com.finsmart.domain.entity.Account;
import com.finsmart.domain.entity.Category;
import com.finsmart.domain.entity.Transaction;
import com.finsmart.domain.enums.TransactionDirection;
import com.finsmart.domain.repo.AccountRepository;
import com.finsmart.domain.repo.CategoryRepository;
import com.finsmart.domain.repo.TransactionRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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

    // Verify account belongs to user
    Account account = getAccountAndVerifyOwnership(userId, accountId);

    Specification<Transaction> spec =
        (root, criteriaQuery, criteriaBuilder) -> {
          List<Predicate> predicates = new ArrayList<>();

          predicates.add(criteriaBuilder.equal(root.get("account"), account));

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
}
