package com.finsmart.domain.repo;

import com.finsmart.domain.entity.Account;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

  List<Account> findByUserId(UUID userId);

  boolean existsByUserIdAndName(UUID userId, String name);
}
