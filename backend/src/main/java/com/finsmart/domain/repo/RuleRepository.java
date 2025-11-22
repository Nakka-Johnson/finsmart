package com.finsmart.domain.repo;

import com.finsmart.domain.entity.Rule;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/** Repository for Rule entity. */
@Repository
public interface RuleRepository extends JpaRepository<Rule, UUID> {

  /**
   * Find all active rules for a user, ordered by priority (lower first).
   *
   * @param userId user ID
   * @return list of active rules
   */
  @Query(
      "SELECT r FROM Rule r WHERE r.userId = :userId AND r.active = true "
          + "ORDER BY r.priority ASC, r.createdAt ASC")
  List<Rule> findActiveRulesByUserIdOrderedByPriority(@Param("userId") UUID userId);

  /**
   * Find all rules for a user ordered by priority.
   *
   * @param userId user ID
   * @return list of rules
   */
  List<Rule> findByUserIdOrderByPriorityAscCreatedAtAsc(UUID userId);

  /**
   * Count rules by user and active status.
   *
   * @param userId user ID
   * @param active active status
   * @return count
   */
  long countByUserIdAndActive(UUID userId, boolean active);

  /**
   * Delete all rules for a user.
   *
   * @param userId user ID
   * @return number of deleted rules
   */
  int deleteAllByUserId(UUID userId);
}
