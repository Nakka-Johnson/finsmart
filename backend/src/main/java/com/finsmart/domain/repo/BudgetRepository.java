package com.finsmart.domain.repo;

import com.finsmart.domain.entity.Budget;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, UUID> {

  List<Budget> findByUserId(UUID userId);

  List<Budget> findByUserIdAndMonthAndYear(UUID userId, int month, int year);

  Optional<Budget> findByUserIdAndCategoryIdAndMonthAndYear(
      UUID userId, UUID categoryId, int month, int year);

  boolean existsByUserIdAndCategoryIdAndMonthAndYear(
      UUID userId, UUID categoryId, int month, int year);

  // Delete operations
  int deleteByUserId(UUID userId);
}
