package com.example.cafe.dto;

import java.util.List;

public class MenuItemDto {

    private Long id;
    private Long cafeId;
    private String name;
    private String description;
    private Double price;
    private String category;
    private Boolean isAvailable;
    private List<MenuItemImageDto> images;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCafeId() {
        return cafeId;
    }

    public void setCafeId(Long cafeId) {
        this.cafeId = cafeId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
    }

    public List<MenuItemImageDto> getImages() {
        return images;
    }

    public void setImages(List<MenuItemImageDto> images) {
        this.images = images;
    }
}