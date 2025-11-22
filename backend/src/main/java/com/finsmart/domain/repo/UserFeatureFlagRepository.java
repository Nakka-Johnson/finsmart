package com.finsmart.domain.repo;

import com.finsmart.domain.entity.UserFeatureFlag;
import com.finsmart.domain.entity.UserFeatureFlagId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserFeatureFlagRepository
    extends JpaRepository<UserFeatureFlag, UserFeatureFlagId> {

  List<UserFeatureFlag> findByUserId(UUID userId);

  Optional<UserFeatureFlag> findByUserIdAndKey(UUID userId, String key);

  boolean existsByUserIdAndKeyAndEnabled(UUID userId, String key, boolean enabled);
}
