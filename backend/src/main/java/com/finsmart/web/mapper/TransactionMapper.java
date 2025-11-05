package com.finsmart.web.mapper;

import com.finsmart.domain.entity.Transaction;
import com.finsmart.web.dto.TransactionDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TransactionMapper {

  @Mapping(source = "account.id", target = "accountId")
  @Mapping(source = "category.id", target = "categoryId")
  TransactionDto toDto(Transaction entity);

  @Mapping(source = "accountId", target = "account.id")
  @Mapping(source = "categoryId", target = "category.id")
  Transaction toEntity(TransactionDto dto);
}
