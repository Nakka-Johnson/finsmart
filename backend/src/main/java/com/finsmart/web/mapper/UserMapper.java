package com.finsmart.web.mapper;

import com.finsmart.domain.entity.User;
import com.finsmart.web.dto.UserDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

  UserDto toDto(User entity);

  User toEntity(UserDto dto);
}
