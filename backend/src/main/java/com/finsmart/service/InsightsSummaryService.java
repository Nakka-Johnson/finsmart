package com.finsmart.service;

import com.finsmart.domain.entity.Account;
import com.finsmart.domain.entity.Transaction;
import com.finsmart.domain.repo.AccountRepository;
import com.finsmart.domain.repo.TransactionRepository;
import com.finsmart.web.dto.insights.InsightsSummaryResponse;
import com.finsmart.web.dto.insights.InsightsSummaryResponse.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Service for computing dashboard insights summary from actual transaction data. */
@Slf4j
@Service
@RequiredArgsConstructor
public class InsightsSummaryService {

  private final TransactionRepository transactionRepository;
  private final AccountRepository accountRepository;

  public enum DateRange {
    LAST_30_DAYS(30),
    LAST_6_MONTHS(180);

    private final int days;

    DateRange(int days) {
      this.days = days;
    }

    public int getDays() {
      return days;
    }
  }

  /**
   * Build insights summary for a user over a given date range. All values are computed from actual
   * transaction data.
   */
  @Transactional(readOnly = true)
  public InsightsSummaryResponse buildSummary(UUID userId, DateRange range) {
    log.info("Building insights summary for user {} with range {}", userId, range);

    // Calculate date bounds
    Instant endDate = Instant.now();
    Instant startDate = endDate.minus(java.time.Duration.ofDays(range.getDays()));

    DateTimeFormatter isoFormatter = DateTimeFormatter.ISO_INSTANT;

    // Get current balance from all accounts
    List<Account> accounts = accountRepository.findByUserId(userId);
    BigDecimal currentBalance =
        accounts.stream().map(Account::getBalance).reduce(BigDecimal.ZERO, BigDecimal::add);

    // Get income and spending totals
    BigDecimal totalIncome =
        transactionRepository.sumIncomeByUserAndDateRange(userId, startDate, endDate);
    BigDecimal totalSpending =
        transactionRepository.sumSpendingByUserAndDateRange(userId, startDate, endDate);
    BigDecimal netFlow = totalIncome.subtract(totalSpending);

    // Get spending by category
    List<Object[]> categoryData =
        transactionRepository.sumSpendingByCategoryForUser(userId, startDate, endDate);
    List<CategorySpend> spendByCategory =
        categoryData.stream()
            .limit(10) // Top 10 categories
            .map(
                row ->
                    CategorySpend.builder()
                        .categoryId((UUID) row[0])
                        .name((String) row[1])
                        .color((String) row[2])
                        .total((BigDecimal) row[3])
                        .transactionCount(((Long) row[4]).intValue())
                        .build())
            .toList();

    // Get top merchants
    List<Object[]> merchantData =
        transactionRepository.sumSpendingByMerchantForUser(userId, startDate, endDate);
    List<TopMerchant> topMerchants =
        merchantData.stream()
            .limit(10) // Top 10 merchants
            .map(
                row ->
                    TopMerchant.builder()
                        .merchantName((String) row[0])
                        .total((BigDecimal) row[1])
                        .txCount(((Long) row[2]).intValue())
                        .build())
            .toList();

    // Get anomalies preview (transactions with high anomaly score)
    List<Transaction> recentTransactions =
        transactionRepository.findByUserIdAndPostedAtAfter(userId, startDate);
    List<AnomalyPreview> anomaliesPreview =
        recentTransactions.stream()
            .filter(t -> t.getAnomalyScore() != null && t.getAnomalyScore() > 0.7)
            .limit(5)
            .map(
                t ->
                    AnomalyPreview.builder()
                        .merchantName(
                            t.getNormalizedMerchant() != null
                                ? t.getNormalizedMerchant()
                                : t.getMerchant())
                        .reason(generateAnomalyReason(t))
                        .amount(t.getAmount())
                        .score(t.getAnomalyScore())
                        .build())
            .toList();

    // Build change narratives
    List<ChangeNarrative> changeNarrative =
        buildChangeNarratives(userId, range, totalSpending, spendByCategory);

    // Get transaction count
    int transactionCount =
        transactionRepository.countByUserAndDateRange(userId, startDate, endDate);

    return InsightsSummaryResponse.builder()
        .currentBalance(currentBalance)
        .totalIncome(totalIncome)
        .totalSpending(totalSpending)
        .netFlow(netFlow)
        .spendByCategory(spendByCategory)
        .topMerchants(topMerchants)
        .anomaliesPreview(anomaliesPreview)
        .changeNarrative(changeNarrative)
        .transactionCount(transactionCount)
        .periodStart(isoFormatter.format(startDate))
        .periodEnd(isoFormatter.format(endDate))
        .build();
  }

  /** Generate a human-readable reason for why a transaction was flagged as anomalous. */
  private String generateAnomalyReason(Transaction t) {
    if (t.getAnomalyScore() >= 0.9) {
      return "Unusually large transaction";
    } else if (t.getAnomalyScore() >= 0.8) {
      return "Amount significantly above average";
    } else {
      return "Potential unusual spending pattern";
    }
  }

  /** Build narrative insights comparing current period to previous. */
  private List<ChangeNarrative> buildChangeNarratives(
      UUID userId,
      DateRange range,
      BigDecimal currentSpending,
      List<CategorySpend> currentCategories) {

    List<ChangeNarrative> narratives = new ArrayList<>();

    // Calculate previous period bounds
    Instant currentEnd = Instant.now();
    Instant currentStart = currentEnd.minus(java.time.Duration.ofDays(range.getDays()));
    Instant previousStart = currentStart.minus(java.time.Duration.ofDays(range.getDays()));

    // Get previous period spending
    BigDecimal previousSpending =
        transactionRepository.sumSpendingByUserAndDateRange(userId, previousStart, currentStart);

    // Overall spending change
    if (previousSpending.compareTo(BigDecimal.ZERO) > 0) {
      BigDecimal delta = currentSpending.subtract(previousSpending);
      BigDecimal percentChange =
          delta.divide(previousSpending, 2, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));

      String note;
      if (delta.compareTo(BigDecimal.ZERO) > 0) {
        note = String.format("Spending up %.0f%% vs previous period", percentChange.abs());
      } else if (delta.compareTo(BigDecimal.ZERO) < 0) {
        note = String.format("Spending down %.0f%% vs previous period", percentChange.abs());
      } else {
        note = "Spending unchanged from previous period";
      }

      narratives.add(
          ChangeNarrative.builder().label("Total Spending").delta(delta).note(note).build());
    }

    // Top category insight
    if (!currentCategories.isEmpty()) {
      CategorySpend topCategory = currentCategories.get(0);
      BigDecimal categoryPercent =
          currentSpending.compareTo(BigDecimal.ZERO) > 0
              ? topCategory
                  .total()
                  .divide(currentSpending, 2, RoundingMode.HALF_UP)
                  .multiply(BigDecimal.valueOf(100))
              : BigDecimal.ZERO;

      narratives.add(
          ChangeNarrative.builder()
              .label("Top Category")
              .delta(topCategory.total())
              .note(
                  String.format(
                      "%s accounts for %.0f%% of spending", topCategory.name(), categoryPercent))
              .build());
    }

    return narratives;
  }
}
