package com.finsmart.web.error;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Standard error response format for all API errors.
 *
 * <p>Format: { timestamp, status, error, message, path, details? }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
  private Instant timestamp;
  private Integer status;
  private String error;
  private String message;
  private String path;
  private Map<String, String> details; // Renamed from fieldErrors for consistency
}
