package com.finsmart.domain.repo;

import com.finsmart.domain.entity.Transaction;
import com.finsmart.domain.enums.TransactionDirection;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository
    extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

  Page<Transaction> findByAccountIdOrderByPostedAtDesc(UUID accountId, Pageable pageable);

  @Query(
      """
      SELECT COALESCE(SUM(t.amount), 0)
      FROM Transaction t
      WHERE t.account.id = :accountId
        AND t.direction = :direction
        AND YEAR(t.postedAt) = :year
        AND MONTH(t.postedAt) = :month
      """)
  BigDecimal sumAmountByAccountAndDirectionAndMonthAndYear(
      @Param("accountId") UUID accountId,
      @Param("direction") TransactionDirection direction,
      @Param("year") int year,
      @Param("month") int month);

  @Query(
      """
      SELECT COALESCE(SUM(t.amount), 0)
      FROM Transaction t
      WHERE t.account.user.id = :userId
        AND t.direction = :direction
        AND YEAR(t.postedAt) = :year
        AND MONTH(t.postedAt) = :month
      """)
  BigDecimal sumAmountByUserAndDirectionAndMonthAndYear(
      @Param("userId") UUID userId,
      @Param("direction") TransactionDirection direction,
      @Param("year") int year,
      @Param("month") int month);

  @Query(
      """
      SELECT COALESCE(SUM(t.amount), 0)
      FROM Transaction t
      WHERE t.account.user.id = :userId
        AND t.category.id = :categoryId
        AND t.direction = :direction
        AND t.postedAt >= :startDate
        AND t.postedAt <= :endDate
      """)
  Optional<BigDecimal> sumAmountByUserAndCategoryAndDirectionAndDateRange(
      @Param("userId") UUID userId,
      @Param("categoryId") UUID categoryId,
      @Param("direction") TransactionDirection direction,
      @Param("startDate") Instant startDate,
      @Param("endDate") Instant endDate);

  // Duplicate detection by hash
  Optional<Transaction> findByHash(String hash);

  boolean existsByHash(String hash);

  // Delete operations
  int deleteByAccountUserId(UUID userId);

  int deleteByAccountUserIdAndNotesContaining(UUID userId, String marker);

  // Sprint-1: Find transactions for insights and anomaly detection
  @Query(
      """
      SELECT t FROM Transaction t
      WHERE t.account.user.id = :userId
        AND t.postedAt >= :cutoffDate
      ORDER BY t.postedAt DESC
      """)
  List<Transaction> findByUserIdAndPostedAtAfter(
      @Param("userId") UUID userId, @Param("cutoffDate") Instant cutoffDate);

  // ========== Summary aggregation queries ==========

  /** Sum all income (IN direction) for user within date range. */
  @Query(
      """
      SELECT COALESCE(SUM(t.amount), 0)
      FROM Transaction t
      WHERE t.account.user.id = :userId
        AND t.direction = 'IN'
        AND t.postedAt >= :startDate
        AND t.postedAt < :endDate
      """)
  BigDecimal sumIncomeByUserAndDateRange(
      @Param("userId") UUID userId,
      @Param("startDate") Instant startDate,
      @Param("endDate") Instant endDate);

  /** Sum all spending (OUT direction) for user within date range. */
  @Query(
      """
      SELECT COALESCE(SUM(t.amount), 0)
      FROM Transaction t
      WHERE t.account.user.id = :userId
        AND t.direction = 'OUT'
        AND t.postedAt >= :startDate
        AND t.postedAt < :endDate
      """)
  BigDecimal sumSpendingByUserAndDateRange(
      @Param("userId") UUID userId,
      @Param("startDate") Instant startDate,
      @Param("endDate") Instant endDate);

  /**
   * Get spending grouped by category for user within date range. Returns Object[] with [categoryId,
   * categoryName, categoryColor, totalAmount, txCount]
   */
  @Query(
      """
      SELECT t.category.id, t.category.name, t.category.color, SUM(t.amount), COUNT(t)
      FROM Transaction t
      WHERE t.account.user.id = :userId
        AND t.direction = 'OUT'
        AND t.postedAt >= :startDate
        AND t.postedAt < :endDate
        AND t.category IS NOT NULL
      GROUP BY t.category.id, t.category.name, t.category.color
      ORDER BY SUM(t.amount) DESC
      """)
  List<Object[]> sumSpendingByCategoryForUser(
      @Param("userId") UUID userId,
      @Param("startDate") Instant startDate,
      @Param("endDate") Instant endDate);

  /**
   * Get spending grouped by merchant for user within date range. Returns Object[] with [merchant,
   * totalAmount, txCount]
   */
  @Query(
      """
      SELECT COALESCE(t.normalizedMerchant, t.merchant), SUM(t.amount), COUNT(t)
      FROM Transaction t
      WHERE t.account.user.id = :userId
        AND t.direction = 'OUT'
        AND t.postedAt >= :startDate
        AND t.postedAt < :endDate
        AND (t.merchant IS NOT NULL OR t.normalizedMerchant IS NOT NULL)
      GROUP BY COALESCE(t.normalizedMerchant, t.merchant)
      ORDER BY SUM(t.amount) DESC
      """)
  List<Object[]> sumSpendingByMerchantForUser(
      @Param("userId") UUID userId,
      @Param("startDate") Instant startDate,
      @Param("endDate") Instant endDate);

  /** Count transactions for user within date range. */
  @Query(
      """
      SELECT COUNT(t)
      FROM Transaction t
      WHERE t.account.user.id = :userId
        AND t.postedAt >= :startDate
        AND t.postedAt < :endDate
      """)
  int countByUserAndDateRange(
      @Param("userId") UUID userId,
      @Param("startDate") Instant startDate,
      @Param("endDate") Instant endDate);
}
