package com.finsmart.web.mapper;

import com.finsmart.config.MapStructConfig;
import com.finsmart.domain.entity.Transaction;
import com.finsmart.web.dto.TransactionDto;
import com.finsmart.web.dto.transaction.TransactionRequest;
import com.finsmart.web.dto.transaction.TransactionResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(
    config = MapStructConfig.class,
    uses = {CategoryMapper.class})
public interface TransactionMapper {

  @Mapping(source = "account.id", target = "accountId")
  @Mapping(source = "category.id", target = "categoryId")
  TransactionDto toDto(Transaction entity);

  @Mapping(source = "accountId", target = "account.id")
  @Mapping(source = "categoryId", target = "category.id")
  Transaction toEntity(TransactionDto dto);

  @Mapping(source = "account.id", target = "accountId")
  TransactionResponse toResponse(Transaction transaction);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "account", ignore = true)
  @Mapping(target = "category", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  Transaction toEntity(TransactionRequest request);
}
