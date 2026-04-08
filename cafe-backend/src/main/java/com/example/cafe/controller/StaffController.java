package com.example.cafe.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.cafe.dto.ApiResponse;
import com.example.cafe.dto.StaffCreateRequest;
import com.example.cafe.dto.StaffDto;
import com.example.cafe.entity.ActivityLog;
import com.example.cafe.entity.Cafe;
import com.example.cafe.entity.StaffMember;
import com.example.cafe.entity.User;
import com.example.cafe.repository.ActivityLogRepository;
import com.example.cafe.repository.CafeRepository;
import com.example.cafe.repository.StaffMemberRepository;
import com.example.cafe.repository.UserRepository;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "http://localhost:3000")
public class StaffController {

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StaffMemberRepository staffMemberRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    /**
     * GET /api/staff/my - List all staff for the current owner's cafe
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<StaffDto>>> listMyStaff(@RequestParam(required = false) Long ownerId) {
        try {
            Long userId = ownerId != null ? ownerId : 1L;
            Cafe cafe = cafeRepository.findByOwnerId(userId)
                    .orElseThrow(() -> new RuntimeException("No cafe found for this owner"));

            List<StaffDto> list = staffMemberRepository.findByCafeIdOrderByCreatedAtDesc(cafe.getId())
                    .stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.success("Staff retrieved", list));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to load staff: " + e.getMessage()));
        }
    }

    /**
     * POST /api/staff/my - Create a new staff member
     */
    @PostMapping("/my")
    public ResponseEntity<ApiResponse<StaffDto>> createStaff(
            @RequestParam(required = false) Long ownerId,
            @RequestBody StaffCreateRequest req) {
        try {
            Long userId = ownerId != null ? ownerId : 1L;
            Cafe cafe = cafeRepository.findByOwnerId(userId)
                    .orElseThrow(() -> new RuntimeException("No cafe found for this owner"));

            // Validate required fields
            if (req.getName() == null || req.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Name is required"));
            }
            if (req.getEmail() == null || req.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
            }
            if (req.getRole() == null || req.getRole().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Role is required"));
            }
            if (req.getPassword() == null || req.getPassword().length() < 6) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Password must be at least 6 characters"));
            }

            String email = req.getEmail().trim().toLowerCase();
            if (Boolean.TRUE.equals(userRepository.existsByEmail(email))) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Email already registered"));
            }

