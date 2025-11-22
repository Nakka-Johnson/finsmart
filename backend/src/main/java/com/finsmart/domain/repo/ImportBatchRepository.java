package com.finsmart.domain.repo;

import com.finsmart.domain.entity.ImportBatch;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ImportBatchRepository extends JpaRepository<ImportBatch, UUID> {

  Page<ImportBatch> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

  List<ImportBatch> findByUserIdAndStatusOrderByCreatedAtDesc(
      UUID userId, String status, Pageable pageable);

  @Query(
      "SELECT b FROM ImportBatch b WHERE b.userId = :userId AND b.status = 'COMMITTED' ORDER BY b.createdAt DESC")
  Optional<ImportBatch> findLastCommittedBatch(@Param("userId") UUID userId);

  long countByUserIdAndStatus(UUID userId, String status);
}
