package com.finsmart.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(
    name = "envelope",
    indexes = {@Index(name = "idx_envelope_user_id", columnList = "user_id")},
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uq_envelope_user_name",
          columnNames = {"user_id", "name"})
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Envelope {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @NotNull
  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @NotNull
  @Column(length = 64, nullable = false)
  private String name;

  @NotNull
  @DecimalMin(value = "0.00")
  @Column(name = "limit_amount", nullable = false, precision = 14, scale = 2)
  private BigDecimal limitAmount;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

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
    if (limitAmount == null) {
      limitAmount = BigDecimal.ZERO;
    }
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = Instant.now();
  }
}
