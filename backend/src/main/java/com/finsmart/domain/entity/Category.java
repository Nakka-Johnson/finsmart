package com.finsmart.domain.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(
    name = "categories",
    uniqueConstraints = {@UniqueConstraint(name = "uk_category_name", columnNames = "name")})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false, unique = true, length = 100)
  private String name;

  @Column(nullable = false, length = 7)
  private String color; // #RRGGBB format

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  protected void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }
}
