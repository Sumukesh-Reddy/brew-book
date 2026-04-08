package com.example.cafe.dto;

public class TableTypeDto {
    private String typeName;
    private String description;
    private Integer tableCount;
    private Integer seatingCapacityPerTable;
    private Double minimumOrderAmount;
    private Boolean isActive;
    private Double pricePerHour;
    
    public TableTypeDto() {}
    
    // Getters and Setters
    public String getTypeName() { return typeName; }
    public void setTypeName(String typeName) { this.typeName = typeName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Integer getTableCount() { return tableCount; }
    public void setTableCount(Integer tableCount) { this.tableCount = tableCount; }
    
    public Integer getSeatingCapacityPerTable() { return seatingCapacityPerTable; }
    public void setSeatingCapacityPerTable(Integer seatingCapacityPerTable) { this.seatingCapacityPerTable = seatingCapacityPerTable; }
    
    public Double getMinimumOrderAmount() { return minimumOrderAmount; }
    public void setMinimumOrderAmount(Double minimumOrderAmount) { this.minimumOrderAmount = minimumOrderAmount; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Double getPricePerHour() { return pricePerHour; }
    public void setPricePerHour(Double pricePerHour) { this.pricePerHour = pricePerHour; }
}