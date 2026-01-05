package com.finsmart.web.controller;

import com.finsmart.domain.entity.AnomalyStatus;
import com.finsmart.domain.entity.Transaction;
import com.finsmart.domain.repo.AnomalyStatusRepository;
import com.finsmart.domain.repo.TransactionRepository;
import com.finsmart.service.InsightService;
import com.finsmart.service.InsightsSummaryService;
import com.finsmart.service.InsightsSummaryService.DateRange;
import com.finsmart.service.ai.AiClientService;
import com.finsmart.service.ai.TxnPayload;
import com.finsmart.web.dto.AnomalyDTO;
import com.finsmart.web.dto.MerchantInsightDTO;
import com.finsmart.web.dto.MerchantInsightDTO.MonthlyTotal;
import com.finsmart.web.dto.MonthlyInsightDTO;
import com.finsmart.web.dto.insights.InsightsSummaryResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
@Slf4j
public class InsightsController {

  private final InsightService insightService;
  private final InsightsSummaryService insightsSummaryService;
  private final AuthenticationHelper authenticationHelper;
  private final AiClientService aiClientService;
  private final TransactionRepository transactionRepository;
  private final AnomalyStatusRepository anomalyStatusRepository;

  /**
   * Get dashboard summary with all key metrics. All values are computed from actual transaction
   * data in the database.
   *
   * @param range Date range: LAST_30_DAYS or LAST_6_MONTHS
   * @return InsightsSummaryResponse with computed metrics
   */
  @GetMapping("/summary")
  public ResponseEntity<InsightsSummaryResponse> getSummary(
      @RequestParam(defaultValue = "LAST_30_DAYS") String range) {

    UUID userId = authenticationHelper.getCurrentUserId();
    log.info("Fetching insights summary for user {} with range {}", userId, range);

    DateRange dateRange;
    try {
      dateRange = DateRange.valueOf(range);
    } catch (IllegalArgumentException e) {
      dateRange = DateRange.LAST_30_DAYS;
    }

    InsightsSummaryResponse summary = insightsSummaryService.buildSummary(userId, dateRange);
    return ResponseEntity.ok(summary);
  }

  /**
   * Get monthly insights for the current user.
   *
   * @param month Month (1-12)
   * @param year Year
   * @return MonthlyInsightDTO
   */
  @GetMapping("/monthly")
  public ResponseEntity<MonthlyInsightDTO> getMonthlyInsights(
      @RequestParam @Min(1) @Max(12) int month, @RequestParam @Min(2000) @Max(2100) int year) {

    UUID userId = authenticationHelper.getCurrentUserId();
    log.info("Fetching monthly insights for user {} - {}/{}", userId, month, year);

    MonthlyInsightDTO insights = insightService.buildMonthlyInsights(userId, month, year);
    return ResponseEntity.ok(insights);
  }

  /**
   * Get merchant spending insights for the current user.
   *
   * <p>Sprint-1: Provides merchant normalization and monthly aggregation.
   *
   * @param monthsBack Number of months to look back (default: 3)
   * @return List of merchant insights with monthly breakdown
   */
  @GetMapping("/merchants")
  public ResponseEntity<List<MerchantInsightDTO>> getMerchantInsights(
      @RequestParam(defaultValue = "3") @Min(1) @Max(24) int monthsBack) {

    UUID userId = authenticationHelper.getCurrentUserId();
    log.info("Fetching merchant insights for user {} - {} months back", userId, monthsBack);

    // Fetch user's transactions for the specified period
    Instant cutoffDate = Instant.now().minus(monthsBack * 30L, java.time.temporal.ChronoUnit.DAYS);
    List<Transaction> transactions =
        transactionRepository.findByUserIdAndPostedAtAfter(userId, cutoffDate);

    if (transactions.isEmpty()) {
      log.info("No transactions found for user {} in the last {} months", userId, monthsBack);
      return ResponseEntity.ok(List.of());
    }

    // Convert to TxnPayload
    List<TxnPayload> txnPayloads =
        transactions.stream()
            .map(
                t ->
                    TxnPayload.builder()
                        .id(t.getId().toString())
                        .date(t.getPostedAt().toString())
                        .amount(t.getAmount())
                        .category(t.getCategory() != null ? t.getCategory().getName() : null)
                        .direction(t.getDirection().name())
                        .description(t.getDescription())
                        .merchant(t.getMerchant())
                        .build())
            .toList();

    // Call AI service
    List<Map<String, Object>> aiResults = aiClientService.merchantInsights(txnPayloads, monthsBack);

    // Convert to DTOs
    List<MerchantInsightDTO> insights =
        aiResults.stream()
            .map(
                result -> {
                  String merchant = (String) result.get("merchant");
                  BigDecimal totalSpending = new BigDecimal(result.get("totalSpending").toString());

                  @SuppressWarnings("unchecked")
                  List<Map<String, Object>> monthlyData =
                      (List<Map<String, Object>>) result.get("monthlyTotals");

                  List<MonthlyTotal> monthlyTotals =
                      monthlyData.stream()
                          .map(
                              m ->
                                  new MonthlyTotal(
                                      (String) m.get("month"),
                                      new BigDecimal(m.get("total").toString())))
                          .toList();

                  return new MerchantInsightDTO(merchant, monthlyTotals, totalSpending);
                })
            .toList();

    log.info("Returning {} merchant insights for user {}", insights.size(), userId);
    return ResponseEntity.ok(insights);
  }

