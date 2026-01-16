package com.finsmart.service;

import static org.assertj.core.api.Assertions.*;

import com.finsmart.domain.entity.Category;
import com.finsmart.web.error.DuplicateResourceException;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/** Service layer test for CategoryService. Uses real repository with H2 - no mocking. */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CategoryServiceTest {

  @Autowired private CategoryService categoryService;

  private Category testCategory;

  @BeforeEach
  void setUp() {
    // Create a test category for each test
    String uniqueName = "TestCat-" + UUID.randomUUID().toString().substring(0, 8);
    testCategory = categoryService.create(uniqueName, "#123456");
  }

  @Test
  void listAll_returnsCategories() {
    List<Category> categories = categoryService.listAll();

    assertThat(categories).isNotEmpty();
    assertThat(categories).extracting(Category::getName).contains(testCategory.getName());
  }

  @Test
  void listAll_returnsSortedByName() {
    List<Category> categories = categoryService.listAll();

    assertThat(categories).extracting(Category::getName).isSorted();
  }

  @Test
  void getById_withValidId_returnsCategory() {
    Category found = categoryService.getById(testCategory.getId());

    assertThat(found.getName()).isEqualTo(testCategory.getName());
    assertThat(found.getId()).isEqualTo(testCategory.getId());
  }

  @Test
  void getById_withInvalidId_throwsEntityNotFound() {
    UUID invalidId = UUID.fromString("00000000-0000-0000-0000-000000000000");

    assertThatThrownBy(() -> categoryService.getById(invalidId))
        .isInstanceOf(EntityNotFoundException.class)
        .hasMessageContaining("Category not found");
  }

  @Test
  void create_withUniqueName_savesCategory() {
    String uniqueName = "NewCategory-" + UUID.randomUUID().toString().substring(0, 8);

    Category created = categoryService.create(uniqueName, "#FF5733");

    assertThat(created.getId()).isNotNull();
    assertThat(created.getName()).isEqualTo(uniqueName);
    assertThat(created.getColor()).isEqualTo("#FF5733");
  }

  @Test
  void create_withDuplicateName_throwsDuplicateException() {
    // Try to create another category with the same name as testCategory
    assertThatThrownBy(() -> categoryService.create(testCategory.getName(), "#000000"))
        .isInstanceOf(DuplicateResourceException.class)
        .hasMessageContaining("already exists");
  }
}
