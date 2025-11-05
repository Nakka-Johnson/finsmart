package com.finsmart.web.dto.budget;

import java.math.BigDecimal;
import java.util.UUID;

public record BudgetSummaryResponse(
    UUID categoryId,
    String categoryName,
    BigDecimal limitAmount,
    BigDecimal spentAmount,
    Double percentUsed) {}
