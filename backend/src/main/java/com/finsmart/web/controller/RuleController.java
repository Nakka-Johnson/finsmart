package com.finsmart.web.controller;

import com.finsmart.domain.entity.Rule;
import com.finsmart.service.RuleService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Controller for transaction categorization rules. */
@Slf4j
@RestController
@RequestMapping("/api/rules")
@RequiredArgsConstructor
public class RuleController {

  private final RuleService ruleService;
  private final AuthenticationHelper authHelper;

  @GetMapping
  public ResponseEntity<List<RuleResponse>> getRules(
      @RequestParam(required = false, defaultValue = "false") boolean activeOnly) {

    UUID userId = authHelper.getCurrentUserId();
    List<Rule> rules =
        activeOnly ? ruleService.getActiveUserRules(userId) : ruleService.getUserRules(userId);

    List<RuleResponse> response =
        rules.stream().map(this::toRuleResponse).collect(Collectors.toList());

    return ResponseEntity.ok(response);
  }

  @GetMapping("/{ruleId}")
  public ResponseEntity<RuleResponse> getRule(@PathVariable UUID ruleId) {

    Rule rule = ruleService.getRule(authHelper.getCurrentUserId(), ruleId);
    return ResponseEntity.ok(toRuleResponse(rule));
  }

  @PostMapping
  public ResponseEntity<RuleResponse> createRule(@Valid @RequestBody RuleRequest request) {

    UUID userId = authHelper.getCurrentUserId();
    Rule rule =
        ruleService.createRule(
            userId,
            request.pattern(),
            request.field(),
            request.categoryId(),
            request.priority(),
            request.notes());

    return ResponseEntity.status(HttpStatus.CREATED).body(toRuleResponse(rule));
  }

  @PutMapping("/{ruleId}")
  public ResponseEntity<RuleResponse> updateRule(
      @PathVariable UUID ruleId, @Valid @RequestBody RuleUpdateRequest request) {

    UUID userId = authHelper.getCurrentUserId();
    Rule rule =
        ruleService.updateRule(
            userId,
            ruleId,
            request.pattern(),
            request.field(),
            request.categoryId(),
            request.priority(),
            request.active(),
            request.notes());

    return ResponseEntity.ok(toRuleResponse(rule));
  }

  @DeleteMapping("/{ruleId}")
  public ResponseEntity<Void> deleteRule(@PathVariable UUID ruleId) {

    ruleService.deleteRule(authHelper.getCurrentUserId(), ruleId);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/statistics")
  public ResponseEntity<Map<String, Long>> getStatistics() {

    Map<String, Long> stats = ruleService.getRuleStatistics(authHelper.getCurrentUserId());
    return ResponseEntity.ok(stats);
  }

  private RuleResponse toRuleResponse(Rule rule) {
    return new RuleResponse(
        rule.getId(),
        rule.getPattern(),
        rule.getField(),
        rule.getCategory().getId(),
        rule.getCategory().getName(),
        rule.getPriority(),
        rule.getActive(),
        rule.getNotes(),
        rule.getCreatedAt(),
        rule.getUpdatedAt());
  }

  /** Request for creating a rule. */
  public record RuleRequest(
      @NotBlank(message = "Pattern is required") String pattern,
      @NotBlank(message = "Field is required") String field,
      UUID categoryId,
      @Min(1) @Max(1000) Integer priority,
      String notes) {}

  /** Request for updating a rule. */
  public record RuleUpdateRequest(
      String pattern,
      String field,
      UUID categoryId,
      @Min(1) @Max(1000) Integer priority,
      Boolean active,
      String notes) {}

  /** Response for a rule. */
  public record RuleResponse(
      UUID id,
      String pattern,
      String field,
      UUID categoryId,
      String categoryName,
      int priority,
      boolean active,
      String notes,
      java.time.Instant createdAt,
      java.time.Instant updatedAt) {}
}
