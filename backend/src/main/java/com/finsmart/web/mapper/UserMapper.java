package com.finsmart.web.mapper;

import com.finsmart.config.MapStructConfig;
import com.finsmart.domain.entity.User;
import com.finsmart.web.dto.UserDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class)
public interface UserMapper {

  @Mapping(target = "passwordHash", ignore = true) // Never expose password hash
  UserDto toDto(User entity);

  User toEntity(UserDto dto);
}