  /**
   * Get anomaly detection results for the current user.
   *
   * <p>Sprint-1: Enhanced with AI-powered anomaly detection and user feedback.
   *
   * @param ignoreIds Optional list of transaction IDs to ignore (snoozed/confirmed)
   * @return List of detected anomalies with status
   */
  @GetMapping("/anomalies")
  public ResponseEntity<List<AnomalyDTO>> getAnomalies(
      @RequestParam(required = false) List<String> ignoreIds) {

    UUID userId = authenticationHelper.getCurrentUserId();
    log.info("Fetching anomalies for user {} - ignoreIds: {}", userId, ignoreIds);

    // Fetch user's recent transactions (last 3 months for anomaly detection)
    Instant cutoffDate = Instant.now().minus(90, java.time.temporal.ChronoUnit.DAYS);
    List<Transaction> transactions =
        transactionRepository.findByUserIdAndPostedAtAfter(userId, cutoffDate);

    if (transactions.isEmpty()) {
      log.info("No transactions found for user {} in the last 3 months", userId);
      return ResponseEntity.ok(List.of());
    }

    // Get user's anomaly status records
    Map<UUID, AnomalyStatus> statusMap =
        anomalyStatusRepository.findByUserId(userId).stream()
            .collect(Collectors.toMap(s -> s.getTransaction().getId(), s -> s));

    // Build ignore list from snoozed/ignored statuses
    List<String> effectiveIgnoreIds = new ArrayList<>();
    if (ignoreIds != null) {
      effectiveIgnoreIds.addAll(ignoreIds);
    }

    statusMap.forEach(
        (txnId, status) -> {
          if ("SNOOZED".equals(status.getStatus()) || "IGNORED".equals(status.getStatus())) {
            effectiveIgnoreIds.add(txnId.toString());
          }
        });

    // Convert to TxnPayload
    List<TxnPayload> txnPayloads =
        transactions.stream()
            .map(
                t ->
                    TxnPayload.builder()
                        .id(t.getId().toString())
                        .date(t.getPostedAt().toString())
                        .amount(t.getAmount())
                        .category(t.getCategory() != null ? t.getCategory().getName() : null)
                        .direction(t.getDirection().name())
                        .description(t.getDescription())
                        .merchant(t.getMerchant())
                        .build())
            .toList();

    // Call AI service with ignore list
    List<Map<String, Object>> aiResults =
        aiClientService.anomalies(
            txnPayloads, effectiveIgnoreIds.isEmpty() ? null : effectiveIgnoreIds);

    // Convert to DTOs
    List<AnomalyDTO> anomalies =
        aiResults.stream()
            .map(
                result -> {
                  String dateStr = (String) result.get("date");
                  BigDecimal amount = new BigDecimal(result.get("amount").toString());
                  String category = (String) result.get("category");
                  Double score = ((Number) result.get("score")).doubleValue();
                  Boolean isAnomaly = (Boolean) result.get("isAnomaly");

                  // Find the matching transaction to get ID and description
                  Transaction matchingTxn =
                      transactions.stream()
                          .filter(
                              t ->
                                  t.getPostedAt().toString().equals(dateStr)
                                      && t.getAmount().compareTo(amount) == 0)
                          .findFirst()
                          .orElse(null);

                  if (matchingTxn == null) {
                    return null;
                  }

                  String status = null;
                  if (statusMap.containsKey(matchingTxn.getId())) {
                    status = statusMap.get(matchingTxn.getId()).getStatus();
                  }

                  return new AnomalyDTO(
                      matchingTxn.getId(),
                      LocalDate.ofInstant(
                          matchingTxn.getPostedAt(), java.time.ZoneId.systemDefault()),
                      amount,
                      category,
                      matchingTxn.getDescription(),
                      score,
                      isAnomaly,
                      status);
                })
            .filter(a -> a != null)
            .toList();

    log.info("Returning {} anomalies for user {}", anomalies.size(), userId);
    return ResponseEntity.ok(anomalies);
  }

