package com.example.cafe.dto;

import java.util.List;

/**
 * FIX: Extended to carry all fields the signup form submits in one request.
 * Previously only had name/email/password/role — profile data was silently lost.
 */
public class SignUpRequest {

    // ── Auth fields ───────────────────────────────────────────────────────────
    private String name;
    private String email;
    private String password;
    private String role;

    // ── Personal info (Step 1) ────────────────────────────────────────────────
    private String firstName;
    private String lastName;
    private String dateOfBirth;   
    private String gender;        

    // ── Address (Step 1) ─────────────────────────────────────────────────────
    private AddressDto address;

    // ── Academic records (Step 2) ─────────────────────────────────────────────
    private List<AcademicRecordDto> academicRecords;

    // ── Work experiences (Step 3) ─────────────────────────────────────────────
    private List<WorkExperienceDto> workExperiences;

    // ── Government documents (Step 4) ─────────────────────────────────────────
    private List<GovernmentDocumentDto> governmentDocuments;

    // ─────────────────────────────────────────────────────────────────────────
    public SignUpRequest() {}

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public AddressDto getAddress() { return address; }
    public void setAddress(AddressDto address) { this.address = address; }

    public List<AcademicRecordDto> getAcademicRecords() { return academicRecords; }
    public void setAcademicRecords(List<AcademicRecordDto> academicRecords) {
        this.academicRecords = academicRecords;
    }

    public List<WorkExperienceDto> getWorkExperiences() { return workExperiences; }
    public void setWorkExperiences(List<WorkExperienceDto> workExperiences) {
        this.workExperiences = workExperiences;
    }

    public List<GovernmentDocumentDto> getGovernmentDocuments() { return governmentDocuments; }
    public void setGovernmentDocuments(List<GovernmentDocumentDto> governmentDocuments) {
        this.governmentDocuments = governmentDocuments;
    }
}