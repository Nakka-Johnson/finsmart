package com.finsmart.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(
    name = "user_feature_flags",
    indexes = {
      @Index(name = "idx_user_feature_flags_user_id", columnList = "user_id"),
      @Index(name = "idx_user_feature_flags_key", columnList = "key")
    })
@IdClass(UserFeatureFlagId.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserFeatureFlag {

  @Id
  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Id
  @Column(length = 64, nullable = false)
  private String key;

  @NotNull
  @Column(nullable = false)
  private Boolean enabled;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @PrePersist
  protected void onCreate() {
    Instant now = Instant.now();
    if (createdAt == null) {
      createdAt = now;
    }
    if (updatedAt == null) {
      updatedAt = now;
    }
    if (enabled == null) {
      enabled = false;
    }
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = Instant.now();
  }
}
