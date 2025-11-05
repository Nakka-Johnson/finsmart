package com.finsmart.web.mapper;

import com.finsmart.config.MapStructConfig;
import com.finsmart.domain.entity.Category;
import com.finsmart.web.dto.CategoryDto;
import com.finsmart.web.dto.category.CategoryRequest;
import com.finsmart.web.dto.category.CategoryResponse;
import org.mapstruct.Mapper;

@Mapper(config = MapStructConfig.class)
public interface CategoryMapper {

  CategoryDto toDto(Category entity);

  Category toEntity(CategoryDto dto);

  CategoryResponse toResponse(Category category);

  Category toEntity(CategoryRequest request);
}
