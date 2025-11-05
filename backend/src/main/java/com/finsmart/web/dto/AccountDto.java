package com.finsmart.web.dto;

import com.finsmart.domain.enums.AccountType;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountDto {
  private UUID id;
  private UUID userId;
  private String name;
  private String institution;
  private AccountType type;
  private String currency;
  private Instant createdAt;
}
