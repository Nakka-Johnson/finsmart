package com.finsmart.web.controller;

import com.finsmart.domain.enums.TransactionDirection;
import com.finsmart.service.TransactionService;
import com.finsmart.web.dto.PageResponse;
import com.finsmart.web.dto.transaction.BulkActionRequest;
import com.finsmart.web.dto.transaction.BulkActionResponse;
import com.finsmart.web.dto.transaction.TransactionRequest;
import com.finsmart.web.dto.transaction.TransactionResponse;
import com.finsmart.web.mapper.TransactionMapper;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {

  private final TransactionService transactionService;
  private final TransactionMapper transactionMapper;
  private final AuthenticationHelper authHelper;

  @GetMapping
  public PageResponse<TransactionResponse> listTransactions(
      @RequestParam(required = false) UUID accountId,
      @RequestParam(required = false) Instant dateFrom,
      @RequestParam(required = false) Instant dateTo,
      @RequestParam(required = false) TransactionDirection direction,
      @RequestParam(required = false) UUID categoryId,
      @RequestParam(required = false) BigDecimal minAmount,
      @RequestParam(required = false) BigDecimal maxAmount,
      @RequestParam(required = false) String q,
      @PageableDefault(size = 20, sort = "postedAt") Pageable pageable) {

    UUID userId = authHelper.getCurrentUserId();
    log.debug("Listing transactions for user: {} with filters", userId);

    Page<TransactionResponse> page =
        transactionService
            .listTransactions(
                userId,
                accountId,
                dateFrom,
                dateTo,
                direction,
                categoryId,
                minAmount,
                maxAmount,
                q,
                pageable)
            .map(transactionMapper::toResponse);

    return new PageResponse<>(
        page.getContent(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages());
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public TransactionResponse createTransaction(@Valid @RequestBody TransactionRequest request) {
    UUID userId = authHelper.getCurrentUserId();
    log.debug("Creating transaction for user: {}", userId);

    var transaction =
        transactionService.createTransaction(
            userId,
            request.accountId(),
            request.postedAt(),
            request.amount(),
            request.direction(),
            request.description(),
            request.categoryId(),
            request.merchant(),
            request.notes());

    return transactionMapper.toResponse(transaction);
  }

  @PutMapping("/{id}")
  public TransactionResponse updateTransaction(
      @PathVariable UUID id, @Valid @RequestBody TransactionRequest request) {

    UUID userId = authHelper.getCurrentUserId();
    log.debug("Updating transaction {} for user: {}", id, userId);

    var transaction =
        transactionService.updateTransaction(
            userId,
            id,
            request.postedAt(),
            request.amount(),
            request.direction(),
            request.description(),
            request.categoryId(),
            request.merchant(),
            request.notes());

    return transactionMapper.toResponse(transaction);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteTransaction(@PathVariable UUID id) {
    UUID userId = authHelper.getCurrentUserId();
    log.debug("Deleting transaction {} for user: {}", id, userId);
    transactionService.deleteTransaction(userId, id);
  }

  // NOTE: CSV import functionality has been moved to ImportController
  // with enhanced features (batch management, undo capability, etc.)

  /**
   * Bulk transaction operations (DELETE or RECATEGORISE).
   *
   * @param request BulkActionRequest containing action, ids, and optional categoryId
   * @return BulkActionResponse with affected count
   */
  @PostMapping("/bulk")
  public ResponseEntity<BulkActionResponse> bulkAction(
      @Valid @RequestBody BulkActionRequest request) {
    UUID userId = authHelper.getCurrentUserId();
    log.info(
        "Bulk action {} for user: {}, {} transactions",
        request.action(),
        userId,
        request.ids().size());

    int affectedCount;
    String message;

    switch (request.action()) {
      case DELETE -> {
        affectedCount = transactionService.bulkDelete(userId, request.ids());
        message = "Deleted " + affectedCount + " transaction(s)";
      }
      case RECATEGORISE -> {
        if (request.categoryId() == null && request.ids().size() > 0) {
          return ResponseEntity.badRequest()
              .body(new BulkActionResponse(0, "categoryId is required for RECATEGORISE action"));
        }
        affectedCount =
            transactionService.bulkRecategorise(userId, request.ids(), request.categoryId());
        message = "Recategorized " + affectedCount + " transaction(s)";
      }
      default -> throw new IllegalArgumentException("Unsupported bulk action: " + request.action());
    }

    return ResponseEntity.ok(new BulkActionResponse(affectedCount, message));
  }
}
