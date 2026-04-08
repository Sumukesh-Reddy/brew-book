package com.example.cafe.dto;

public class AddressDto {
    private String street;
    private String plotNo;
    private String city;
    private String pincode;
    private String country;
    private Boolean isPrimary;
    
    public AddressDto() {}
    
    public String getStreet() {
        return street;
    }
    
    public void setStreet(String street) {
        this.street = street;
    }
    
    public String getPlotNo() {
        return plotNo;
    }
    
    public void setPlotNo(String plotNo) {
        this.plotNo = plotNo;
    }
    
    public String getCity() {
        return city;
    }
    
    public void setCity(String city) {
        this.city = city;
    }
    
    public String getPincode() {
        return pincode;
    }
    
    public void setPincode(String pincode) {
        this.pincode = pincode;
    }
    
    public String getCountry() {
        return country;
    }
    
    public void setCountry(String country) {
        this.country = country;
    }
    
    public Boolean getIsPrimary() {
        return isPrimary;
    }
    
    public void setIsPrimary(Boolean isPrimary) {
        this.isPrimary = isPrimary;
    }
}