package com.finsmart.domain.repo;

import com.finsmart.domain.entity.Envelope;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EnvelopeRepository extends JpaRepository<Envelope, UUID> {

  List<Envelope> findByUserIdOrderByName(UUID userId);

  Optional<Envelope> findByUserIdAndName(UUID userId, String name);

  boolean existsByUserIdAndName(UUID userId, String name);
}
