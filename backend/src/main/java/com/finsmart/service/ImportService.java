package com.finsmart.service;

import com.finsmart.domain.entity.*;
import com.finsmart.domain.enums.TransactionDirection;
import com.finsmart.domain.repo.*;
import com.finsmart.util.CsvParserUtil;
import com.finsmart.util.TransactionHashUtil;
import jakarta.persistence.EntityNotFoundException;
import java.io.Reader;
import java.io.StringReader;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Service for importing transactions from CSV files. */
@Slf4j
@Service
@RequiredArgsConstructor
public class ImportService {

  private final ImportBatchRepository importBatchRepository;
  private final ImportRowRepository importRowRepository;
  private final TransactionRepository transactionRepository;
  private final AccountRepository accountRepository;
  private final CategoryRepository categoryRepository;
  private final RuleService ruleService;

  /**
   * Preview CSV import without committing transactions.
   *
   * @param userId user ID
   * @param accountId account ID for transactions
   * @param csvContent CSV file content
   * @param csvFilename original filename
   * @param headerMapping optional header mapping (CSV header -> field name)
   * @return import preview with validation results
   */
  @Transactional
  public ImportPreview previewImport(
      UUID userId,
      UUID accountId,
      String csvContent,
      String csvFilename,
      Map<String, String> headerMapping) {

    // Validate account ownership
    Account account =
        accountRepository
            .findById(accountId)
            .orElseThrow(() -> new EntityNotFoundException("Account not found: " + accountId));

    if (!account.getUser().getId().equals(userId)) {
      throw new EntityNotFoundException("Account not found: " + accountId);
    }

    // Create import batch
    ImportBatch batch = new ImportBatch();
    batch.setUserId(userId);
    batch.setStatus("PREVIEW");
    batch.setFilename(csvFilename != null ? csvFilename : "preview.csv");
    batch.setSource("CSV_UPLOAD");
    batch.setRowCount(0);
    batch = importBatchRepository.save(batch);

    try {
      // Parse CSV
      Reader reader = new StringReader(csvContent);
      List<Map<String, String>> rows =
          headerMapping != null && !headerMapping.isEmpty()
              ? CsvParserUtil.parseWithMapping(reader, headerMapping)
              : CsvParserUtil.parse(reader);

      batch.setRowCount(rows.size());

      int rowNumber = 1;
      for (Map<String, String> row : rows) {
        processImportRow(batch, account, row, rowNumber++);
      }

      batch = importBatchRepository.save(batch);

      // Get statistics
      int validRows = (int) importRowRepository.countValidNonDuplicates(batch.getId());
      int duplicateRows = (int) importRowRepository.countDuplicates(batch.getId());
      int errorRows = (int) importRowRepository.countErrors(batch.getId());

      log.info(
          "Preview completed for batch {}: {} total, {} valid, {} duplicates, {} errors",
          batch.getId(),
          batch.getRowCount(),
          validRows,
          duplicateRows,
          errorRows);

      return new ImportPreview(batch, importRowRepository.findByBatchId(batch.getId()));

    } catch (Exception e) {
      batch.setStatus("FAILED");
      importBatchRepository.save(batch);
      throw new RuntimeException("Failed to preview import: " + e.getMessage(), e);
    }
  }

  /**
   * Commit a previewed import batch to create actual transactions.
   *
   * @param userId user ID
   * @param accountId account ID to import into
   * @param batchId batch ID to commit
   * @return committed batch
   */
  @Transactional
  public ImportBatch commitImport(UUID userId, UUID accountId, UUID batchId) {
    ImportBatch batch =
        importBatchRepository
            .findById(batchId)
            .orElseThrow(() -> new EntityNotFoundException("Import batch not found: " + batchId));

    if (!batch.getUserId().equals(userId)) {
      throw new EntityNotFoundException("Import batch not found: " + batchId);
    }

    if (!"PREVIEW".equals(batch.getStatus())) {
      throw new IllegalStateException("Batch is not in PREVIEW status: " + batch.getStatus());
    }

    try {
      Account account =
          accountRepository
              .findById(accountId)
              .orElseThrow(() -> new EntityNotFoundException("Account not found: " + accountId));

      if (!account.getUser().getId().equals(userId)) {
        throw new EntityNotFoundException("Account not found: " + accountId);
      }

      // Get all valid, non-duplicate rows
      List<ImportRow> validRows = importRowRepository.findValidNonDuplicates(batchId);

      int committed = 0;
      for (ImportRow row : validRows) {
        Transaction txn = createTransactionFromRow(userId, account, row);
        transactionRepository.save(txn);
        committed++;
      }

      batch.setStatus("COMMITTED");
      batch = importBatchRepository.save(batch);

      log.info("Committed batch {}: {} transactions created", batchId, committed);

      return batch;

    } catch (Exception e) {
      batch.setStatus("FAILED");
      importBatchRepository.save(batch);
      throw new RuntimeException("Failed to commit import: " + e.getMessage(), e);
    }
  }

