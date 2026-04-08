// OrderRequestDto.java
package com.example.cafe.dto;

import java.util.List;

public class OrderRequestDto {
    private Long cafeId;
    private Long bookingId;
    private Long waiterId;
    private Long tableTypeId;
    private Integer tableNumber;
    private String customerName;
    private String customerPhone;
    private String orderType; // DINE_IN, TAKEAWAY
    private String specialInstructions;
    private List<OrderItemDto> items;
    
    // Getters and Setters
    public Long getCafeId() { return cafeId; }
    public void setCafeId(Long cafeId) { this.cafeId = cafeId; }
    
    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    
    public Long getWaiterId() { return waiterId; }
    public void setWaiterId(Long waiterId) { this.waiterId = waiterId; }
    
    public Long getTableTypeId() { return tableTypeId; }
    public void setTableTypeId(Long tableTypeId) { this.tableTypeId = tableTypeId; }
    
    public Integer getTableNumber() { return tableNumber; }
    public void setTableNumber(Integer tableNumber) { this.tableNumber = tableNumber; }
    
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    
    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }
    
    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
    
    public List<OrderItemDto> getItems() { return items; }
    public void setItems(List<OrderItemDto> items) { this.items = items; }
}