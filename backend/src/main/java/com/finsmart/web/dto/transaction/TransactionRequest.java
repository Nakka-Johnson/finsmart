package com.finsmart.web.dto.transaction;

import com.finsmart.domain.enums.TransactionDirection;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TransactionRequest(
    @NotNull(message = "Account ID is required") UUID accountId,
    @NotNull(message = "Posted date is required") Instant postedAt,
    @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.0", inclusive = true, message = "Amount must be >= 0")
        BigDecimal amount,
    @NotNull(message = "Direction is required") TransactionDirection direction,
    @Size(max = 500, message = "Description must not exceed 500 characters") String description,
    UUID categoryId,
    @Size(max = 200, message = "Merchant name must not exceed 200 characters") String merchant,
    @Size(max = 1000, message = "Notes must not exceed 1000 characters") String notes) {}
