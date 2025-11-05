package com.finsmart.web.mapper;

import com.finsmart.domain.entity.Category;
import com.finsmart.web.dto.CategoryDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

  CategoryDto toDto(Category entity);

  Category toEntity(CategoryDto dto);
}
