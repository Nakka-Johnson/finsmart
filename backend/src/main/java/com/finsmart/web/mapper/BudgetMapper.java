package com.finsmart.web.mapper;

import com.finsmart.config.MapStructConfig;
import com.finsmart.domain.entity.Budget;
import com.finsmart.web.dto.BudgetDto;
import com.finsmart.web.dto.budget.BudgetRequest;
import com.finsmart.web.dto.budget.BudgetResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(
    config = MapStructConfig.class,
    uses = {CategoryMapper.class})
public interface BudgetMapper {

  @Mapping(source = "user.id", target = "userId")
  @Mapping(source = "category.id", target = "categoryId")
  BudgetDto toDto(Budget entity);

  @Mapping(source = "userId", target = "user.id")
  @Mapping(source = "categoryId", target = "category.id")
  Budget toEntity(BudgetDto dto);

  @Mapping(source = "user.id", target = "userId")
  BudgetResponse toResponse(Budget budget);

  @Mapping(target = "id", ignore = true)
  @Mapping(target = "user", ignore = true)
  @Mapping(target = "category", ignore = true)
  Budget toEntity(BudgetRequest request);
}
