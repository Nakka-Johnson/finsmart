package com.finsmart.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for anomaly detection results.
 *
 * <p>Sprint-1: Enhanced with AI-powered anomaly detection and user feedback tracking.
 */
public record AnomalyDTO(
    UUID transactionId,
    LocalDate date,
    BigDecimal amount,
    String category,
    String description,
    Double score,
    Boolean isAnomaly,
    String status // PENDING, SNOOZED, CONFIRMED, IGNORED, null if not tracked
    ) {}
