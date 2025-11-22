package com.finsmart.domain.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(
    name = "import_batch",
    indexes = {
      @Index(name = "idx_import_batch_user_id", columnList = "user_id"),
      @Index(name = "idx_import_batch_created_at", columnList = "created_at"),
      @Index(name = "idx_import_batch_status", columnList = "status")
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportBatch {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @NotNull
  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @NotNull
  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @NotNull
  @Column(length = 64, nullable = false)
  private String source;

  @Column(length = 255)
  private String filename;

  @NotNull
  @Column(name = "row_count", nullable = false)
  private Integer rowCount;

  @NotNull
  @Column(length = 16, nullable = false)
  private String status; // PREVIEW, COMMITTED, FAILED, UNDONE

  @Column(columnDefinition = "TEXT")
  private String notes;

  @PrePersist
  protected void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
    if (rowCount == null) {
      rowCount = 0;
    }
  }
}
