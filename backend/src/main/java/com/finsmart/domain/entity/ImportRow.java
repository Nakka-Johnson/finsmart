package com.finsmart.domain.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.util.Map;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.Type;

@Entity
@Table(
    name = "import_row",
    indexes = {
      @Index(name = "idx_import_row_batch_id", columnList = "batch_id"),
      @Index(name = "idx_import_row_duplicate_of", columnList = "duplicate_of")
    },
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uq_batch_row",
          columnNames = {"batch_id", "row_no"})
    })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportRow {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @NotNull
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "batch_id", nullable = false)
  private ImportBatch batch;

  @NotNull
  @Column(name = "row_no", nullable = false)
  private Integer rowNo;

  @NotNull
  @Column(name = "raw", columnDefinition = "jsonb", nullable = false)
  @Type(JsonType.class)
  private Map<String, String> rawData;

  @Column(name = "normalized", columnDefinition = "jsonb")
  @Type(JsonType.class)
  private Map<String, Object> normalizedData;

  @Column(columnDefinition = "TEXT")
  private String error;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "suggested_category")
  private Category suggestedCategory;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "duplicate_of")
  private Transaction duplicateOf;
}
