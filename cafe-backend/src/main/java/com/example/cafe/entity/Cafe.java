package com.example.cafe.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "cafes")
public class Cafe {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", referencedColumnName = "id", unique = true)
    private User owner;
    
    @Column(name = "cafe_name", nullable = false)
    private String cafeName;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "email")
    private String email;
    
    @Column(name = "phone")
    private String phone;
    
    @Column(name = "established_year")
    private Integer establishedYear;
    
    @Column(name = "total_tables")
    private Integer totalTables;
    
    @Column(name = "seating_capacity")
    private Integer seatingCapacity;

    @Column(name = "total_revenue")
    private Double totalRevenue = 0.0;
    
    @Column(name = "has_wifi")
    private Boolean hasWifi = false;
    
    @Column(name = "has_parking")
    private Boolean hasParking = false;
    
    @Column(name = "has_ac")
    private Boolean hasAC = false;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private CafeStatus status = CafeStatus.PENDING;
    
    @Embedded
    private Address address;
    
    @OneToMany(mappedBy = "cafe", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CafeDocument> documents = new ArrayList<>();
    
    @OneToMany(mappedBy = "cafe", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CafeImage> images = new ArrayList<>();
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum CafeStatus {
        PENDING, APPROVED, REJECTED
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Helper methods
    public void addDocument(CafeDocument document) {
        documents.add(document);
        document.setCafe(this);
    }
    
    public void removeDocument(CafeDocument document) {
        documents.remove(document);
        document.setCafe(null);
    }
    
    public void addImage(CafeImage image) {
        images.add(image);
        image.setCafe(this);
    }
    
    public void removeImage(CafeImage image) {
        images.remove(image);
        image.setCafe(null);
    }
    
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
    
    public String getCafeName() { return cafeName; }
    public void setCafeName(String cafeName) { this.cafeName = cafeName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public Integer getEstablishedYear() { return establishedYear; }
    public void setEstablishedYear(Integer establishedYear) { this.establishedYear = establishedYear; }
    
    public Integer getTotalTables() { return totalTables; }
    public void setTotalTables(Integer totalTables) { this.totalTables = totalTables; }
    
    public Integer getSeatingCapacity() { return seatingCapacity; }
    public void setSeatingCapacity(Integer seatingCapacity) { this.seatingCapacity = seatingCapacity; }
    
    public Boolean getHasWifi() { return hasWifi; }
    public void setHasWifi(Boolean hasWifi) { this.hasWifi = hasWifi; }
    
    public Boolean getHasParking() { return hasParking; }
    public void setHasParking(Boolean hasParking) { this.hasParking = hasParking; }
    
    public Boolean getHasAC() { return hasAC; }
    public void setHasAC(Boolean hasAC) { this.hasAC = hasAC; }
    
    public CafeStatus getStatus() { return status; }
    public void setStatus(CafeStatus status) { this.status = status; }
    
    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }
    
    public List<CafeDocument> getDocuments() { return documents; }
    public void setDocuments(List<CafeDocument> documents) { this.documents = documents; }
    
    public List<CafeImage> getImages() { return images; }
    public void setImages(List<CafeImage> images) { this.images = images; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    
    @OneToMany(mappedBy = "cafe", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TableType> tableTypes = new ArrayList<>();
    
    
    public void addTableType(TableType tableType) {
        tableTypes.add(tableType);
        tableType.setCafe(this);
    }

    public void removeTableType(TableType tableType) {
        tableTypes.remove(tableType);
        tableType.setCafe(null);
    }
    
    
    public List<TableType> getTableTypes() { return tableTypes; }
    public void setTableTypes(List<TableType> tableTypes) { this.tableTypes = tableTypes; }

    public Double getTotalRevenue() {
        return totalRevenue != null ? totalRevenue : 0.0;
    }

    public void setTotalRevenue(Double totalRevenue) {
        this.totalRevenue = totalRevenue != null ? totalRevenue : 0.0;
    }

    public void addRevenue(Double amount) {
        if (amount == null || amount <= 0) return;
        setTotalRevenue(getTotalRevenue() + amount);
    }
}