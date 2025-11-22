package com.finsmart.domain.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.Type;

@Entity
@Table(
    name = "export_job",
    indexes = {
      @Index(name = "idx_export_job_user_id", columnList = "user_id"),
      @Index(name = "idx_export_job_created_at", columnList = "created_at"),
      @Index(name = "idx_export_job_status", columnList = "status"),
      @Index(name = "idx_export_job_period", columnList = "year, month")
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportJob {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @NotNull
  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Min(1)
  @Max(12)
  private Integer month;

  @Min(2000)
  @Max(2100)
  private Integer year;

  @NotNull
  @Column(length = 32, nullable = false)
  private String type; // CSV, XLSX, PDF, JSON

  @NotNull
  @Column(length = 16, nullable = false)
  private String status; // PENDING, PROCESSING, COMPLETED, FAILED

  @Column(name = "file_path", length = 512)
  private String filePath;

  @NotNull
  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @NotNull
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(name = "error_message", columnDefinition = "TEXT")
  private String errorMessage;

  @Column(name = "file_size_bytes")
  private Long fileSizeBytes;

  @Column(columnDefinition = "jsonb")
  @Type(JsonType.class)
  private Map<String, Object> parameters;

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
