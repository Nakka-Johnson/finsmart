package com.finsmart.service;

import com.finsmart.domain.entity.Budget;
import com.finsmart.domain.entity.Category;
import com.finsmart.domain.entity.User;
import com.finsmart.domain.enums.TransactionDirection;
import com.finsmart.domain.repo.BudgetRepository;
import com.finsmart.domain.repo.CategoryRepository;
import com.finsmart.domain.repo.TransactionRepository;
import com.finsmart.domain.repo.UserRepository;
import com.finsmart.web.dto.budget.BudgetSummaryResponse;
import com.finsmart.web.error.DuplicateResourceException;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BudgetService {

  private final BudgetRepository budgetRepository;
  private final CategoryRepository categoryRepository;
  private final UserRepository userRepository;
  private final TransactionRepository transactionRepository;

  @Transactional(readOnly = true)
  public List<Budget> listBudgets(UUID userId, Integer month, Integer year) {
    if (month != null && year != null) {
      return budgetRepository.findByUserIdAndMonthAndYear(userId, month, year);
    }
    return budgetRepository.findByUserId(userId);
  }

  @Transactional(readOnly = true)
  public Budget getById(UUID userId, UUID budgetId) {
    Budget budget =
        budgetRepository
            .findById(budgetId)
            .orElseThrow(
                () -> new EntityNotFoundException("Budget not found with id: " + budgetId));

    // Verify ownership
    if (!budget.getUser().getId().equals(userId)) {
      throw new EntityNotFoundException("Budget not found with id: " + budgetId);
    }

    return budget;
  }

  @Transactional
  public Budget createBudget(
      UUID userId, UUID categoryId, Integer month, Integer year, BigDecimal limitAmount) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));

    Category category =
        categoryRepository
            .findById(categoryId)
            .orElseThrow(
                () -> new EntityNotFoundException("Category not found with id: " + categoryId));

    // Check for duplicate
    if (budgetRepository.existsByUserIdAndCategoryIdAndMonthAndYear(
        userId, categoryId, month, year)) {
      throw new DuplicateResourceException(
          "Budget already exists for category '"
              + category.getName()
              + "' in "
              + month
              + "/"
              + year);
    }

    Budget budget = new Budget();
    budget.setUser(user);
    budget.setCategory(category);
    budget.setMonth(month);
    budget.setYear(year);
    budget.setLimitAmount(limitAmount);

    Budget saved = budgetRepository.save(budget);
    log.info(
        "Created budget: {} for category {} (id: {})",
        limitAmount,
        category.getName(),
        saved.getId());
    return saved;
  }

  @Transactional
  public Budget updateBudget(
      UUID userId,
      UUID budgetId,
      UUID categoryId,
      Integer month,
      Integer year,
      BigDecimal limitAmount) {
    Budget budget = getById(userId, budgetId);

    // If changing category/month/year, check for duplicates
    boolean changed =
        !budget.getCategory().getId().equals(categoryId)
            || !budget.getMonth().equals(month)
            || !budget.getYear().equals(year);

    if (changed
        && budgetRepository.existsByUserIdAndCategoryIdAndMonthAndYear(
            userId, categoryId, month, year)) {
      throw new DuplicateResourceException(
          "Budget already exists for the specified category and period");
    }

    if (changed) {
      Category category =
          categoryRepository
              .findById(categoryId)
              .orElseThrow(
                  () -> new EntityNotFoundException("Category not found with id: " + categoryId));
      budget.setCategory(category);
    }

    budget.setMonth(month);
    budget.setYear(year);
    budget.setLimitAmount(limitAmount);

    Budget saved = budgetRepository.save(budget);
    log.info("Updated budget: {} (id: {})", saved.getId(), budgetId);
    return saved;
  }

  @Transactional
  public void deleteBudget(UUID userId, UUID budgetId) {
    Budget budget = getById(userId, budgetId);
    budgetRepository.delete(budget);
    log.info("Deleted budget: {} (id: {})", budget.getId(), budgetId);
  }

  @Transactional(readOnly = true)
  public List<BudgetSummaryResponse> getBudgetSummary(UUID userId, Integer month, Integer year) {
    List<Budget> budgets = budgetRepository.findByUserIdAndMonthAndYear(userId, month, year);

    // Calculate date range for the month
    LocalDate startDate = LocalDate.of(year, month, 1);
    LocalDate endDate = startDate.plusMonths(1).minusDays(1);
    Instant startInstant = startDate.atStartOfDay(ZoneOffset.UTC).toInstant();
    Instant endInstant = endDate.atTime(23, 59, 59).atZone(ZoneOffset.UTC).toInstant();

    return budgets.stream()
        .map(
            budget -> {
              BigDecimal spentAmount =
                  transactionRepository
                      .sumAmountByUserAndCategoryAndDirectionAndDateRange(
                          userId,
                          budget.getCategory().getId(),
                          TransactionDirection.DEBIT,
                          startInstant,
                          endInstant)
                      .orElse(BigDecimal.ZERO);

              Double percentUsed;
              if (budget.getLimitAmount().compareTo(BigDecimal.ZERO) == 0) {
                percentUsed = 0.0;
              } else {
                percentUsed =
                    spentAmount
                        .divide(budget.getLimitAmount(), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"))
                        .setScale(1, RoundingMode.HALF_UP)
                        .doubleValue();
              }

              return new BudgetSummaryResponse(
                  budget.getCategory().getId(),
                  budget.getCategory().getName(),
                  budget.getLimitAmount(),
                  spentAmount,
                  percentUsed);
            })
        .toList();
  }
}
