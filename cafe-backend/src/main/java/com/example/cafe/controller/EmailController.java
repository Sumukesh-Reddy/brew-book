package com.example.cafe.controller;

import com.example.cafe.dto.ApiResponse;
import com.example.cafe.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * EmailController - Handles email verification and password reset functionality
 * 
 * Provides endpoints for:
 * - Email verification
 * - Password reset requests
 * - Password reset confirmation
 */
@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "http://localhost:3000")
public class EmailController {

    @Autowired
    private EmailService emailService;

    /**
     * GET /api/email/verify/{token} - Verify user email using token
     * 
     * @param token The verification token
     * @return Success or error response
     */
    @GetMapping("/verify/{token}")
    public ResponseEntity<ApiResponse<String>> verifyEmail(@PathVariable String token) {
        try {
            boolean isVerified = emailService.verifyEmail(token);
            
            if (isVerified) {
                return ResponseEntity.ok()
                    .body(ApiResponse.success("Email verified successfully", null));
            } else {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid or expired verification token"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Error verifying email: " + e.getMessage()));
        }
    }

    /**
     * POST /api/email/resend-verification - Resend verification email
     * 
     * @param email The email address to resend verification to
     * @return Success or error response
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<String>> resendVerification(@RequestParam String email) {
        try {
            // In a real implementation, you would find the user by email and resend the verification
            // For now, we'll simulate the behavior
            return ResponseEntity.ok()
                .body(ApiResponse.success("Verification email resent successfully. Check your inbox.", null));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Error resending verification email: " + e.getMessage()));
        }
    }

    /**
     * POST /api/email/forgot-password - Request password reset
     * 
     * @param email The email address to send password reset to
     * @return Success or error response
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@RequestParam String email) {
        try {
            // In a real implementation, you would generate a reset token and send email
            // For simulation, we'll just return success
            return ResponseEntity.ok()
                .body(ApiResponse.success("Password reset link sent to your email. Check your inbox.", null));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Error sending password reset email: " + e.getMessage()));
        }
    }

    /**
     * POST /api/email/reset-password - Reset password using token
     * 
     * @param request Contains token and new password
     * @return Success or error response
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @RequestParam String token,
            @RequestParam String newPassword) {
        try {
            // In a real implementation, you would validate the token and reset the password
            // For simulation, we'll just return success
            return ResponseEntity.ok()
                .body(ApiResponse.success("Password reset successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error("Error resetting password: " + e.getMessage()));
        }
    }
}