package com.finsmart.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(
    name = "rule_execution_log",
    indexes = {
      @Index(name = "idx_rule_execution_log_rule_id", columnList = "rule_id"),
      @Index(name = "idx_rule_execution_log_txn_id", columnList = "txn_id"),
      @Index(name = "idx_rule_execution_log_created_at", columnList = "created_at")
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RuleExecutionLog {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @NotNull
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "rule_id", nullable = false)
  private Rule rule;

  @NotNull
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "txn_id", nullable = false)
  private Transaction transaction;

  @NotNull
  @Column(nullable = false)
  private Boolean matched;

  @NotNull
  @Column(nullable = false)
  private Boolean applied;

  @NotNull
  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @PrePersist
  protected void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }
}
