package com.finsmart.domain.repo;

import com.finsmart.domain.entity.ExportJob;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExportJobRepository extends JpaRepository<ExportJob, UUID> {

  Page<ExportJob> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

  List<ExportJob> findByUserIdAndStatus(UUID userId, String status);

  long countByUserIdAndStatus(UUID userId, String status);
}