            String role = req.getRole().trim().toLowerCase();
            if (!"waiter".equals(role) && !"chef".equals(role)) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Role must be waiter or chef"));
            }

            // Create user account for staff
            User user = new User();
            user.setName(req.getName().trim());
            user.setEmail(email);
            user.setRole(role);
            user.setActive(true);
            user.setPasswordChangeRequired(false);
            user.setPassword(passwordEncoder.encode(req.getPassword()));
            User savedUser = userRepository.save(user);

            // Create staff member record
            StaffMember staff = new StaffMember();
            staff.setCafe(cafe);
            staff.setUser(savedUser);
            staff.setStaffRole(role);
            staff.setPhone(req.getPhone());
            StaffMember saved = staffMemberRepository.save(staff);

            // Log activity
            logActivity(cafe, "STAFF_ADDED", "Staff added: " + savedUser.getName() + " (" + role + ")");

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Staff created successfully", toDto(saved)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create staff: " + e.getMessage()));
        }
    }

    /**
     * GET /api/staff/user/{userId} - Get staff member by user ID
     * This is used by the waiter dashboard to find which cafe they work at
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStaffByUserId(@PathVariable Long userId) {
        try {
            Optional<StaffMember> staffOpt = staffMemberRepository.findByUserId(userId);
            
            if (staffOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Staff member not found"));
            }
            
            StaffMember staff = staffOpt.get();
            Map<String, Object> response = new HashMap<>();
            response.put("id", staff.getId());
            response.put("cafeId", staff.getCafe().getId());
            response.put("cafeName", staff.getCafe().getCafeName());
            response.put("userId", staff.getUser().getId());
            response.put("userName", staff.getUser().getName());
            response.put("role", staff.getStaffRole());
            response.put("phone", staff.getPhone());
            response.put("createdAt", staff.getCreatedAt());
            
            return ResponseEntity.ok(ApiResponse.success("Staff retrieved", response));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to retrieve staff: " + e.getMessage()));
        }
    }

    /**
     * GET /api/staff/cafe/{cafeId} - Get all staff for a specific cafe
     */
    @GetMapping("/cafe/{cafeId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStaffByCafe(@PathVariable Long cafeId) {
        try {
            List<StaffMember> staffList = staffMemberRepository.findByCafeId(cafeId);
            
            List<Map<String, Object>> response = staffList.stream()
                .map(staff -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", staff.getId());
                    map.put("cafeId", staff.getCafe().getId());
                    map.put("cafeName", staff.getCafe().getCafeName());
                    map.put("userId", staff.getUser().getId());
                    map.put("userName", staff.getUser().getName());
                    map.put("email", staff.getUser().getEmail());
                    map.put("role", staff.getStaffRole());
                    map.put("phone", staff.getPhone());
                    map.put("createdAt", staff.getCreatedAt());
                    return map;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(ApiResponse.success("Staff list retrieved", response));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to retrieve staff: " + e.getMessage()));
        }
    }

    /**
     * GET /api/staff/{staffId} - Get staff member by ID
     */
    @GetMapping("/{staffId}")
    public ResponseEntity<ApiResponse<StaffDto>> getStaffById(@PathVariable Long staffId) {
        try {
            Optional<StaffMember> staffOpt = staffMemberRepository.findById(staffId);
            
            if (staffOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Staff member not found"));
            }
            
            return ResponseEntity.ok(ApiResponse.success("Staff retrieved", toDto(staffOpt.get())));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to retrieve staff: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/staff/{staffId} - Update staff member
     */
    @PutMapping("/{staffId}")
    public ResponseEntity<ApiResponse<StaffDto>> updateStaff(
            @PathVariable Long staffId,
            @RequestParam(required = false) Long ownerId,
            @RequestBody StaffCreateRequest req) {
        try {
            Long userId = ownerId != null ? ownerId : 1L;
            Cafe cafe = cafeRepository.findByOwnerId(userId)
                    .orElseThrow(() -> new RuntimeException("No cafe found for this owner"));

            Optional<StaffMember> staffOpt = staffMemberRepository.findById(staffId);
            if (staffOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Staff member not found"));
            }

            StaffMember staff = staffOpt.get();
            
            // Verify staff belongs to owner's cafe
            if (!staff.getCafe().getId().equals(cafe.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You don't have permission to update this staff member"));
            }

            User user = staff.getUser();
            
            // Update user details
            if (req.getName() != null && !req.getName().trim().isEmpty()) {
                user.setName(req.getName().trim());
            }
            
            if (req.getPhone() != null) {
                staff.setPhone(req.getPhone());
            }
            
            if (req.getRole() != null && !req.getRole().trim().isEmpty()) {
                String role = req.getRole().trim().toLowerCase();
                if ("waiter".equals(role) || "chef".equals(role)) {
                    staff.setStaffRole(role);
                    user.setRole(role);
                }
            }
            
            // Update password if provided
            if (req.getPassword() != null && req.getPassword().length() >= 6) {
                user.setPassword(passwordEncoder.encode(req.getPassword()));
            }
            
            userRepository.save(user);
            StaffMember saved = staffMemberRepository.save(staff);
            
            // Log activity
            logActivity(cafe, "STAFF_UPDATED", "Staff updated: " + user.getName());
            
            return ResponseEntity.ok(ApiResponse.success("Staff updated successfully", toDto(saved)));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to update staff: " + e.getMessage()));
        }
    }

    /**
     * DELETE /api/staff/{staffId} - Delete staff member
     */
    @DeleteMapping("/{staffId}")
    public ResponseEntity<ApiResponse<Void>> deleteStaff(
            @PathVariable Long staffId,
            @RequestParam(required = false) Long ownerId) {
        try {
            Long userId = ownerId != null ? ownerId : 1L;
            Cafe cafe = cafeRepository.findByOwnerId(userId)
                    .orElseThrow(() -> new RuntimeException("No cafe found for this owner"));

            Optional<StaffMember> staffOpt = staffMemberRepository.findById(staffId);
            if (staffOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Staff member not found"));
            }

            StaffMember staff = staffOpt.get();
            
            // Verify staff belongs to owner's cafe
            if (!staff.getCafe().getId().equals(cafe.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You don't have permission to delete this staff member"));
            }

            String staffName = staff.getUser().getName();
            Long userIdToDelete = staff.getUser().getId();
            
            // Delete staff record first
            staffMemberRepository.delete(staff);
            
            // Delete user account
            userRepository.findById(userIdToDelete).ifPresent(user -> userRepository.delete(user));
            
            // Log activity
            logActivity(cafe, "STAFF_DELETED", "Staff deleted: " + staffName);
            
            return ResponseEntity.ok(ApiResponse.success("Staff deleted successfully", null));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to delete staff: " + e.getMessage()));
        }
    }

    /**
     * GET /api/staff/cafe/{cafeId}/count - Get staff count by role
     */
    @GetMapping("/cafe/{cafeId}/count")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getStaffCountByRole(@PathVariable Long cafeId) {
        try {
            List<StaffMember> staffList = staffMemberRepository.findByCafeId(cafeId);
            
            int waiterCount = 0;
            int chefCount = 0;
            
            for (StaffMember staff : staffList) {
                if ("waiter".equals(staff.getStaffRole())) {
                    waiterCount++;
                } else if ("chef".equals(staff.getStaffRole())) {
                    chefCount++;
                }
            }
            
            Map<String, Integer> counts = new HashMap<>();
            counts.put("total", staffList.size());
            counts.put("waiters", waiterCount);
            counts.put("chefs", chefCount);
            
            return ResponseEntity.ok(ApiResponse.success("Staff counts retrieved", counts));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to get staff counts: " + e.getMessage()));
        }
    }

    /**
     * Helper method to convert StaffMember to StaffDto
     */
    private StaffDto toDto(StaffMember staff) {
        StaffDto dto = new StaffDto();
        dto.setId(staff.getId());
        dto.setCafeId(staff.getCafe() != null ? staff.getCafe().getId() : null);
        dto.setUserId(staff.getUser() != null ? staff.getUser().getId() : null);
        dto.setName(staff.getUser() != null ? staff.getUser().getName() : null);
        dto.setEmail(staff.getUser() != null ? staff.getUser().getEmail() : null);
        dto.setRole(staff.getStaffRole());
        dto.setPhone(staff.getPhone());
        dto.setCreatedAt(staff.getCreatedAt() != null ? staff.getCreatedAt().toString() : null);
        return dto;
    }

    /**
     * Helper method to log activity
     */
    private void logActivity(Cafe cafe, String type, String message) {
        try {
            ActivityLog log = new ActivityLog();
            log.setCafe(cafe);
            log.setType(type);
            log.setMessage(message);
            activityLogRepository.save(log);
        } catch (Exception ignored) {}
    }
}