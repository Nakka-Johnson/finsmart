package com.finsmart.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(
    name = "anomaly_status",
    indexes = {
      @Index(name = "idx_anomaly_status_user_id", columnList = "user_id"),
      @Index(name = "idx_anomaly_status_txn_id", columnList = "txn_id"),
      @Index(name = "idx_anomaly_status_status", columnList = "status")
    },
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uq_anomaly_user_txn",
          columnNames = {"user_id", "txn_id"})
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyStatus {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @NotNull
  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @NotNull
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "txn_id", nullable = false)
  private Transaction transaction;

  @NotNull
  @Column(length = 16, nullable = false)
  private String status; // PENDING, CONFIRMED, SNOOZED, IGNORED

  @Column(columnDefinition = "TEXT")
  private String note;

  @NotNull
  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @NotNull
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @PrePersist
  protected void onCreate() {
    Instant now = Instant.now();
    if (createdAt == null) {
      createdAt = now;
    }
    if (updatedAt == null) {
      updatedAt = now;
    }
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = Instant.now();
  }
}
