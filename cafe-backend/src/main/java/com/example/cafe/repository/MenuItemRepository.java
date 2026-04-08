// MenuItemRepository.java
package com.example.cafe.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.cafe.entity.MenuItem;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByCafeId(Long cafeId);
    List<MenuItem> findByCafeIdAndIsAvailableTrue(Long cafeId);
}