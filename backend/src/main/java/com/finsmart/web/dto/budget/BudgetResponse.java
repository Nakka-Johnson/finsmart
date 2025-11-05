package com.finsmart.web.dto.budget;

import com.finsmart.web.dto.category.CategoryResponse;
import java.math.BigDecimal;
import java.util.UUID;

public record BudgetResponse(
    UUID id,
    UUID userId,
    CategoryResponse category,
    Integer month,
    Integer year,
    BigDecimal limitAmount) {}
