package com.finsmart.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(
    name = "rule",
    indexes = {
      @Index(name = "idx_rule_user_id", columnList = "user_id"),
      @Index(name = "idx_rule_active_priority", columnList = "user_id, active, priority"),
      @Index(name = "idx_rule_category_id", columnList = "category_id")
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Rule {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @NotNull
  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @NotNull
  @Column(length = 128, nullable = false)
  private String pattern;

  @NotNull
  @Column(length = 32, nullable = false)
  private String field; // merchant, description, both

  @NotNull
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "category_id", nullable = false)
  private Category category;

  @NotNull
  @Column(nullable = false)
  private Boolean active;

  @NotNull
  @Column(nullable = false)
  private Integer priority;

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
    if (active == null) {
      active = true;
    }
    if (priority == null) {
      priority = 100;
    }
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = Instant.now();
  }
}
