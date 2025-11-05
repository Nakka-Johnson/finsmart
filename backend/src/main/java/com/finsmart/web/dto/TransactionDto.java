package com.finsmart.web.dto;

import com.finsmart.domain.enums.TransactionDirection;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDto {
  private UUID id;
  private UUID accountId;
  private Instant postedAt;
  private BigDecimal amount;
  private TransactionDirection direction;
  private String description;
  private UUID categoryId;
  private String merchant;
  private String notes;
  private Instant createdAt;
}
