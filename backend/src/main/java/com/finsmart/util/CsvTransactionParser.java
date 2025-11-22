package com.finsmart.util;

import com.finsmart.domain.enums.TransactionDirection;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;

/**
 * Utility to parse CSV files containing transaction data.
 *
 * <p>Accepted CSV columns (case-insensitive):
 *
 * <ul>
 *   <li>date (required): Date in ISO format (yyyy-MM-dd) or other common formats
 *   <li>amount (required): Decimal amount (positive)
 *   <li>direction (required): DEBIT, CREDIT, IN, or OUT
 *   <li>description (optional): Transaction description
 *   <li>merchant (optional): Merchant name
 *   <li>category (optional): Category name or ID
 *   <li>accountId (optional in CSV, can be provided via parameter): Account UUID
 * </ul>
 */
@Slf4j
public class CsvTransactionParser {

  private static final List<DateTimeFormatter> DATE_FORMATTERS =
      List.of(
          DateTimeFormatter.ISO_LOCAL_DATE, // yyyy-MM-dd
          DateTimeFormatter.ofPattern("dd/MM/yyyy"),
          DateTimeFormatter.ofPattern("MM/dd/yyyy"),
          DateTimeFormatter.ofPattern("dd-MM-yyyy"),
          DateTimeFormatter.ofPattern("yyyy/MM/dd"));

  /**
   * Parse CSV input stream and return parsed rows with validation.
   *
   * @param inputStream CSV file input stream
   * @param defaultAccountId Default account ID if not in CSV
   * @return ParseResult containing valid rows and errors
   */
  public static ParseResult parse(InputStream inputStream, UUID defaultAccountId)
      throws IOException {
    List<ParsedRow> validRows = new ArrayList<>();
    List<RowError> errors = new ArrayList<>();

    try (InputStreamReader reader = new InputStreamReader(inputStream, StandardCharsets.UTF_8);
        CSVParser csvParser =
            CSVFormat.DEFAULT
                .builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .build()
                .parse(reader)) {

      int rowNumber = 1; // Header is row 0

      for (CSVRecord record : csvParser) {
        rowNumber++;
        try {
          ParsedRow row = parseRow(record, rowNumber, defaultAccountId);
          validRows.add(row);
        } catch (ValidationException e) {
          errors.add(new RowError(rowNumber, e.getMessage()));
        }
      }
    }

    return new ParseResult(validRows, errors);
  }

  private static ParsedRow parseRow(CSVRecord record, int rowNumber, UUID defaultAccountId)
      throws ValidationException {

    // Parse date (required)
    Instant postedAt = parseDate(getColumn(record, "date"), rowNumber);

    // Parse amount (required)
    BigDecimal amount = parseAmount(getColumn(record, "amount"), rowNumber);

    // Parse direction (required)
    TransactionDirection direction = parseDirection(getColumn(record, "direction"), rowNumber);

    // Parse optional fields
    String description = getColumnOrNull(record, "description");
    String merchant = getColumnOrNull(record, "merchant");
    String category = getColumnOrNull(record, "category");

    // Parse accountId (optional in CSV)
    UUID accountId = defaultAccountId;
    String accountIdStr = getColumnOrNull(record, "accountId", "accountid", "account_id");
    if (accountIdStr != null && !accountIdStr.isBlank()) {
      try {
        accountId = UUID.fromString(accountIdStr.trim());
      } catch (IllegalArgumentException e) {
        throw new ValidationException("Invalid accountId format: " + accountIdStr);
      }
    }

    if (accountId == null) {
      throw new ValidationException("accountId is required (either in CSV or as parameter)");
    }

    return new ParsedRow(
        rowNumber, accountId, postedAt, amount, direction, description, merchant, category);
  }

  private static Instant parseDate(String dateStr, int rowNumber) throws ValidationException {
    if (dateStr == null || dateStr.isBlank()) {
      throw new ValidationException("Date is required");
    }

    for (DateTimeFormatter formatter : DATE_FORMATTERS) {
      try {
        LocalDate localDate = LocalDate.parse(dateStr.trim(), formatter);
        return localDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
      } catch (DateTimeParseException ignored) {
        // Try next formatter
      }
    }

    throw new ValidationException(
        "Invalid date format: '"
            + dateStr
            + "'. Expected formats: yyyy-MM-dd, dd/MM/yyyy, MM/dd/yyyy, dd-MM-yyyy, yyyy/MM/dd");
  }

  private static BigDecimal parseAmount(String amountStr, int rowNumber)
      throws ValidationException {
    if (amountStr == null || amountStr.isBlank()) {
      throw new ValidationException("Amount is required");
    }

    try {
      // Remove common currency symbols and whitespace
      String cleaned =
          amountStr.trim().replaceAll("[£$€,\\s]", "").replace("−", "-"); // Handle minus sign
      BigDecimal amount = new BigDecimal(cleaned);

      if (amount.compareTo(BigDecimal.ZERO) < 0) {
        throw new ValidationException("Amount must be >= 0 (use direction for debit/credit)");
      }

      return amount;
    } catch (NumberFormatException e) {
      throw new ValidationException("Invalid amount format: '" + amountStr + "'");
    }
  }

  private static TransactionDirection parseDirection(String directionStr, int rowNumber)
      throws ValidationException {
    if (directionStr == null || directionStr.isBlank()) {
      throw new ValidationException("Direction is required");
    }

    String normalized = directionStr.trim().toUpperCase();

    // Support DEBIT/CREDIT and IN/OUT
    return switch (normalized) {
      case "DEBIT", "OUT" -> TransactionDirection.DEBIT;
      case "CREDIT", "IN" -> TransactionDirection.CREDIT;
      default ->
          throw new ValidationException(
              "Invalid direction: '" + directionStr + "'. Expected: DEBIT, CREDIT, IN, or OUT");
    };
  }

  private static String getColumn(CSVRecord record, String... columnNames)
      throws ValidationException {
    for (String name : columnNames) {
      if (record.isMapped(name)) {
        return record.get(name);
      }
    }
    throw new ValidationException("Required column '" + columnNames[0] + "' not found");
  }

  private static String getColumnOrNull(CSVRecord record, String... columnNames) {
    for (String name : columnNames) {
      if (record.isMapped(name)) {
        String value = record.get(name);
        return (value != null && !value.isBlank()) ? value.trim() : null;
      }
    }
    return null;
  }

  /** Represents a successfully parsed CSV row. */
  public record ParsedRow(
      int rowNumber,
      UUID accountId,
      Instant postedAt,
      BigDecimal amount,
      TransactionDirection direction,
      String description,
      String merchant,
      String category) {}

  /** Represents a row-level parsing error. */
  public record RowError(int rowNumber, String message) {}

  /** Result of CSV parsing. */
  public record ParseResult(List<ParsedRow> validRows, List<RowError> errors) {
    public boolean hasErrors() {
      return !errors.isEmpty();
    }

    public int totalRows() {
      return validRows.size() + errors.size();
    }
  }

  /** Validation exception for row-level errors. */
  private static class ValidationException extends Exception {
    public ValidationException(String message) {
      super(message);
    }
  }
}
