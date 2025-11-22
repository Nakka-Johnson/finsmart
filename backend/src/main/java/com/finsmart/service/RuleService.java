package com.finsmart.service;

import com.finsmart.domain.entity.Category;
import com.finsmart.domain.entity.Rule;
import com.finsmart.domain.repo.CategoryRepository;
import com.finsmart.domain.repo.RuleRepository;
import com.finsmart.util.PatternMatcher;
import jakarta.persistence.EntityNotFoundException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Service for managing transaction categorization rules. */
@Slf4j
@Service
@RequiredArgsConstructor
public class RuleService {

  private final RuleRepository ruleRepository;
  private final CategoryRepository categoryRepository;

  /**
   * Get all rules for a user.
   *
   * @param userId user ID
   * @return list of rules ordered by priority
   */
  @Transactional(readOnly = true)
  public List<Rule> getUserRules(UUID userId) {
    return ruleRepository.findByUserIdOrderByPriorityAscCreatedAtAsc(userId);
  }

  /**
   * Get active rules for a user.
   *
   * @param userId user ID
   * @return list of active rules ordered by priority
   */
  @Transactional(readOnly = true)
  public List<Rule> getActiveUserRules(UUID userId) {
    return ruleRepository.findActiveRulesByUserIdOrderedByPriority(userId);
  }

  /**
   * Get rule by ID.
   *
   * @param userId user ID
   * @param ruleId rule ID
   * @return rule
   * @throws EntityNotFoundException if rule not found or not owned by user
   */
  @Transactional(readOnly = true)
  public Rule getRule(UUID userId, UUID ruleId) {
    Rule rule =
        ruleRepository
            .findById(ruleId)
            .orElseThrow(() -> new EntityNotFoundException("Rule not found: " + ruleId));

    if (!rule.getUserId().equals(userId)) {
      throw new EntityNotFoundException("Rule not found: " + ruleId);
    }

    return rule;
  }

  /**
   * Create a new rule.
   *
   * @param userId user ID
   * @param pattern pattern to match
   * @param field field to match ("merchant", "description", "both")
   * @param categoryId category to assign
   * @param priority priority (1-1000, lower = higher priority)
   * @param notes optional notes
   * @return created rule
   */
  @Transactional
  public Rule createRule(
      UUID userId, String pattern, String field, UUID categoryId, Integer priority, String notes) {

    // Validate category exists (categories are global, no user ownership)
    Category category =
        categoryRepository
            .findById(categoryId)
            .orElseThrow(() -> new EntityNotFoundException("Category not found: " + categoryId));

    // Validate field
    if (!List.of("merchant", "description", "both").contains(field.toLowerCase())) {
      throw new IllegalArgumentException("Invalid field: " + field);
    }

    // Validate priority
    if (priority != null && (priority < 1 || priority > 1000)) {
      throw new IllegalArgumentException("Priority must be between 1 and 1000");
    }

    Rule rule =
        Rule.builder()
            .userId(userId)
            .pattern(pattern.trim())
            .field(field.toLowerCase())
            .category(category)
            .active(true)
            .priority(priority != null ? priority : 100)
            .notes(notes)
            .build();

    return ruleRepository.save(rule);
  }

  /**
   * Update an existing rule.
   *
   * @param userId user ID
   * @param ruleId rule ID
   * @param pattern new pattern (optional)
   * @param field new field (optional)
   * @param categoryId new category ID (optional)
   * @param priority new priority (optional)
   * @param active new active status (optional)
   * @param notes new notes (optional)
   * @return updated rule
   */
  @Transactional
  public Rule updateRule(
      UUID userId,
      UUID ruleId,
      String pattern,
      String field,
      UUID categoryId,
      Integer priority,
      Boolean active,
      String notes) {

    Rule rule = getRule(userId, ruleId);

    if (pattern != null) {
      rule.setPattern(pattern.trim());
    }

    if (field != null) {
      if (!List.of("merchant", "description", "both").contains(field.toLowerCase())) {
        throw new IllegalArgumentException("Invalid field: " + field);
      }
      rule.setField(field.toLowerCase());
    }

    if (categoryId != null) {
      Category category =
          categoryRepository
              .findById(categoryId)
              .orElseThrow(() -> new EntityNotFoundException("Category not found: " + categoryId));

      rule.setCategory(category);
    }

    if (priority != null) {
      if (priority < 1 || priority > 1000) {
        throw new IllegalArgumentException("Priority must be between 1 and 1000");
      }
      rule.setPriority(priority);
    }

    if (active != null) {
      rule.setActive(active);
    }

    if (notes != null) {
      rule.setNotes(notes);
    }

    return ruleRepository.save(rule);
  }

  /**
   * Delete a rule.
   *
   * @param userId user ID
   * @param ruleId rule ID
   */
  @Transactional
  public void deleteRule(UUID userId, UUID ruleId) {
    Rule rule = getRule(userId, ruleId);
    ruleRepository.delete(rule);
    log.info("Deleted rule {} for user {}", ruleId, userId);
  }

  /**
   * Find matching category for transaction based on rules.
   *
   * @param userId user ID
   * @param merchant merchant name
   * @param description transaction description
   * @return suggested category ID if rule matches, empty otherwise
   */
  @Transactional(readOnly = true)
  public Optional<UUID> suggestCategory(UUID userId, String merchant, String description) {
    List<Rule> activeRules = getActiveUserRules(userId);

    for (Rule rule : activeRules) {
      if (PatternMatcher.matchesField(merchant, description, rule.getPattern(), rule.getField())) {
        log.debug(
            "Rule {} matched for merchant='{}', description='{}'",
            rule.getId(),
            merchant,
            description);
        return Optional.of(rule.getCategory().getId());
      }
    }

    return Optional.empty();
  }

  /**
   * Get statistics for user rules.
   *
   * @param userId user ID
   * @return map with statistics
   */
  @Transactional(readOnly = true)
  public Map<String, Long> getRuleStatistics(UUID userId) {
    Map<String, Long> stats = new HashMap<>();
    stats.put("total", (long) getUserRules(userId).size());
    stats.put("active", ruleRepository.countByUserIdAndActive(userId, true));
    stats.put("inactive", ruleRepository.countByUserIdAndActive(userId, false));
    return stats;
  }
}
