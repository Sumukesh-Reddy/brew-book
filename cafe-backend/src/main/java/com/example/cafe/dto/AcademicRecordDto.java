package com.example.cafe.dto;

public class AcademicRecordDto {
    private String degree;
    private String institution;
    private Integer yearOfPassing;
    private String gradeOrPercentage;
    private String additionalNotes;
    
    public AcademicRecordDto() {}
    
    public String getDegree() {
        return degree;
    }
    
    public void setDegree(String degree) {
        this.degree = degree;
    }
    
    public String getInstitution() {
        return institution;
    }
    
    public void setInstitution(String institution) {
        this.institution = institution;
    }
    
    public Integer getYearOfPassing() {
        return yearOfPassing;
    }
    
    public void setYearOfPassing(Integer yearOfPassing) {
        this.yearOfPassing = yearOfPassing;
    }
    
    public String getGradeOrPercentage() {
        return gradeOrPercentage;
    }
    
    public void setGradeOrPercentage(String gradeOrPercentage) {
        this.gradeOrPercentage = gradeOrPercentage;
    }
    
    public String getAdditionalNotes() {
        return additionalNotes;
    }
    
    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
    }
}