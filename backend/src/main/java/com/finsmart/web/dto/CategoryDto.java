package com.finsmart.web.dto;

import java.util.UUID;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {
  private UUID id;
  private String name;
  private String color;
}
