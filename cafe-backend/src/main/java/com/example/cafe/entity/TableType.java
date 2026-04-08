package com.example.cafe.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "table_types")
public class TableType {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "cafe_id")
    private Cafe cafe;
    
    @Column(name = "type_name", nullable = false)
    private String typeName;
    
    @Column(length = 500)
    private String description;
    
    @Column(name = "table_count", nullable = false)
    private Integer tableCount = 0;
    
    @Column(name = "available_tables", nullable = false)
    private Integer availableTables = 0;
    
    @Column(name = "seating_capacity_per_table")
    private Integer seatingCapacityPerTable = 4;
    
    @Column(name = "minimum_order_amount")
    private Double minimumOrderAmount = 0.0;
    
    @Column(name = "price_per_hour")
    private Double pricePerHour = 0.0;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "tableType", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Booking> bookings = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (availableTables == null) {
            availableTables = tableCount != null ? tableCount : 0;
        }
        if (pricePerHour == null) {
            pricePerHour = 0.0;
        }
        if (minimumOrderAmount == null) {
            minimumOrderAmount = 0.0;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters with null safety
    public Integer getAvailableTables() {
        return availableTables != null ? availableTables : 0;
    }
    
    public Double getPricePerHour() {
        return pricePerHour != null ? pricePerHour : 0.0;
    }
    
    public Double getMinimumOrderAmount() {
        return minimumOrderAmount != null ? minimumOrderAmount : 0.0;
    }
    
    public Integer getTableCount() {
        return tableCount != null ? tableCount : 0;
    }
    
    // Setters
    public void setAvailableTables(Integer availableTables) {
        this.availableTables = availableTables != null ? availableTables : 0;
    }
    
    public void setPricePerHour(Double pricePerHour) {
        this.pricePerHour = pricePerHour != null ? pricePerHour : 0.0;
    }
    
    public void setMinimumOrderAmount(Double minimumOrderAmount) {
        this.minimumOrderAmount = minimumOrderAmount != null ? minimumOrderAmount : 0.0;
    }
    
    // Helper methods
    public void decreaseAvailableTables(int quantity) {
        int current = getAvailableTables();
        if (current >= quantity) {
            setAvailableTables(current - quantity);
        } else {
            throw new IllegalStateException("Not enough tables available");
        }
    }
    
    public void increaseAvailableTables(int quantity) {
        int current = getAvailableTables();
        setAvailableTables(current + quantity);
        if (getAvailableTables() > getTableCount()) {
            setAvailableTables(getTableCount());
        }
    }
    
    public double calculateTotalPrice(int quantity, int durationMinutes) {
        double pricePerHour = getPricePerHour();
        double hours = durationMinutes / 60.0;
        return quantity * pricePerHour * hours;
    }
    
    // Regular getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Cafe getCafe() { return cafe; }
    public void setCafe(Cafe cafe) { this.cafe = cafe; }
    
    public String getTypeName() { return typeName; }
    public void setTypeName(String typeName) { this.typeName = typeName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public void setTableCount(Integer tableCount) { 
        this.tableCount = tableCount != null ? tableCount : 0; 
    }
    
    public Integer getSeatingCapacityPerTable() { return seatingCapacityPerTable; }
    public void setSeatingCapacityPerTable(Integer seatingCapacityPerTable) { 
        this.seatingCapacityPerTable = seatingCapacityPerTable; 
    }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public List<Booking> getBookings() { return bookings; }
    public void setBookings(List<Booking> bookings) { this.bookings = bookings; }
}