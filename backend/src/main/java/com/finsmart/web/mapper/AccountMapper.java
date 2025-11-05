package com.finsmart.web.mapper;

import com.finsmart.domain.entity.Account;
import com.finsmart.web.dto.AccountDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AccountMapper {

  @Mapping(source = "user.id", target = "userId")
  AccountDto toDto(Account entity);

  @Mapping(source = "userId", target = "user.id")
  Account toEntity(AccountDto dto);
}
