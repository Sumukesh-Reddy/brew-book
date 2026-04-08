package com.example.cafe.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class Address {
    
    @Column(name = "street_address")
    private String street;
    
    @Column(name = "plot_number")
    private String plotNo;
    
    @Column(name = "city")
    private String city;
    
    @Column(name = "pincode")
    private String pincode;
    
    @Column(name = "country")
    private String country;
    
    @Column(name = "is_primary")
    private Boolean isPrimary;
    
    // Constructors
    public Address() {
        this.country = "India";
        this.isPrimary = true;
    }
    
    public Address(String street, String plotNo, String city, String pincode, String country, Boolean isPrimary) {
        this.street = street;
        this.plotNo = plotNo;
        this.city = city;
        this.pincode = pincode;
        this.country = country != null ? country : "India";
        this.isPrimary = isPrimary != null ? isPrimary : true;
    }
    
    // Getters and Setters
    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }
    
    public String getPlotNo() { return plotNo; }
    public void setPlotNo(String plotNo) { this.plotNo = plotNo; }
    
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country != null ? country : "India"; }
    
    public Boolean getIsPrimary() { return isPrimary; }
    public void setIsPrimary(Boolean isPrimary) { this.isPrimary = isPrimary != null ? isPrimary : true; }
}