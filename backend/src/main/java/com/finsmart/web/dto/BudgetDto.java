package com.finsmart.web.dto;

import java.math.BigDecimal;
import java.util.UUID;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetDto {
  private UUID id;
  private UUID userId;
  private UUID categoryId;
  private Integer month;
  private Integer year;
  private BigDecimal limitAmount;
}
