package com.finsmart.service;

import com.finsmart.domain.entity.Category;
import com.finsmart.domain.repo.CategoryRepository;
import com.finsmart.web.error.DuplicateResourceException;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

  private final CategoryRepository categoryRepository;

  @Transactional(readOnly = true)
  public List<Category> listAll() {
    return categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
  }

  @Transactional(readOnly = true)
  public Category getById(UUID id) {
    return categoryRepository
        .findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Category not found with id: " + id));
  }

  @Transactional
  public Category create(String name, String color) {
    if (categoryRepository.existsByName(name)) {
      throw new DuplicateResourceException("Category with name '" + name + "' already exists");
    }

    Category category = new Category();
    category.setName(name);
    category.setColor(color);

    Category saved = categoryRepository.save(category);
    log.info("Created category: {} (id: {})", saved.getName(), saved.getId());
    return saved;
  }
}
