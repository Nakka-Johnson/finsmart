package com.finsmart.web.dto.transaction;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Response for CSV import preview with AI categorization suggestions. */
public record ImportPreviewResponse(
    int totalRows, int validRows, int invalidRows, List<RowPreview> rows, List<RowError> errors) {

  public record RowPreview(
      int rowNumber,
      Instant postedAt,
      BigDecimal amount,
      String direction,
      String description,
      String merchant,
      String originalCategory,
      String suggestedCategory,
      String categorizationReason) {}

  public record RowError(int rowNumber, String message) {}
}
