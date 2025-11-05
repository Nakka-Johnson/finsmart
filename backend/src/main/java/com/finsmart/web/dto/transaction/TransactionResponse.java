package com.finsmart.web.dto.transaction;

import com.finsmart.domain.enums.TransactionDirection;
import com.finsmart.web.dto.category.CategoryResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TransactionResponse(
    UUID id,
    UUID accountId,
    Instant postedAt,
    BigDecimal amount,
    TransactionDirection direction,
    String description,
    CategoryResponse category,
    String merchant,
    String notes,
    Instant createdAt) {}
