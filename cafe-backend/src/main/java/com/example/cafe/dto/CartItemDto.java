package com.example.cafe.dto;

public class CartItemDto {
    private Long tableTypeId;
    private String tableTypeName;
    private Integer quantity;
    private Integer seatingCapacity;
    private Double pricePerTable;
    private String specialRequests;
    private String customerPhone; // Added for per-item phone if needed
    
    // Getters and Setters
    public Long getTableTypeId() { return tableTypeId; }
    public void setTableTypeId(Long tableTypeId) { this.tableTypeId = tableTypeId; }
    
    public String getTableTypeName() { return tableTypeName; }
    public void setTableTypeName(String tableTypeName) { this.tableTypeName = tableTypeName; }
    
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    
    public Integer getSeatingCapacity() { return seatingCapacity; }
    public void setSeatingCapacity(Integer seatingCapacity) { this.seatingCapacity = seatingCapacity; }
    
    public Double getPricePerTable() { return pricePerTable; }
    public void setPricePerTable(Double pricePerTable) { this.pricePerTable = pricePerTable; }
    
    public String getSpecialRequests() { return specialRequests; }
    public void setSpecialRequests(String specialRequests) { this.specialRequests = specialRequests; }
    
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
}