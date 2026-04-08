package com.example.cafe.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.cafe.dto.ApiResponse;
import com.example.cafe.entity.User;
import com.example.cafe.entity.UserDetail;
import com.example.cafe.repository.UserDetailRepository;
import com.example.cafe.repository.UserRepository;
import com.example.cafe.service.EmailService;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDetailRepository userDetailRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @GetMapping("/pending-users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPendingUsers(
            @RequestParam(required = false) String type) {
        try {
            List<User> allUsers = userRepository.findAll();
            
            List<User> filteredUsers = allUsers.stream()
                    .filter(user -> !user.getActive()) // Only pending users
                    .filter(user -> {
                        if (type == null) return true;
                        String userRole = user.getRole() != null ? user.getRole().toLowerCase() : "";
                        String requestedType = type.toLowerCase();
                        
                        if ("user".equals(requestedType)) {
                            return !"cafeowner".equals(userRole) && !"owner".equals(userRole);
                        } else if ("owner".equals(requestedType) || "cafeowner".equals(requestedType)) {
                            return "cafeowner".equals(userRole) || "owner".equals(userRole);
                        }
                        return true;
                    })
                    .collect(Collectors.toList());

            List<Map<String, Object>> userDataList = filteredUsers.stream()
                    .map(this::buildUserData)
                    .collect(Collectors.toList());

            return ResponseEntity.ok()
                    .body(ApiResponse.success("Pending users retrieved successfully", userDataList));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve pending users: " + e.getMessage()));
        }
    }

    /**
     * GET /api/admin/verified-users
     * Get all verified users (active = true)
     * Can filter by type: user or owner
     */
    @GetMapping("/verified-users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getVerifiedUsers(
            @RequestParam(required = false) String type) {
        try {
            List<User> allUsers = userRepository.findAll();
            
            List<User> filteredUsers = allUsers.stream()
                    .filter(User::getActive) // Only active users
                    .filter(user -> {
                        if (type == null) return true;
                        String userRole = user.getRole() != null ? user.getRole().toLowerCase() : "";
                        String requestedType = type.toLowerCase();
                        
                        if ("user".equals(requestedType)) {
                            return !"cafeowner".equals(userRole) && !"owner".equals(userRole);
                        } else if ("owner".equals(requestedType) || "cafeowner".equals(requestedType)) {
                            return "cafeowner".equals(userRole) || "owner".equals(userRole);
                        }
                        return true;
                    })
                    .collect(Collectors.toList());

            List<Map<String, Object>> userDataList = filteredUsers.stream()
                    .map(this::buildUserData)
                    .collect(Collectors.toList());

            return ResponseEntity.ok()
                    .body(ApiResponse.success("Verified users retrieved successfully", userDataList));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve verified users: " + e.getMessage()));
        }
    }

    /**
     * GET /api/admin/all-users
     * Get all users (both pending and verified)
     * Can filter by type: user or owner
     */
    @GetMapping("/all-users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllUsers(
            @RequestParam(required = false) String type) {
        try {
            List<User> allUsers = userRepository.findAll();
            
            List<User> filteredUsers = allUsers.stream()
                    .filter(user -> {
                        if (type == null) return true;
                        String userRole = user.getRole() != null ? user.getRole().toLowerCase() : "";
                        String requestedType = type.toLowerCase();
                        
                        if ("user".equals(requestedType)) {
                            return !"cafeowner".equals(userRole) && !"owner".equals(userRole);
                        } else if ("owner".equals(requestedType) || "cafeowner".equals(requestedType)) {
                            return "cafeowner".equals(userRole) || "owner".equals(userRole);
                        }
                        return true;
                    })
                    .collect(Collectors.toList());

            List<Map<String, Object>> userDataList = filteredUsers.stream()
                    .map(this::buildUserData)
                    .collect(Collectors.toList());

            return ResponseEntity.ok()
                    .body(ApiResponse.success("All users retrieved successfully", userDataList));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve users: " + e.getMessage()));
        }
    }

    /**
     * Helper method to build user data map from User entity
     */
    private Map<String, Object> buildUserData(User user) {
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("role", user.getRole());
        userData.put("createdAt", user.getCreatedAt());
        userData.put("active", user.getActive());
        userData.put("passwordChangeRequired", user.getPasswordChangeRequired());

        Optional<UserDetail> detailOpt = userDetailRepository.findByUserId(user.getId());
        if (detailOpt.isPresent()) {
            UserDetail detail = detailOpt.get();
            userData.put("firstName", detail.getFirstName());
            userData.put("lastName", detail.getLastName());
            userData.put("dateOfBirth", detail.getDateOfBirth());
            userData.put("gender", detail.getGender() != null ? detail.getGender().toString() : null);
            userData.put("emailVerified", detail.getEmailVerified());
            
            if (detail.getAddress() != null) {
                Map<String, Object> address = new HashMap<>();
                address.put("street", detail.getAddress().getStreet());
                address.put("plotNo", detail.getAddress().getPlotNo());
                address.put("city", detail.getAddress().getCity());
                address.put("pincode", detail.getAddress().getPincode());
                address.put("country", detail.getAddress().getCountry());
                userData.put("address", address);
            }

            // Academic records
            List<Map<String, Object>> academicRecords = detail.getAcademicRecords().stream()
                    .map(ar -> {
                        Map<String, Object> arMap = new HashMap<>();
                        arMap.put("id", ar.getId());
                        arMap.put("degree", ar.getDegree());
                        arMap.put("institution", ar.getInstitution());
                        arMap.put("yearOfPassing", ar.getYearOfPassing());
                        arMap.put("gradeOrPercentage", ar.getGradeOrPercentage());
                        arMap.put("additionalNotes", ar.getAdditionalNotes());
                        return arMap;
                    })
                    .collect(Collectors.toList());
            userData.put("academicRecords", academicRecords);

            // Work experiences
            List<Map<String, Object>> workExperiences = detail.getWorkExperiences().stream()
                    .map(we -> {
                        Map<String, Object> weMap = new HashMap<>();
                        weMap.put("id", we.getId());
                        weMap.put("companyName", we.getCompanyName());
                        weMap.put("jobTitle", we.getJobTitle());
                        weMap.put("startDate", we.getStartDate());
                        weMap.put("endDate", we.getEndDate());
                        weMap.put("currentlyWorkingHere", we.getCurrentlyWorkingHere());
                        weMap.put("jobDescription", we.getJobDescription());
                        weMap.put("skillsGained", we.getSkillsGained());
                        weMap.put("achievements", we.getAchievements());
                        return weMap;
                    })
                    .collect(Collectors.toList());
            userData.put("workExperiences", workExperiences);

            // Government documents
            List<Map<String, Object>> governmentDocuments = detail.getGovernmentDocuments().stream()
                    .map(doc -> {
                        Map<String, Object> docMap = new HashMap<>();
                        docMap.put("id", doc.getId());
                        docMap.put("documentType", doc.getDocumentType());
                        docMap.put("fileName", doc.getFileName());
                        docMap.put("fileSize", doc.getFileSize());
                        docMap.put("fileType", doc.getFileType());
                        docMap.put("fileData", doc.getFileData());
                        return docMap;
                    })
                    .collect(Collectors.toList());
            userData.put("governmentDocuments", governmentDocuments);
        }

        return userData;
    }

    /**
     * GET /api/admin/stats
     * Get dashboard statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        try {
            List<User> allUsers = userRepository.findAll();
            
            long totalUsers = allUsers.stream()
                    .filter(user -> {
                        String role = user.getRole() != null ? user.getRole().toLowerCase() : "";
                        return !"cafeowner".equals(role) && !"owner".equals(role);
                    })
                    .count();
            
            long totalOwners = allUsers.stream()
                    .filter(user -> {
                        String role = user.getRole() != null ? user.getRole().toLowerCase() : "";
                        return "cafeowner".equals(role) || "owner".equals(role);
                    })
                    .count();
            
            long pendingUsers = allUsers.stream()
                    .filter(user -> !user.getActive())
                    .filter(user -> {
                        String role = user.getRole() != null ? user.getRole().toLowerCase() : "";
                        return !"cafeowner".equals(role) && !"owner".equals(role);
                    })
                    .count();
            
            long pendingOwners = allUsers.stream()
                    .filter(user -> !user.getActive())
                    .filter(user -> {
                        String role = user.getRole() != null ? user.getRole().toLowerCase() : "";
                        return "cafeowner".equals(role) || "owner".equals(role);
                    })
                    .count();
            
            long activeUsers = allUsers.stream()
                    .filter(User::getActive)
                    .filter(user -> {
                        String role = user.getRole() != null ? user.getRole().toLowerCase() : "";
                        return !"cafeowner".equals(role) && !"owner".equals(role);
                    })
                    .count();
            
            long activeOwners = allUsers.stream()
                    .filter(User::getActive)
                    .filter(user -> {
                        String role = user.getRole() != null ? user.getRole().toLowerCase() : "";
                        return "cafeowner".equals(role) || "owner".equals(role);
                    })
                    .count();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", totalUsers);
            stats.put("totalOwners", totalOwners);
            stats.put("pendingUsers", pendingUsers);
            stats.put("pendingOwners", pendingOwners);
            stats.put("activeUsers", activeUsers);
            stats.put("activeOwners", activeOwners);
            stats.put("totalRegistrations", allUsers.size());

            return ResponseEntity.ok()
                    .body(ApiResponse.success("Stats retrieved successfully", stats));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve stats: " + e.getMessage()));
        }
    }

    /**
     * POST /api/admin/approve-user/{userId}
     * Approve a user and send OTP via email
     */
    @PostMapping("/approve-user/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approveUser(
            @PathVariable Long userId,
            @RequestBody(required = false) Map<String, String> requestBody) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("User not found"));
            }

            User user = userOpt.get();
            if (user.getActive()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("User is already approved"));
            }

            // Get user type from request body or from user role
            String userType = "user";
            if (requestBody != null && requestBody.containsKey("type")) {
                userType = requestBody.get("type");
            } else if (user.getRole() != null) {
                userType = user.getRole();
            }

            // Generate OTP (6-digit number)
            String otp = generateOTP();
            
            // Set temporary password as OTP (will be changed on first login)
            user.setPassword(passwordEncoder.encode(otp));
            user.setActive(true);
            user.setPasswordChangeRequired(true);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            // Send email with OTP
            try {
                emailService.sendOTPEmail(user, otp, userType);
            } catch (Exception e) {
                System.err.println("Failed to send OTP email: " + e.getMessage());
            }

            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getId());
            data.put("email", user.getEmail());
            data.put("otp", otp);
            data.put("userType", userType);
            data.put("message", "User approved successfully. OTP has been sent to their email.");

            return ResponseEntity.ok()
                    .body(ApiResponse.success("User approved successfully", data));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to approve user: " + e.getMessage()));
        }
    }

    /**
     * POST /api/admin/reject-user/{userId}
     * Reject a user and send rejection email
     */
    @PostMapping("/reject-user/{userId}")
    public ResponseEntity<ApiResponse<String>> rejectUser(
            @PathVariable Long userId,
            @RequestBody(required = false) Map<String, String> requestBody) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("User not found"));
            }

            User user = userOpt.get();
            
            // Get user type from request body or from user role
            String userType = "user";
            if (requestBody != null && requestBody.containsKey("type")) {
                userType = requestBody.get("type");
            } else if (user.getRole() != null) {
                userType = user.getRole();
            }

            // Get rejection reason (optional)
            String reason = "Your application did not meet the verification criteria.";
            if (requestBody != null && requestBody.containsKey("reason")) {
                reason = requestBody.get("reason");
            }

            // Send rejection email before deleting
            try {
                emailService.sendRejectionEmail(user, reason, userType);
            } catch (Exception e) {
                System.err.println("Failed to send rejection email: " + e.getMessage());
            }

            // Delete user and related details
            Optional<UserDetail> detailOpt = userDetailRepository.findByUserId(userId);
            detailOpt.ifPresent(userDetail -> userDetailRepository.delete(userDetail));
            userRepository.delete(user);

            return ResponseEntity.ok()
                    .body(ApiResponse.success("User rejected and removed. Notification email sent.", null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to reject user: " + e.getMessage()));
        }
    }

    /**
     * GET /api/admin/user/{userId}
     * Get detailed user information by ID
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserDetails(@PathVariable Long userId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("User not found"));
            }

            User user = userOpt.get();
            Map<String, Object> userData = buildUserData(user);

            return ResponseEntity.ok()
                    .body(ApiResponse.success("User details retrieved successfully", userData));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve user details: " + e.getMessage()));
        }
    }

    /**
     * Generate a 6-digit OTP
     */
    private String generateOTP() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
}