package com.finsmart.web.dto.insights;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.Builder;

/**
 * Response DTO for GET /api/insights/summary Contains all key metrics computed from actual
 * transaction data.
 */
@Builder
public record InsightsSummaryResponse(
    BigDecimal currentBalance,
    BigDecimal totalIncome,
    BigDecimal totalSpending,
    BigDecimal netFlow,
    List<CategorySpend> spendByCategory,
    List<TopMerchant> topMerchants,
    List<AnomalyPreview> anomaliesPreview,
    List<ChangeNarrative> changeNarrative,
    int transactionCount,
    String periodStart,
    String periodEnd) {
  @Builder
  public record CategorySpend(
      UUID categoryId, String name, String color, BigDecimal total, int transactionCount) {}

  @Builder
  public record TopMerchant(String merchantName, BigDecimal total, int txCount) {}

  @Builder
  public record AnomalyPreview(
      String merchantName, String reason, BigDecimal amount, double score) {}

  @Builder
  public record ChangeNarrative(String label, BigDecimal delta, String note) {}
}
