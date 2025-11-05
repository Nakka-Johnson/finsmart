package com.finsmart.web.mapper;

import com.finsmart.domain.entity.Budget;
import com.finsmart.web.dto.BudgetDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BudgetMapper {

  @Mapping(source = "user.id", target = "userId")
  @Mapping(source = "category.id", target = "categoryId")
  BudgetDto toDto(Budget entity);

  @Mapping(source = "userId", target = "user.id")
  @Mapping(source = "categoryId", target = "category.id")
  Budget toEntity(BudgetDto dto);
}
