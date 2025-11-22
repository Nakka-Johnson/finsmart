package com.finsmart.domain.repo;

import com.finsmart.domain.entity.ImportRow;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ImportRowRepository extends JpaRepository<ImportRow, UUID> {

  Page<ImportRow> findByBatchIdOrderByRowNo(UUID batchId, Pageable pageable);

  List<ImportRow> findByBatchId(UUID batchId);

  long countByBatchIdAndDuplicateOfIsNotNull(UUID batchId);

  long countByBatchIdAndErrorIsNotNull(UUID batchId);

  @Query(
      "SELECT COUNT(r) FROM ImportRow r WHERE r.batch.id = :batchId AND r.error IS NULL AND r.duplicateOf IS NULL")
  long countValidNonDuplicates(@Param("batchId") UUID batchId);

  @Query(
      "SELECT COUNT(r) FROM ImportRow r WHERE r.batch.id = :batchId AND r.duplicateOf IS NOT NULL")
  long countDuplicates(@Param("batchId") UUID batchId);

  @Query("SELECT COUNT(r) FROM ImportRow r WHERE r.batch.id = :batchId AND r.error IS NOT NULL")
  long countErrors(@Param("batchId") UUID batchId);

  @Query(
      "SELECT r FROM ImportRow r WHERE r.batch.id = :batchId AND r.error IS NULL AND r.duplicateOf IS NULL ORDER BY r.rowNo")
  List<ImportRow> findValidNonDuplicates(@Param("batchId") UUID batchId);
}
