package com.finsmart.web.dto.transaction;

/** Response for bulk transaction operations. */
public record BulkActionResponse(int affectedCount, String message) {}
