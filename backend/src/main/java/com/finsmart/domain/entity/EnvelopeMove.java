package com.finsmart.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(
    name = "envelope_move",
    indexes = {
      @Index(name = "idx_envelope_move_user_id", columnList = "user_id"),
      @Index(name = "idx_envelope_move_period", columnList = "year, month"),
      @Index(name = "idx_envelope_move_from", columnList = "from_envelope"),
      @Index(name = "idx_envelope_move_to", columnList = "to_envelope")
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnvelopeMove {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @NotNull
  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @NotNull
  @Min(1)
  @Max(12)
  @Column(nullable = false)
  private Integer month;

  @NotNull
  @Min(2000)
  @Max(2100)
  @Column(nullable = false)
  private Integer year;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "from_envelope")
  private Envelope fromEnvelope;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "to_envelope")
  private Envelope toEnvelope;

  @NotNull
  @Positive
  @Column(nullable = false, precision = 14, scale = 2)
  private BigDecimal amount;

  @NotNull
  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(columnDefinition = "TEXT")
  private String notes;

  @PrePersist
  protected void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }
}