  /**
   * Undo a committed import batch (soft delete transactions).
   *
   * @param userId user ID
   * @param accountId account ID
   * @param batchId batch ID to undo
   * @return undone batch
   */
  @Transactional
  public ImportBatch undoImport(UUID userId, UUID accountId, UUID batchId) {
    ImportBatch batch =
        importBatchRepository
            .findById(batchId)
            .orElseThrow(() -> new EntityNotFoundException("Import batch not found: " + batchId));

    if (!batch.getUserId().equals(userId)) {
      throw new EntityNotFoundException("Import batch not found: " + batchId);
    }

    if (!"COMMITTED".equals(batch.getStatus())) {
      throw new IllegalStateException("Batch is not in COMMITTED status: " + batch.getStatus());
    }

    Account account =
        accountRepository
            .findById(accountId)
            .orElseThrow(() -> new EntityNotFoundException("Account not found: " + accountId));

    // Get all rows and delete corresponding transactions
    List<ImportRow> rows = importRowRepository.findByBatchId(batchId);
    int deleted = 0;

    for (ImportRow row : rows) {
      if (row.getNormalizedData() != null) {
        Map<String, Object> data = row.getNormalizedData();
        String hash =
            TransactionHashUtil.computeHash(
                Instant.parse((String) data.get("date")),
                new BigDecimal((String) data.get("amount")),
                TransactionDirection.valueOf((String) data.get("direction")),
                (String) data.get("merchant"),
                (String) data.get("description"),
                account.getId());

        Optional<Transaction> txn = transactionRepository.findByHash(hash);
        if (txn.isPresent()) {
          transactionRepository.delete(txn.get());
          deleted++;
        }
      }
    }

    batch.setStatus("UNDONE");
    batch = importBatchRepository.save(batch);

    log.info("Undone batch {}: {} transactions deleted", batchId, deleted);

    return batch;
  }

  /**
   * Get import batch by ID.
   *
   * @param userId user ID
   * @param batchId batch ID
   * @return import batch
   */
  @Transactional(readOnly = true)
  public ImportBatch getBatch(UUID userId, UUID batchId) {
    ImportBatch batch =
        importBatchRepository
            .findById(batchId)
            .orElseThrow(() -> new EntityNotFoundException("Import batch not found: " + batchId));

    if (!batch.getUserId().equals(userId)) {
      throw new EntityNotFoundException("Import batch not found: " + batchId);
    }

    return batch;
  }

  /**
   * List import batches for a user.
   *
   * @param userId user ID
   * @param pageable pagination
   * @return page of import batches
   */
  @Transactional(readOnly = true)
  public Page<ImportBatch> listBatches(UUID userId, Pageable pageable) {
    return importBatchRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
  }

  /**
   * Get rows for an import batch.
   *
   * @param userId user ID
   * @param batchId batch ID
   * @return list of import rows
   */
  @Transactional(readOnly = true)
  public List<ImportRow> getBatchRows(UUID userId, UUID batchId) {
    // Verify batch ownership
    getBatch(userId, batchId);

    return importRowRepository.findByBatchId(batchId);
  }

