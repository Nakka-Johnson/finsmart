package com.finsmart.domain.entity;

import com.finsmart.domain.enums.TransactionDirection;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(
      name = "account_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_transaction_account"))
  private Account account;

  @NotNull
  @Column(nullable = false)
  private Instant postedAt;

  @NotNull
  @DecimalMin(value = "0.00", inclusive = true)
  @Column(nullable = false, precision = 12, scale = 2)
  private BigDecimal amount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private TransactionDirection direction;

  @Column(length = 512)
  private String description;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "category_id", foreignKey = @ForeignKey(name = "fk_transaction_category"))
  private Category category;

  @Column(length = 255)
  private String merchant;

  @Column(length = 512)
  private String notes;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  protected void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }
}
