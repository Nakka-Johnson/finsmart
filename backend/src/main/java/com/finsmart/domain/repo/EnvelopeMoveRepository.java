package com.finsmart.domain.repo;

import com.finsmart.domain.entity.EnvelopeMove;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EnvelopeMoveRepository extends JpaRepository<EnvelopeMove, UUID> {

  Page<EnvelopeMove> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

  @Query(
      "SELECT m FROM EnvelopeMove m WHERE m.userId = :userId AND m.year = :year AND m.month = :month ORDER BY m.createdAt DESC")
  List<EnvelopeMove> findByUserIdAndYearAndMonth(
      @Param("userId") UUID userId, @Param("year") int year, @Param("month") int month);

  /**
   * Find moves involving a specific envelope.
   *
   * @param fromEnvelopeId from envelope ID
   * @param toEnvelopeId to envelope ID
   * @return list of moves
   */
  List<EnvelopeMove> findByFromEnvelopeIdOrToEnvelopeIdOrderByCreatedAtDesc(
      UUID fromEnvelopeId, UUID toEnvelopeId);
}
