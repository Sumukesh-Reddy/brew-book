package com.example.cafe.controller;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cafe.dto.AcademicRecordDto;
import com.example.cafe.dto.ApiResponse;
import com.example.cafe.dto.GovernmentDocumentDto;
import com.example.cafe.dto.LoginRequest;
import com.example.cafe.dto.SignUpRequest;
import com.example.cafe.dto.WorkExperienceDto;
import com.example.cafe.entity.AcademicRecord;
import com.example.cafe.entity.Address;
import com.example.cafe.entity.GovernmentDocument;
import com.example.cafe.entity.User;
import com.example.cafe.entity.UserDetail;
import com.example.cafe.entity.WorkExperience;
import com.example.cafe.repository.UserDetailRepository;
import com.example.cafe.repository.UserRepository;
import com.example.cafe.service.EmailService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDetailRepository userDetailRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    /**
     * POST /api/auth/signup
     *
     * FIX 1: Now accepts the complete signup payload (personal info, address,
     *         academic records, work experiences) in a single request, matching
     *         what the frontend sends in handleSubmit().
     *
     * FIX 2: SignUpRequest now carries all fields — no separate profile/complete
     *         call needed from the signup form.
     */
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Map<String, Object>>> signUp(@RequestBody SignUpRequest req) {
        try {
             // ── Validation ────────────────────────────────────────────────
            if (req.getName() == null || req.getName().trim().isEmpty())
                return ResponseEntity.badRequest().body(ApiResponse.error("Name is required"));

            if (req.getEmail() == null || req.getEmail().trim().isEmpty())
                return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));

            if (userRepository.existsByEmail(req.getEmail().trim().toLowerCase()))
                return ResponseEntity.badRequest().body(ApiResponse.error("Email already registered"));

            // Users are created without password and set to inactive (pending admin approval)
            User user = new User();
            user.setName(req.getName().trim());
            user.setEmail(req.getEmail().trim().toLowerCase());
            user.setRole(req.getRole() != null ? req.getRole() : "customer");
            // No password set - will be set by admin when approved
            user.setPassword(passwordEncoder.encode("TEMP_PASSWORD_PLACEHOLDER"));
            user.setActive(false); // Inactive until admin approves
            user.setPasswordChangeRequired(true); // Will need to change password on first login
            User savedUser = userRepository.save(user);

            // ── Build UserDetail ──────────────────────────────────────────
            UserDetail userDetail = new UserDetail();
            userDetail.setUser(savedUser);
            userDetail.setEmailVerified(false);
            userDetail.setFirstName(req.getFirstName() != null ? req.getFirstName().trim() : "");
            userDetail.setLastName(req.getLastName()   != null ? req.getLastName().trim()  : "");

            if (req.getDateOfBirth() != null && !req.getDateOfBirth().isEmpty()) {
                try { userDetail.setDateOfBirth(LocalDate.parse(req.getDateOfBirth())); }
                catch (Exception ignored) {}
            }

            if (req.getGender() != null && !req.getGender().isEmpty()) {
                try { userDetail.setGender(UserDetail.Gender.valueOf(req.getGender().toUpperCase())); }
                catch (IllegalArgumentException e) { userDetail.setGender(UserDetail.Gender.OTHER); }
            }

            // Address
            if (req.getAddress() != null) {
                Address addr = new Address();
                addr.setStreet(req.getAddress().getStreet());
                addr.setPlotNo(req.getAddress().getPlotNo());
                addr.setCity(req.getAddress().getCity());
                addr.setPincode(req.getAddress().getPincode());
                addr.setCountry(req.getAddress().getCountry() != null
                        ? req.getAddress().getCountry() : "India");
                addr.setIsPrimary(true);
                userDetail.setAddress(addr);
            }

            UserDetail saved = userDetailRepository.save(userDetail);

            // Academic records — mutate the existing collection, never replace it
            if (req.getAcademicRecords() != null && !req.getAcademicRecords().isEmpty()) {
                saved.getAcademicRecords().clear();   // wipe any stale entries
                for (AcademicRecordDto dto : req.getAcademicRecords()) {
                    // Validate required fields
                    if (dto.getDegree() == null || dto.getDegree().trim().isEmpty()) continue;
                    if (dto.getInstitution() == null || dto.getInstitution().trim().isEmpty()) continue;
                    
                    AcademicRecord r = new AcademicRecord();
                    r.setUserDetail(saved);
                    r.setDegree(dto.getDegree().trim());
                    r.setInstitution(dto.getInstitution().trim());
                    r.setYearOfPassing(dto.getYearOfPassing());
                    if (dto.getGradeOrPercentage() != null && !dto.getGradeOrPercentage().trim().isEmpty()) {
                        r.setGradeOrPercentage(dto.getGradeOrPercentage().trim());
                    }
                    if (dto.getAdditionalNotes() != null && !dto.getAdditionalNotes().trim().isEmpty()) {
                        r.setAdditionalNotes(dto.getAdditionalNotes().trim());
                    }
                    saved.getAcademicRecords().add(r);  // add into the SAME list Hibernate owns
                }
                saved = userDetailRepository.save(saved);
                System.out.println("Saved " + saved.getAcademicRecords().size() + " academic records for user " + savedUser.getId());
            }

            // Work experiences — same pattern: mutate, never replace
            if (req.getWorkExperiences() != null && !req.getWorkExperiences().isEmpty()) {
                saved.getWorkExperiences().clear();
                for (WorkExperienceDto dto : req.getWorkExperiences()) {
                    // Validate required fields
                    if (dto.getCompanyName() == null || dto.getCompanyName().trim().isEmpty()) continue;
                    
                    WorkExperience exp = new WorkExperience();
                    exp.setUserDetail(saved);
                    exp.setCompanyName(dto.getCompanyName().trim());
                    
                    // Set job title - prefer jobTitle, fallback to role
                    String title = "";
                    if (dto.getJobTitle() != null && !dto.getJobTitle().trim().isEmpty()) {
                        title = dto.getJobTitle().trim();
                    } else if (dto.getRole() != null && !dto.getRole().trim().isEmpty()) {
                        title = dto.getRole().trim();
                    }
                    if (title.isEmpty()) continue; // Skip if no title/role provided
                    exp.setJobTitle(title);
                    
                    // Parse dates
                    if (dto.getStartDate() != null && !dto.getStartDate().isEmpty())
                        try { exp.setStartDate(LocalDate.parse(dto.getStartDate())); } catch (Exception ignored) {}
                    if (dto.getEndDate() != null && !dto.getEndDate().isEmpty())
                        try { exp.setEndDate(LocalDate.parse(dto.getEndDate())); } catch (Exception ignored) {}
                    
                    exp.setCurrentlyWorkingHere(
                            dto.getCurrentlyWorkingHere() != null ? dto.getCurrentlyWorkingHere() : false);
                    
                    // Set description - prefer jobDescription, fallback to description
                    String desc = "";
                    if (dto.getJobDescription() != null && !dto.getJobDescription().trim().isEmpty()) {
                        desc = dto.getJobDescription().trim();
                    } else if (dto.getDescription() != null && !dto.getDescription().trim().isEmpty()) {
                        desc = dto.getDescription().trim();
                    }
                    exp.setJobDescription(desc);
                    
                    if (dto.getSkillsGained() != null && !dto.getSkillsGained().trim().isEmpty()) {
                        exp.setSkillsGained(dto.getSkillsGained().trim());
                    }
                    if (dto.getAchievements() != null && !dto.getAchievements().trim().isEmpty()) {
                        exp.setAchievements(dto.getAchievements().trim());
                    }
                    
                    saved.getWorkExperiences().add(exp);
                }
                saved = userDetailRepository.save(saved);
                System.out.println("Saved " + saved.getWorkExperiences().size() + " work experiences for user " + savedUser.getId());
            }

            // Government documents — same pattern: mutate, never replace
            if (req.getGovernmentDocuments() != null && !req.getGovernmentDocuments().isEmpty()) {
                saved.getGovernmentDocuments().clear();
                for (GovernmentDocumentDto dto : req.getGovernmentDocuments()) {
                    // Validate required fields
                    if (dto.getDocumentType() == null || dto.getDocumentType().trim().isEmpty()) continue;
                    if (dto.getFileData() == null || dto.getFileData().trim().isEmpty()) continue;
                    
                    GovernmentDocument doc = new GovernmentDocument();
                    doc.setUserDetail(saved);
                    doc.setDocumentType(dto.getDocumentType().trim());
                    doc.setFileName(dto.getFileName() != null && !dto.getFileName().trim().isEmpty() 
                        ? dto.getFileName().trim() : "document");
                    doc.setFileSize(dto.getFileSize() != null ? dto.getFileSize() : 0L);
                    doc.setFileType(dto.getFileType() != null ? dto.getFileType().trim() : "");
                    doc.setFileData(dto.getFileData()); // Base64 encoded data
                    saved.getGovernmentDocuments().add(doc);
                }
                if (!saved.getGovernmentDocuments().isEmpty()) {
                    saved = userDetailRepository.save(saved);
                    System.out.println("Saved " + saved.getGovernmentDocuments().size() + " government documents for user " + savedUser.getId());
                }
            }

            // Verification email (non-critical — wrapped so it never fails the request)
            try {
                String token = emailService.generateVerificationToken();
                saved.setVerificationToken(token);
                userDetailRepository.save(saved);
                emailService.sendVerificationEmail(savedUser, token);
            } catch (Exception e) {
                System.err.println("Verification email failed: " + e.getMessage());
            }

            Map<String, Object> data = new HashMap<>();
            data.put("id",             savedUser.getId());
            data.put("name",           savedUser.getName());
            data.put("email",          savedUser.getEmail());
            data.put("role",           savedUser.getRole());
            data.put("profileCreated", true);
            data.put("active",         savedUser.getActive());
            data.put("pendingApproval", true);
            data.put("message",        "Your registration is pending admin approval. You will receive an email with temporary password once approved.");

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Registration submitted successfully. Waiting for admin approval.", data));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody LoginRequest loginRequest) {
        try {
            if (loginRequest.getEmail() == null || loginRequest.getEmail().trim().isEmpty())
                return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));

            if (loginRequest.getPassword() == null || loginRequest.getPassword().isEmpty())
                return ResponseEntity.badRequest().body(ApiResponse.error("Password is required"));

            Optional<User> userOptional = userRepository
                    .findByEmail(loginRequest.getEmail().trim().toLowerCase());

            if (userOptional.isEmpty())
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Invalid email or password"));

            User user = userOptional.get();

            if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword()))
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Invalid email or password"));

            if (!user.getActive())
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Account is pending admin approval or has been deactivated"));

            Optional<UserDetail> detailOpt = userDetailRepository.findByUserId(user.getId());
            boolean profileCompleted = detailOpt.isPresent()
                    && detailOpt.get().getFirstName() != null
                    && !detailOpt.get().getFirstName().isEmpty();

            Map<String, Object> userData = new HashMap<>();
            userData.put("id",               user.getId());
            userData.put("name",             user.getName());
            userData.put("email",            user.getEmail());
            userData.put("role",             user.getRole());
            userData.put("profileCompleted", profileCompleted);
            userData.put("createdAt",        user.getCreatedAt());
            userData.put("passwordChangeRequired", user.getPasswordChangeRequired() != null && user.getPasswordChangeRequired());

            return ResponseEntity.ok().body(ApiResponse.success("Login successful", userData));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Login failed: " + e.getMessage()));
        }
    }

    /**
     * POST /api/auth/change-password
     * Change password (for first-time login or password reset)
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Map<String, Object>>> changePassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String oldPassword = request.get("oldPassword");
            String newPassword = request.get("newPassword");

            if (email == null || email.trim().isEmpty())
                return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));

            if (newPassword == null || newPassword.length() < 6)
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("New password must be at least 6 characters"));

            Optional<User> userOpt = userRepository.findByEmail(email.trim().toLowerCase());
            if (userOpt.isEmpty())
                return ResponseEntity.badRequest().body(ApiResponse.error("User not found"));

            User user = userOpt.get();

            // If oldPassword is provided, verify it (for password reset)
            // If passwordChangeRequired is true, oldPassword can be the temporary password
            if (oldPassword != null && !oldPassword.isEmpty()) {
                if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(ApiResponse.error("Current password is incorrect"));
                }
            }

            // Update password
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setPasswordChangeRequired(false);
            userRepository.save(user);

            Map<String, Object> data = new HashMap<>();
            data.put("email", user.getEmail());
            data.put("message", "Password changed successfully");

            return ResponseEntity.ok()
                    .body(ApiResponse.success("Password changed successfully", data));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to change password: " + e.getMessage()));
        }
    }

    @GetMapping("/test")
    public ResponseEntity<ApiResponse<String>> test() {
        return ResponseEntity.ok().body(ApiResponse.success("Auth API is working!", null));
    }
}