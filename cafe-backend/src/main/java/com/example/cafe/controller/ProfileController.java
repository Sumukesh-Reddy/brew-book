package com.example.cafe.controller;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cafe.dto.AcademicRecordDto;
import com.example.cafe.dto.ApiResponse;
import com.example.cafe.dto.ProfileCompletionRequest;
import com.example.cafe.dto.WorkExperienceDto;
import com.example.cafe.entity.AcademicRecord;
import com.example.cafe.entity.Address;
import com.example.cafe.entity.User;
import com.example.cafe.entity.UserDetail;
import com.example.cafe.entity.WorkExperience;
import com.example.cafe.repository.AcademicRecordRepository;
import com.example.cafe.repository.UserDetailRepository;
import com.example.cafe.repository.UserRepository;
import com.example.cafe.repository.WorkExperienceRepository;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:3000")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDetailRepository userDetailRepository;

    @Autowired
    private AcademicRecordRepository academicRecordRepository;

    @Autowired
    private WorkExperienceRepository workExperienceRepository;

    /**
     * GET /api/profile/me - Get current user's complete profile
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentUserProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated() || 
                "anonymousUser".equals(authentication.getPrincipal())) {
                return ResponseEntity.status(401)
                    .body(ApiResponse.error("User not authenticated"));
            }

            // For testing without JWT - get user by ID 1
            Long userId = 1L; // Temporary hardcoded for testing
            Optional<User> userOpt = userRepository.findById(userId);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404)
                    .body(ApiResponse.error("User not found"));
            }

            User user = userOpt.get();
            Optional<UserDetail> userDetailOpt = userDetailRepository.findByUserId(userId);
            
            Map<String, Object> profileData = new HashMap<>();
            profileData.put("user", user);
            profileData.put("userDetail", userDetailOpt.orElse(null));

            return ResponseEntity.ok()
                .body(ApiResponse.success("Profile retrieved successfully", profileData));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Error retrieving profile: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/profile/complete - Complete user profile
     */
    @PutMapping("/complete")
    public ResponseEntity<ApiResponse<Map<String, Object>>> completeProfile(@RequestBody ProfileCompletionRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated() || 
                "anonymousUser".equals(authentication.getPrincipal())) {
                return ResponseEntity.status(401)
                    .body(ApiResponse.error("User not authenticated"));
            }

            // For testing without JWT - get user by ID 1
            Long userId = 1L; // Temporary hardcoded for testing
            
            // Find existing user detail or create new
            UserDetail userDetail = userDetailRepository.findByUserId(userId)
                .orElse(new UserDetail());
            
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.status(404)
                    .body(ApiResponse.error("User not found"));
            }

            userDetail.setUser(user);
            
            // Update personal information
            if (request.getFirstName() != null) {
                userDetail.setFirstName(request.getFirstName());
            }
            if (request.getLastName() != null) {
                userDetail.setLastName(request.getLastName());
            }
            if (request.getDateOfBirth() != null) {
                userDetail.setDateOfBirth(LocalDate.parse(request.getDateOfBirth()));
            }
            if (request.getGender() != null) {
                try {
                    userDetail.setGender(UserDetail.Gender.valueOf(request.getGender().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    userDetail.setGender(UserDetail.Gender.OTHER);
                }
            }
            
            // Save user detail first
            userDetail = userDetailRepository.save(userDetail);
            
            // Save address
            if (request.getAddress() != null) {
                Address address = new Address();
                address.setStreet(request.getAddress().getStreet());
                address.setPlotNo(request.getAddress().getPlotNo());
                address.setCity(request.getAddress().getCity());
                address.setPincode(request.getAddress().getPincode());
                address.setCountry(request.getAddress().getCountry() != null ? request.getAddress().getCountry() : "India");
                address.setIsPrimary(request.getAddress().getIsPrimary() != null ? request.getAddress().getIsPrimary() : true);
                userDetail.setAddress(address);
                userDetail = userDetailRepository.save(userDetail);
            }
            
            // Save academic records
            if (request.getAcademicRecords() != null && !request.getAcademicRecords().isEmpty()) {
                List<AcademicRecord> academicRecords = new ArrayList<>();
                for (AcademicRecordDto dto : request.getAcademicRecords()) {
                    AcademicRecord record = new AcademicRecord();
                    record.setUserDetail(userDetail);
                    record.setDegree(dto.getDegree());
                    record.setInstitution(dto.getInstitution());
                    record.setYearOfPassing(dto.getYearOfPassing());
                    record.setGradeOrPercentage(dto.getGradeOrPercentage());
                    record.setAdditionalNotes(dto.getAdditionalNotes());
                    academicRecords.add(record);
                }
                userDetail.setAcademicRecords(academicRecords);
                userDetail = userDetailRepository.save(userDetail);
            }
            
            // Save work experiences
            if (request.getWorkExperiences() != null && !request.getWorkExperiences().isEmpty()) {
                List<WorkExperience> workExperiences = new ArrayList<>();
                for (WorkExperienceDto dto : request.getWorkExperiences()) {
                    WorkExperience exp = new WorkExperience();
                    exp.setUserDetail(userDetail);
                    exp.setCompanyName(dto.getCompanyName());
                    exp.setJobTitle(dto.getJobTitle());
                    if (dto.getStartDate() != null) {
                        exp.setStartDate(LocalDate.parse(dto.getStartDate()));
                    }
                    if (dto.getEndDate() != null) {
                        exp.setEndDate(LocalDate.parse(dto.getEndDate()));
                    }
                    exp.setCurrentlyWorkingHere(dto.getCurrentlyWorkingHere() != null ? dto.getCurrentlyWorkingHere() : false);
                    exp.setJobDescription(dto.getJobDescription());
                    exp.setSkillsGained(dto.getSkillsGained());
                    exp.setAchievements(dto.getAchievements());
                    workExperiences.add(exp);
                }
                userDetail.setWorkExperiences(workExperiences);
                userDetail = userDetailRepository.save(userDetail);
            }

            // Prepare response
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("profileId", userDetail.getId());
            responseData.put("firstName", userDetail.getFirstName());
            responseData.put("lastName", userDetail.getLastName());
            responseData.put("emailVerified", userDetail.getEmailVerified());
            responseData.put("profileCompleted", true);

            return ResponseEntity.ok()
                .body(ApiResponse.success("Profile completed successfully", responseData));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Error completing profile: " + e.getMessage()));
        }
    }

    /**
     * GET /api/profile/status - Check if profile is completed
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfileStatus() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401)
                    .body(ApiResponse.error("User not authenticated"));
            }

            Long userId = 1L; // Temporary hardcoded for testing
            Optional<UserDetail> userDetailOpt = userDetailRepository.findByUserId(userId);
            
            Map<String, Object> status = new HashMap<>();
            if (userDetailOpt.isPresent()) {
                UserDetail userDetail = userDetailOpt.get();
                boolean isProfileCompleted = userDetail.getFirstName() != null && 
                                           !userDetail.getFirstName().isEmpty() &&
                                           userDetail.getLastName() != null && 
                                           !userDetail.getLastName().isEmpty();
                
                status.put("profileCompleted", isProfileCompleted);
                status.put("emailVerified", userDetail.getEmailVerified());
                status.put("hasAddress", userDetail.getAddress() != null);
                status.put("hasAcademicRecords", userDetail.getAcademicRecords() != null && !userDetail.getAcademicRecords().isEmpty());
                status.put("hasWorkExperiences", userDetail.getWorkExperiences() != null && !userDetail.getWorkExperiences().isEmpty());
            } else {
                status.put("profileCompleted", false);
                status.put("emailVerified", false);
            }

            return ResponseEntity.ok()
                .body(ApiResponse.success("Profile status retrieved", status));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Error checking profile status: " + e.getMessage()));
        }
    }
}