  /**
   * Snooze an anomaly (user feedback: "this is expected, don't show for now").
   *
   * <p>Sprint-1: Allows users to snooze anomaly alerts temporarily.
   *
   * @param transactionId Transaction ID to snooze
   * @return Success response
   */
  @PostMapping("/anomalies/{transactionId}/snooze")
  public ResponseEntity<Void> snoozeAnomaly(@PathVariable UUID transactionId) {

    UUID userId = authenticationHelper.getCurrentUserId();
    log.info("User {} snoozing anomaly for transaction {}", userId, transactionId);

    // Verify transaction belongs to user
    Transaction transaction =
        transactionRepository
            .findById(transactionId)
            .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

    if (!transaction.getAccount().getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("Transaction does not belong to current user");
    }

    // Create or update anomaly status
    AnomalyStatus status =
        anomalyStatusRepository
            .findByUserIdAndTransactionId(userId, transactionId)
            .orElse(
                AnomalyStatus.builder()
                    .userId(userId)
                    .transaction(transaction)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build());

    status.setStatus("SNOOZED");
    status.setUpdatedAt(Instant.now());
    anomalyStatusRepository.save(status);

    log.info("Anomaly snoozed successfully for transaction {}", transactionId);
    return ResponseEntity.ok().build();
  }

  /**
   * Confirm an anomaly (user feedback: "this is actually suspicious").
   *
   * <p>Sprint-1: Allows users to confirm anomaly alerts for fraud tracking.
   *
   * @param transactionId Transaction ID to confirm
   * @return Success response
   */
  @PostMapping("/anomalies/{transactionId}/confirm")
  public ResponseEntity<Void> confirmAnomaly(@PathVariable UUID transactionId) {

    UUID userId = authenticationHelper.getCurrentUserId();
    log.info("User {} confirming anomaly for transaction {}", userId, transactionId);

    // Verify transaction belongs to user
    Transaction transaction =
        transactionRepository
            .findById(transactionId)
            .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

    if (!transaction.getAccount().getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("Transaction does not belong to current user");
    }

    // Create or update anomaly status
    AnomalyStatus status =
        anomalyStatusRepository
            .findByUserIdAndTransactionId(userId, transactionId)
            .orElse(
                AnomalyStatus.builder()
                    .userId(userId)
                    .transaction(transaction)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build());

    status.setStatus("CONFIRMED");
    status.setUpdatedAt(Instant.now());
    anomalyStatusRepository.save(status);

    log.info("Anomaly confirmed successfully for transaction {}", transactionId);
    return ResponseEntity.ok().build();
  }

  /**
   * Ignore an anomaly permanently (user feedback: "this is normal for me").
   *
   * <p>Sprint-1: Allows users to permanently ignore certain anomaly patterns.
   *
   * @param transactionId Transaction ID to ignore
   * @return Success response
   */
  @PostMapping("/anomalies/{transactionId}/ignore")
  public ResponseEntity<Void> ignoreAnomaly(@PathVariable UUID transactionId) {

    UUID userId = authenticationHelper.getCurrentUserId();
    log.info("User {} ignoring anomaly for transaction {}", userId, transactionId);

    // Verify transaction belongs to user
    Transaction transaction =
        transactionRepository
            .findById(transactionId)
            .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

    if (!transaction.getAccount().getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("Transaction does not belong to current user");
    }

    // Create or update anomaly status
    AnomalyStatus status =
        anomalyStatusRepository
            .findByUserIdAndTransactionId(userId, transactionId)
            .orElse(
                AnomalyStatus.builder()
                    .userId(userId)
                    .transaction(transaction)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build());

    status.setStatus("IGNORED");
    status.setUpdatedAt(Instant.now());
    anomalyStatusRepository.save(status);

    log.info("Anomaly ignored permanently for transaction {}", transactionId);
    return ResponseEntity.ok().build();
  }
}
