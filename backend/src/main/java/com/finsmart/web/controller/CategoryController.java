package com.finsmart.web.controller;

import com.finsmart.service.CategoryService;
import com.finsmart.web.dto.category.CategoryRequest;
import com.finsmart.web.dto.category.CategoryResponse;
import com.finsmart.web.mapper.CategoryMapper;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Slf4j
public class CategoryController {

  private final CategoryService categoryService;
  private final CategoryMapper categoryMapper;

  @GetMapping
  public List<CategoryResponse> listCategories() {
    log.debug("Listing all categories");
    return categoryService.listAll().stream().map(categoryMapper::toResponse).toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CategoryResponse createCategory(@Valid @RequestBody CategoryRequest request) {
    log.debug("Creating category: {}", request.name());
    var category = categoryService.create(request.name(), request.color());
    return categoryMapper.toResponse(category);
  }
}
