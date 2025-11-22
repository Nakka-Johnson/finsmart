package com.finsmart.web.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for merchant spending insights.
 *
 * <p>Sprint-1: Provides merchant normalization and monthly spending aggregation.
 */
public record MerchantInsightDTO(
    String merchant, List<MonthlyTotal> monthlyTotals, BigDecimal totalSpending) {

  /** Monthly spending total for a merchant. */
  public record MonthlyTotal(String month, BigDecimal total) {}
}
