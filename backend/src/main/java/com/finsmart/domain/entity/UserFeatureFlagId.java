package com.finsmart.domain.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserFeatureFlagId implements Serializable {

  private UUID userId;
  private String key;

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    UserFeatureFlagId that = (UserFeatureFlagId) o;
    return Objects.equals(userId, that.userId) && Objects.equals(key, that.key);
  }

  @Override
  public int hashCode() {
    return Objects.hash(userId, key);
  }
}
