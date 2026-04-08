package com.example.cafe.dto;

import java.util.List;

public class ProfileCompletionRequest {
    private String firstName;
    private String lastName;
    private String dateOfBirth;
    private String gender;
    private List<AcademicRecordDto> academicRecords;
    private List<WorkExperienceDto> workExperiences;
    private AddressDto address;
    
    public ProfileCompletionRequest() {}
    
    public String getFirstName() {
        return firstName;
    }
    
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }
    
    public String getLastName() {
        return lastName;
    }
    
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
    
    public String getDateOfBirth() {
        return dateOfBirth;
    }
    
    public void setDateOfBirth(String dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }
    
    public String getGender() {
        return gender;
    }
    
    public void setGender(String gender) {
        this.gender = gender;
    }
    
    public List<AcademicRecordDto> getAcademicRecords() {
        return academicRecords;
    }
    
    public void setAcademicRecords(List<AcademicRecordDto> academicRecords) {
        this.academicRecords = academicRecords;
    }
    
    public List<WorkExperienceDto> getWorkExperiences() {
        return workExperiences;
    }
    
    public void setWorkExperiences(List<WorkExperienceDto> workExperiences) {
        this.workExperiences = workExperiences;
    }
    
    public AddressDto getAddress() {
        return address;
    }
    
    public void setAddress(AddressDto address) {
        this.address = address;
    }
}