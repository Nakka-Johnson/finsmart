package com.finsmart.web.controller;

import com.finsmart.domain.entity.ImportBatch;
import com.finsmart.domain.entity.ImportRow;
import com.finsmart.service.ImportService;
import com.finsmart.service.ImportService.ImportPreview;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** Controller for CSV transaction imports. */
@Slf4j
@RestController
@RequestMapping("/api/transactions/import")
@RequiredArgsConstructor
public class ImportController {

  private final ImportService importService;
  private final AuthenticationHelper authHelper;

  @PostMapping
  public ResponseEntity<ImportPreviewResponse> importTransactions(
      @RequestParam("file") MultipartFile file,
      @RequestParam UUID accountId,
      @RequestParam(required = false, defaultValue = "true") boolean preview,
      @RequestParam(required = false) Map<String, String> headerMapping)
      throws Exception {

    UUID userId = authHelper.getCurrentUserId();

    log.info(
        "Importing CSV file: {} ({} bytes) for account {} (preview={})",
        file.getOriginalFilename(),
        file.getSize(),
        accountId,
        preview);

    String csvContent = new String(file.getBytes());
    String filename = file.getOriginalFilename();

    if (preview) {
      ImportPreview result =
          importService.previewImport(userId, accountId, csvContent, filename, headerMapping);

      return ResponseEntity.ok(toImportPreviewResponse(result));
    } else {
      // Direct commit without preview (not recommended)
      ImportPreview previewResult =
          importService.previewImport(userId, accountId, csvContent, filename, headerMapping);

      ImportBatch committed =
          importService.commitImport(userId, accountId, previewResult.batch().getId());

      return ResponseEntity.status(HttpStatus.CREATED)
          .body(
              new ImportPreviewResponse(
                  toBatchResponse(committed),
                  previewResult.rows().stream()
                      .map(this::toRowResponse)
                      .collect(Collectors.toList()),
                  toSummaryResponse(committed)));
    }
  }

  @PostMapping("/{batchId}/commit")
  public ResponseEntity<ImportBatchResponse> commitImport(
      @PathVariable UUID batchId, @RequestParam UUID accountId) {

    ImportBatch batch =
        importService.commitImport(authHelper.getCurrentUserId(), accountId, batchId);
    return ResponseEntity.ok(toBatchResponse(batch));
  }

  @PostMapping("/{batchId}/undo")
  public ResponseEntity<ImportBatchResponse> undoImport(
      @PathVariable UUID batchId, @RequestParam UUID accountId) {

    ImportBatch batch = importService.undoImport(authHelper.getCurrentUserId(), accountId, batchId);
    return ResponseEntity.ok(toBatchResponse(batch));
  }

  @GetMapping
  public ResponseEntity<Page<ImportBatchResponse>> listBatches(
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {

    Pageable pageable = PageRequest.of(page, size);
    Page<ImportBatch> batches = importService.listBatches(authHelper.getCurrentUserId(), pageable);

    return ResponseEntity.ok(batches.map(this::toBatchResponse));
  }

  @GetMapping("/{batchId}")
  public ResponseEntity<ImportBatchDetailsResponse> getBatch(@PathVariable UUID batchId) {

    UUID userId = authHelper.getCurrentUserId();
    ImportBatch batch = importService.getBatch(userId, batchId);
    List<ImportRow> rows = importService.getBatchRows(userId, batchId);

    return ResponseEntity.ok(
        new ImportBatchDetailsResponse(
            toBatchResponse(batch),
            rows.stream().map(this::toRowResponse).collect(Collectors.toList())));
  }

  private ImportPreviewResponse toImportPreviewResponse(ImportPreview preview) {
    return new ImportPreviewResponse(
        toBatchResponse(preview.batch()),
        preview.rows().stream().map(this::toRowResponse).collect(Collectors.toList()),
        toSummaryResponse(preview.batch()));
  }

  private ImportBatchResponse toBatchResponse(ImportBatch batch) {
    // Calculate statistics from import rows
    int validRows =
        (int)
            importService.getBatchRows(batch.getUserId(), batch.getId()).stream()
                .filter(row -> row.getError() == null && row.getDuplicateOf() == null)
                .count();

    int duplicateRows =
        (int)
            importService.getBatchRows(batch.getUserId(), batch.getId()).stream()
                .filter(row -> row.getDuplicateOf() != null)
                .count();

    int errorRows =
        (int)
            importService.getBatchRows(batch.getUserId(), batch.getId()).stream()
                .filter(row -> row.getError() != null)
                .count();

    return new ImportBatchResponse(
        batch.getId(),
        batch.getStatus(),
        batch.getFilename(),
        batch.getRowCount(),
        validRows,
        duplicateRows,
        errorRows,
        batch.getCreatedAt());
  }

  private ImportRowResponse toRowResponse(ImportRow row) {
    UUID duplicateOfId = row.getDuplicateOf() != null ? row.getDuplicateOf().getId() : null;
    UUID suggestedCategoryId =
        row.getSuggestedCategory() != null ? row.getSuggestedCategory().getId() : null;

    return new ImportRowResponse(
        row.getId(),
        row.getRowNo(),
        row.getRawData(),
        row.getNormalizedData(),
        row.getError(),
        duplicateOfId,
        suggestedCategoryId);
  }

  private ImportSummaryResponse toSummaryResponse(ImportBatch batch) {
    // Recalculate statistics
    int validRows =
        (int)
            importService.getBatchRows(batch.getUserId(), batch.getId()).stream()
                .filter(row -> row.getError() == null && row.getDuplicateOf() == null)
                .count();

    int duplicateRows =
        (int)
            importService.getBatchRows(batch.getUserId(), batch.getId()).stream()
                .filter(row -> row.getDuplicateOf() != null)
                .count();

    int errorRows =
        (int)
            importService.getBatchRows(batch.getUserId(), batch.getId()).stream()
                .filter(row -> row.getError() != null)
                .count();

    return new ImportSummaryResponse(
        batch.getRowCount(), validRows, duplicateRows, errorRows, batch.getStatus());
  }

  /** Response for import preview. */
  public record ImportPreviewResponse(
      ImportBatchResponse batch, List<ImportRowResponse> rows, ImportSummaryResponse summary) {}

  /** Response for import batch. */
  public record ImportBatchResponse(
      UUID id,
      String status,
      String filename,
      int totalRows,
      int validRows,
      int duplicateRows,
      int errorRows,
      Instant createdAt) {}

  /** Response for import batch with details. */
  public record ImportBatchDetailsResponse(
      ImportBatchResponse batch, List<ImportRowResponse> rows) {}

  /** Response for import row. */
  public record ImportRowResponse(
      UUID id,
      int rowNo,
      Map<String, String> rawData,
      Map<String, Object> normalizedData,
      String error,
      UUID duplicateOf,
      UUID suggestedCategory) {}

  /** Response for import summary. */
  public record ImportSummaryResponse(
      int total, int valid, int duplicates, int errors, String status) {}
}
