package com.finsmart.web.dto.account;

import com.finsmart.domain.enums.AccountType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AccountResponse(
    UUID id,
    UUID userId,
    String name,
    String institution,
    AccountType type,
    String currency,
    BigDecimal balance,
    Instant createdAt) {}
