package com.example.cafe.dto;

import java.util.List;

public class CafeRegistrationRequest {
    private String cafeName;
    private String description;
    private String email;
    private String phone;
    private Integer establishedYear;
    private Integer totalTables;
    private Integer seatingCapacity;
    private Boolean hasWifi;
    private Boolean hasParking;
    private Boolean hasAC;
    private AddressDto address;
    private List<CafeDocumentDto> documents;
    private List<CafeImageDto> images;
    private List<TableTypeDto> tableTypes;
    
    // Getters and Setters
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
    
    public AddressDto getAddress() { return address; }
    public void setAddress(AddressDto address) { this.address = address; }
    
    public List<CafeDocumentDto> getDocuments() { return documents; }
    public void setDocuments(List<CafeDocumentDto> documents) { this.documents = documents; }
    
    public List<CafeImageDto> getImages() { return images; }
    public void setImages(List<CafeImageDto> images) { this.images = images; }

    public List<TableTypeDto> getTableTypes() { return tableTypes; }
public void setTableTypes(List<TableTypeDto> tableTypes) { this.tableTypes = tableTypes; }
}