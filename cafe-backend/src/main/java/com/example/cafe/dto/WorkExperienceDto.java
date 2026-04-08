package com.example.cafe.dto;

/**
 * FIX: Added `role` and `description` fields to match what the frontend
 * actually sends. The frontend form uses `role` (not jobTitle) and
 * `description` (not jobDescription). Both old and new names are accepted
 * so existing callers of ProfileController are not broken.
 */
public class WorkExperienceDto {

    private String companyName;

    // Backend canonical name
    private String jobTitle;
    // FIX: Frontend sends "role" — keep both so either works
    private String role;

    private String startDate;
    private String endDate;
    private Boolean currentlyWorkingHere;

    // Backend canonical name
    private String jobDescription;
    // FIX: Frontend sends "description" — keep both so either works
    private String description;

    private String skillsGained;
    private String achievements;

    public WorkExperienceDto() {}

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public Boolean getCurrentlyWorkingHere() { return currentlyWorkingHere; }
    public void setCurrentlyWorkingHere(Boolean currentlyWorkingHere) {
        this.currentlyWorkingHere = currentlyWorkingHere;
    }

    public String getJobDescription() { return jobDescription; }
    public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSkillsGained() { return skillsGained; }
    public void setSkillsGained(String skillsGained) { this.skillsGained = skillsGained; }

    public String getAchievements() { return achievements; }
    public void setAchievements(String achievements) { this.achievements = achievements; }
}