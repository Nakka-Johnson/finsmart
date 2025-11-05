package com.finsmart.web.mapper;

import com.finsmart.config.MapStructConfig;
import com.finsmart.domain.entity.Account;
import com.finsmart.web.dto.AccountDto;
import com.finsmart.web.dto.account.AccountRequest;
import com.finsmart.web.dto.account.AccountResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(config = MapStructConfig.class)
public interface AccountMapper {

  @Mapping(source = "user.id", target = "userId")
  AccountDto toDto(Account entity);

  @Mapping(source = "userId", target = "user.id")
  Account toEntity(AccountDto dto);

  @Mapping(source = "user.id", target = "userId")
  AccountResponse toResponse(Account account);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "user", ignore = true)
  @Mapping(target = "balance", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  Account toEntity(AccountRequest request);
}
