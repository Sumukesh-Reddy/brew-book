package com.example.cafe.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cafe.dto.ApiResponse;
import com.example.cafe.dto.UpdateUserRequest;
import com.example.cafe.entity.User;
import com.example.cafe.entity.UserDetail;
import com.example.cafe.repository.UserDetailRepository;
import com.example.cafe.repository.UserRepository;
import com.example.cafe.service.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDetailRepository userDetailRepository;

    @Autowired
    private UserService userService;

    /**
     * GET /api/users/{userId}/details - Get user details by user ID
     */
    @GetMapping("/{userId}/details")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserDetails(@PathVariable Long userId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("User not found"));
            }

            User user = userOpt.get();
            Optional<UserDetail> userDetailOpt = userDetailRepository.findByUserId(userId);
            
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("name", user.getName());
            userData.put("email", user.getEmail());
            userData.put("role", user.getRole());
            userData.put("active", user.getActive());
            userData.put("createdAt", user.getCreatedAt());
            userData.put("updatedAt", user.getUpdatedAt());
            userData.put("passwordChangeRequired", user.getPasswordChangeRequired());

            if (userDetailOpt.isPresent()) {
                UserDetail detail = userDetailOpt.get();
                userData.put("firstName", detail.getFirstName());
                userData.put("lastName", detail.getLastName());
                userData.put("dateOfBirth", detail.getDateOfBirth());
                userData.put("gender", detail.getGender() != null ? detail.getGender().toString() : null);
                userData.put("emailVerified", detail.getEmailVerified());
                
                // Address
                if (detail.getAddress() != null) {
                    Map<String, Object> address = new HashMap<>();
                    address.put("street", detail.getAddress().getStreet());
                    address.put("plotNo", detail.getAddress().getPlotNo());
                    address.put("city", detail.getAddress().getCity());
                    address.put("pincode", detail.getAddress().getPincode());
                    address.put("country", detail.getAddress().getCountry());
                    address.put("isPrimary", detail.getAddress().getIsPrimary());
                    userData.put("address", address);
                }

                // Academic records
                if (detail.getAcademicRecords() != null && !detail.getAcademicRecords().isEmpty()) {
                    userData.put("academicRecords", detail.getAcademicRecords());
                }

                // Work experiences
                if (detail.getWorkExperiences() != null && !detail.getWorkExperiences().isEmpty()) {
                    userData.put("workExperiences", detail.getWorkExperiences());
                }
            }

            return ResponseEntity.ok()
                .body(ApiResponse.success("User details retrieved successfully", userData));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to retrieve user details: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/users/{userId}/update - Update user profile
     */
    @PutMapping("/{userId}/update")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateUserProfile(
            @PathVariable Long userId,
            @RequestBody UpdateUserRequest request) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("User not found"));
            }

            User user = userOpt.get();
            
            // Update user details using service
            UserDetail updatedDetail = userService.updateUserProfile(userId, request);
            
            // Build response
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("name", user.getName());
            userData.put("email", user.getEmail());
            userData.put("role", user.getRole());
            userData.put("firstName", updatedDetail.getFirstName());
            userData.put("lastName", updatedDetail.getLastName());
            userData.put("dateOfBirth", updatedDetail.getDateOfBirth());
            userData.put("gender", updatedDetail.getGender() != null ? updatedDetail.getGender().toString() : null);
            
            // Address
            if (updatedDetail.getAddress() != null) {
                Map<String, Object> address = new HashMap<>();
                address.put("street", updatedDetail.getAddress().getStreet());
                address.put("plotNo", updatedDetail.getAddress().getPlotNo());
                address.put("city", updatedDetail.getAddress().getCity());
                address.put("pincode", updatedDetail.getAddress().getPincode());
                address.put("country", updatedDetail.getAddress().getCountry());
                userData.put("address", address);
            }

            return ResponseEntity.ok()
                .body(ApiResponse.success("Profile updated successfully", userData));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to update profile: " + e.getMessage()));
        }
    }

    /**
     * GET /api/users/{userId}/cafe - Get cafe details for owner
     */
    @GetMapping("/{userId}/cafe")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserCafe(@PathVariable Long userId) {
        try {
            // This will be handled by CafeController
            // You can either call CafeController method or redirect
            return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Redirect to cafe endpoint", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to retrieve cafe details: " + e.getMessage()));
        }
    }
}
