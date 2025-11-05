package com.finsmart.web.dto;

import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
  private UUID id;
  private String email;
  private String fullName;
  private Instant createdAt;
}
