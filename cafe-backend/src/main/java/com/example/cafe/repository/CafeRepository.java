package com.example.cafe.repository;

import com.example.cafe.entity.Cafe;
import com.example.cafe.entity.Cafe.CafeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CafeRepository extends JpaRepository<Cafe, Long> {
    Optional<Cafe> findByOwnerId(Long ownerId);
    boolean existsByOwnerId(Long ownerId);
    List<Cafe> findByStatus(CafeStatus status);
}