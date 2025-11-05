package com.finsmart.web.controller;

import com.finsmart.service.BudgetService;
import com.finsmart.web.dto.budget.BudgetRequest;
import com.finsmart.web.dto.budget.BudgetResponse;
import com.finsmart.web.dto.budget.BudgetSummaryResponse;
import com.finsmart.web.mapper.BudgetMapper;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
@Slf4j
public class BudgetController {

  private final BudgetService budgetService;
  private final BudgetMapper budgetMapper;
  private final AuthenticationHelper authHelper;

  @GetMapping
  public List<BudgetResponse> listBudgets(
      @RequestParam(required = false) Integer month, @RequestParam(required = false) Integer year) {

    UUID userId = authHelper.getCurrentUserId();
    log.debug("Listing budgets for user: {} (month={}, year={})", userId, month, year);

    return budgetService.listBudgets(userId, month, year).stream()
        .map(budgetMapper::toResponse)
        .toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public BudgetResponse createBudget(@Valid @RequestBody BudgetRequest request) {
    UUID userId = authHelper.getCurrentUserId();
    log.debug("Creating budget for user: {}", userId);

    var budget =
        budgetService.createBudget(
            userId, request.categoryId(), request.month(), request.year(), request.limitAmount());

    return budgetMapper.toResponse(budget);
  }

  @PutMapping("/{id}")
  public BudgetResponse updateBudget(
      @PathVariable UUID id, @Valid @RequestBody BudgetRequest request) {

    UUID userId = authHelper.getCurrentUserId();
    log.debug("Updating budget {} for user: {}", id, userId);

    var budget =
        budgetService.updateBudget(
            userId,
            id,
            request.categoryId(),
            request.month(),
            request.year(),
            request.limitAmount());

    return budgetMapper.toResponse(budget);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteBudget(@PathVariable UUID id) {
    UUID userId = authHelper.getCurrentUserId();
    log.debug("Deleting budget {} for user: {}", id, userId);
    budgetService.deleteBudget(userId, id);
  }

  @GetMapping("/summary")
  public List<BudgetSummaryResponse> getBudgetSummary(
      @RequestParam Integer month, @RequestParam Integer year) {

    UUID userId = authHelper.getCurrentUserId();
    log.debug("Getting budget summary for user: {} (month={}, year={})", userId, month, year);

    return budgetService.getBudgetSummary(userId, month, year);
  }
}