  /** Process a single CSV row and create ImportRow entity. */
  private void processImportRow(
      ImportBatch batch, Account account, Map<String, String> row, int rowNumber) {

    ImportRow importRow = new ImportRow();
    importRow.setBatch(batch);
    importRow.setRowNo(rowNumber);
    importRow.setRawData(row);

    try {
      // Parse and normalize data
      Map<String, Object> normalized = new HashMap<>();

      // Parse date (required)
      String dateStr = getRequiredField(row, "date");
      Instant postedAt = parseDate(dateStr);
      normalized.put("date", postedAt.toString());

      // Parse amount (required)
      String amountStr = getRequiredField(row, "amount");
      BigDecimal amount = parseAmount(amountStr);
      normalized.put("amount", amount.toPlainString());

      // Parse direction (optional, default to DEBIT if amount negative)
      TransactionDirection direction =
          row.containsKey("direction")
              ? parseDirection(row.get("direction"))
              : (amount.compareTo(BigDecimal.ZERO) < 0
                  ? TransactionDirection.DEBIT
                  : TransactionDirection.CREDIT);

      // Use absolute value for amount
      amount = amount.abs();
      normalized.put("direction", direction.name());

      // Parse merchant (optional)
      String merchant = row.getOrDefault("merchant", "").trim();
      if (merchant.isEmpty()) {
        merchant = "Unknown";
      }
      normalized.put("merchant", merchant);

      // Parse description (optional)
      String description = row.getOrDefault("description", "").trim();
      normalized.put("description", description);

      importRow.setNormalizedData(normalized);

      // Compute hash for duplicate detection
      String hash =
          TransactionHashUtil.computeHash(
              postedAt, amount, direction, merchant, description, account.getId());

      // Check for duplicates
      if (transactionRepository.existsByHash(hash)) {
        Optional<Transaction> duplicate = transactionRepository.findByHash(hash);
        duplicate.ifPresent(importRow::setDuplicateOf);
      }

      // Apply rules to suggest category
      Optional<UUID> suggestedCategoryId =
          ruleService.suggestCategory(batch.getUserId(), merchant, description);
      if (suggestedCategoryId.isPresent()) {
        Category category = categoryRepository.findById(suggestedCategoryId.get()).orElse(null);
        importRow.setSuggestedCategory(category);
      }

      importRow.setError(null);

    } catch (Exception e) {
      importRow.setError(e.getMessage());
      log.debug("Error processing row {}: {}", rowNumber, e.getMessage());
    }

    importRowRepository.save(importRow);
  }

  /** Create Transaction from ImportRow. */
  private Transaction createTransactionFromRow(UUID userId, Account account, ImportRow row) {
    Map<String, Object> data = row.getNormalizedData();

    // Parse normalized data
    Instant postedAt = Instant.parse((String) data.get("date"));
    BigDecimal amount = new BigDecimal((String) data.get("amount"));
    TransactionDirection direction = TransactionDirection.valueOf((String) data.get("direction"));
    String merchant = (String) data.get("merchant");
    String description = (String) data.get("description");

    // Compute hash
    String hash =
        TransactionHashUtil.computeHash(
            postedAt, amount, direction, merchant, description, account.getId());

    Transaction txn = new Transaction();
    txn.setAccount(account);
    txn.setPostedAt(postedAt);
    txn.setAmount(amount);
    txn.setDirection(direction);
    txn.setMerchant(merchant);
    txn.setDescription(description);
    txn.setHash(hash);

    // Apply suggested category
    if (row.getSuggestedCategory() != null) {
      txn.setCategory(row.getSuggestedCategory());
    }

    return txn;
  }

  /** Get required field from row. */
  private String getRequiredField(Map<String, String> row, String field) {
    String value = row.get(field);
    if (value == null || value.trim().isEmpty()) {
      throw new IllegalArgumentException("Missing required field: " + field);
    }
    return value.trim();
  }

  /** Parse date from string (supports multiple formats). */
  private Instant parseDate(String dateStr) {
    List<DateTimeFormatter> formatters =
        List.of(
            DateTimeFormatter.ISO_LOCAL_DATE, // 2024-01-15
            DateTimeFormatter.ofPattern("MM/dd/yyyy"), // 01/15/2024
            DateTimeFormatter.ofPattern("dd/MM/yyyy"), // 15/01/2024
            DateTimeFormatter.ofPattern("yyyy-MM-dd") // 2024-01-15
            );

    for (DateTimeFormatter formatter : formatters) {
      try {
        LocalDate date = LocalDate.parse(dateStr, formatter);
        return date.atStartOfDay(ZoneOffset.UTC).toInstant();
      } catch (DateTimeParseException e) {
        // Try next formatter
      }
    }

    throw new IllegalArgumentException("Invalid date format: " + dateStr);
  }

  /** Parse amount from string. */
  private BigDecimal parseAmount(String amountStr) {
    try {
      // Remove currency symbols and commas
      String cleaned = amountStr.replaceAll("[^0-9.\\-]", "");
      return new BigDecimal(cleaned);
    } catch (NumberFormatException e) {
      throw new IllegalArgumentException("Invalid amount format: " + amountStr);
    }
  }

  /** Parse transaction direction. */
  private TransactionDirection parseDirection(String directionStr) {
    String normalized = directionStr.trim().toUpperCase();
    return switch (normalized) {
      case "DEBIT", "DR", "OUT", "-" -> TransactionDirection.DEBIT;
      case "CREDIT", "CR", "IN", "+" -> TransactionDirection.CREDIT;
      default -> throw new IllegalArgumentException("Invalid direction: " + directionStr);
    };
  }

  /** Import preview result. */
  public record ImportPreview(ImportBatch batch, List<ImportRow> rows) {}
}
