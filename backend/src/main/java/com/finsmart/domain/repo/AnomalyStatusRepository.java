package com.finsmart.domain.repo;

import com.finsmart.domain.entity.AnomalyStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnomalyStatusRepository extends JpaRepository<AnomalyStatus, UUID> {

  List<AnomalyStatus> findByUserId(UUID userId);

  List<AnomalyStatus> findByUserIdAndStatus(UUID userId, String status);

  Optional<AnomalyStatus> findByUserIdAndTransactionId(UUID userId, UUID transactionId);

  long countByUserIdAndStatus(UUID userId, String status);
}
