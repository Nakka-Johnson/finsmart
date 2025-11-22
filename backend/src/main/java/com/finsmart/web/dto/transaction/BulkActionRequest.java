package com.finsmart.web.dto.transaction;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

/** Request for bulk transaction operations (DELETE or RECATEGORISE). */
public record BulkActionRequest(
    @NotNull(message = "Action is required") BulkAction action,
    @NotEmpty(message = "Transaction IDs cannot be empty") List<UUID> ids,
    UUID categoryId // Required only for RECATEGORISE
    ) {

  public enum BulkAction {
    DELETE,
    RECATEGORISE
  }
}
