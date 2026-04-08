package com.example.cafe.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cafe.entity.MenuItemImage;

public interface MenuItemImageRepository extends JpaRepository<MenuItemImage, Long> {
    List<MenuItemImage> findByMenuItemId(Long menuItemId);
    void deleteByMenuItemId(Long menuItemId);
}