package com.example.cafe.dto;

import java.util.List;
import java.util.Map;

public class TableAvailabilityDto {
    private Long cafeId;
    private String cafeName;
    private String date;
    private Map<Long, TableTypeAvailability> tableTypes;
    
    public static class TableTypeAvailability {
        private Long tableTypeId;
        private String typeName;
        private Integer totalTables;
        private Integer availableTables;
        private Integer bookedTables;
        private Integer occupiedTables;
        private List<OccupiedTableInfo> occupiedBy;
        
        // Getters and Setters
        public Long getTableTypeId() { return tableTypeId; }
        public void setTableTypeId(Long tableTypeId) { this.tableTypeId = tableTypeId; }
        
        public String getTypeName() { return typeName; }
        public void setTypeName(String typeName) { this.typeName = typeName; }
        
        public Integer getTotalTables() { return totalTables; }
        public void setTotalTables(Integer totalTables) { this.totalTables = totalTables; }
        
        public Integer getAvailableTables() { return availableTables; }
        public void setAvailableTables(Integer availableTables) { this.availableTables = availableTables; }
        
        public Integer getBookedTables() { return bookedTables; }
        public void setBookedTables(Integer bookedTables) { this.bookedTables = bookedTables; }
        
        public Integer getOccupiedTables() { return occupiedTables; }
        public void setOccupiedTables(Integer occupiedTables) { this.occupiedTables = occupiedTables; }
        
        public List<OccupiedTableInfo> getOccupiedBy() { return occupiedBy; }
        public void setOccupiedBy(List<OccupiedTableInfo> occupiedBy) { this.occupiedBy = occupiedBy; }
    }
    
    public static class OccupiedTableInfo {
        private Integer tableNumber;
        private String customerName;
        private String startTime;
        private String endTime;
        private String status;
        private Long bookingId;
        
        // Getters and Setters
        public Integer getTableNumber() { return tableNumber; }
        public void setTableNumber(Integer tableNumber) { this.tableNumber = tableNumber; }
        
        public String getCustomerName() { return customerName; }
        public void setCustomerName(String customerName) { this.customerName = customerName; }
        
        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }
        
        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public Long getBookingId() { return bookingId; }
        public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    }
    
    // Getters and Setters
    public Long getCafeId() { return cafeId; }
    public void setCafeId(Long cafeId) { this.cafeId = cafeId; }
    
    public String getCafeName() { return cafeName; }
    public void setCafeName(String cafeName) { this.cafeName = cafeName; }
    
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    
    public Map<Long, TableTypeAvailability> getTableTypes() { return tableTypes; }
    public void setTableTypes(Map<Long, TableTypeAvailability> tableTypes) { this.tableTypes = tableTypes; }
}