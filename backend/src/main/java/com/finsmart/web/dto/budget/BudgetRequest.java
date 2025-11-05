package com.finsmart.web.dto.budget;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record BudgetRequest(
    @NotNull(message = "Category ID is required") UUID categoryId,
    @NotNull(message = "Month is required")
        @Min(value = 1, message = "Month must be between 1 and 12")
        @Max(value = 12, message = "Month must be between 1 and 12")
        Integer month,
    @NotNull(message = "Year is required")
        @Min(value = 2000, message = "Year must be 2000 or later")
        @Max(value = 2100, message = "Year must be 2100 or earlier")
        Integer year,
    @NotNull(message = "Limit amount is required")
        @DecimalMin(value = "0.0", inclusive = true, message = "Limit amount must be >= 0")
        BigDecimal limitAmount) {}
