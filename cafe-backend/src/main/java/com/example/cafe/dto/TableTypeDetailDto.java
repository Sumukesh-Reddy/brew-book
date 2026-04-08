package com.example.cafe.dto;

import java.util.List;
import java.util.Map;

public class TableTypeDetailDto {
    private Long id;
    private String typeName;
    private String description;
    private Integer tableCount;
    private Integer availableTables;
    private Integer seatingCapacityPerTable;
    private Double minimumOrderAmount;
    private Double pricePerHour;
    private Boolean isActive;
    private List<Map<String, Object>> currentBookings;
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTypeName() { return typeName; }
    public void setTypeName(String typeName) { this.typeName = typeName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Integer getTableCount() { return tableCount; }
    public void setTableCount(Integer tableCount) { this.tableCount = tableCount; }
    
    public Integer getAvailableTables() { return availableTables; }
    public void setAvailableTables(Integer availableTables) { this.availableTables = availableTables; }
    
    public Integer getSeatingCapacityPerTable() { return seatingCapacityPerTable; }
    public void setSeatingCapacityPerTable(Integer seatingCapacityPerTable) { this.seatingCapacityPerTable = seatingCapacityPerTable; }
    
    public Double getMinimumOrderAmount() { return minimumOrderAmount; }
    public void setMinimumOrderAmount(Double minimumOrderAmount) { this.minimumOrderAmount = minimumOrderAmount; }
    
    public Double getPricePerHour() { return pricePerHour; }
    public void setPricePerHour(Double pricePerHour) { this.pricePerHour = pricePerHour; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public List<Map<String, Object>> getCurrentBookings() { return currentBookings; }
    public void setCurrentBookings(List<Map<String, Object>> currentBookings) { this.currentBookings = currentBookings; }
}