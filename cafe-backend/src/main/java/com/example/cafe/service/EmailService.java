package com.example.cafe.service;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.example.cafe.entity.User;
import com.example.cafe.entity.UserDetail;
import com.example.cafe.repository.UserDetailRepository;
import com.example.cafe.repository.UserRepository;

@Service
public class EmailService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDetailRepository userDetailRepository;
    
    @Autowired
    private JavaMailSender mailSender;

    public void sendVerificationEmail(User user, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Verify Your Email Address - Brew & Book");
            message.setText(
                "Dear " + user.getName() + ",\n\n" +
                "Thank you for registering with Brew & Book!\n\n" +
                "Please wait for the administrator to review your registration. Once approved, you will receive another email with your login credentials.\n\n" +
                "If you didn't create an account, please ignore this email.\n\n" +
                "Best regards,\n" +
                "Brew & Book Team"
            );
            
            mailSender.send(message);
            System.out.println("Verification email sent to: " + user.getEmail());
        } catch (Exception e) {
            System.err.println("Failed to send verification email: " + e.getMessage());
            // Fallback to console log
            System.out.println("=== VERIFICATION EMAIL (FALLBACK) ===");
            System.out.println("To: " + user.getEmail());
            System.out.println("Token: " + token);
            System.out.println("=====================================");
        }
    }

    public void sendPasswordResetEmail(User user, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Password Reset Request - Brew & Book");
            message.setText(
                "Dear " + user.getName() + ",\n\n" +
                "We received a request to reset your password.\n\n" +
                "Click the link below to reset your password:\n" +
                "http://localhost:3000/reset-password?token=" + token + "\n\n" +
                "This link will expire in 1 hour.\n\n" +
                "If you didn't request this, please ignore this email.\n\n" +
                "Best regards,\n" +
                "Brew & Book Team"
            );
            
            mailSender.send(message);
            System.out.println("Password reset email sent to: " + user.getEmail());
        } catch (Exception e) {
            System.err.println("Failed to send password reset email: " + e.getMessage());
            // Fallback to console log
            System.out.println("=== PASSWORD RESET EMAIL (FALLBACK) ===");
            System.out.println("To: " + user.getEmail());
            System.out.println("Token: " + token);
            System.out.println("========================================");
        }
    }

    /**
     * Send OTP email to approved user
     */
    public void sendOTPEmail(User user, String otp, String userType) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Your Account Has Been Approved - Login Credentials");
            message.setText(
                "Dear " + user.getName() + ",\n\n" +
                "Congratulations! Your account has been approved by the administrator.\n\n" +
                "You can now login to your account using the following credentials:\n\n" +
                "Email: " + user.getEmail() + "\n" +
                "Temporary Password (OTP): " + otp + "\n\n" +
                "For security reasons, you will be required to change your password on first login.\n" +
                "Login at: http://localhost:3000/signin\n\n" +
                "Thank you for registering with Brew & Book!\n\n" +
                "Best regards,\n" +
                "Brew & Book Team"
            );
            
            mailSender.send(message);
            System.out.println("OTP email sent to: " + user.getEmail());
        } catch (Exception e) {
            System.err.println("Failed to send OTP email: " + e.getMessage());
            // Fallback to console log
            System.out.println("=== OTP EMAIL (FALLBACK) ===");
            System.out.println("To: " + user.getEmail());
            System.out.println("OTP: " + otp);
            System.out.println("==============================");
        }
    }

    /**
     * Send rejection email
     */
    public void sendRejectionEmail(User user, String reason, String userType) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Account Registration Update - Brew & Book");
            message.setText(
                "Dear " + user.getName() + ",\n\n" +
                "Thank you for your interest in Brew & Book.\n\n" +
                "After careful review, we regret to inform you that your registration as a " 
                + userType + " could not be approved at this time.\n\n" +
                "Reason: " + reason + "\n\n" +
                "If you believe this is an error or would like to reapply with correct information,\n" +
                "please contact our support team.\n\n" +
                "Thank you for your understanding.\n\n" +
                "Best regards,\n" +
                "Brew & Book Team"
            );
            
            mailSender.send(message);
            System.out.println("Rejection email sent to: " + user.getEmail());
        } catch (Exception e) {
            System.err.println("Failed to send rejection email: " + e.getMessage());
            // Fallback to console log
            System.out.println("=== REJECTION EMAIL (FALLBACK) ===");
            System.out.println("To: " + user.getEmail());
            System.out.println("Reason: " + reason);
            System.out.println("===================================");
        }
    }

    public String generateVerificationToken() {
        return UUID.randomUUID().toString();
    }

    public String generatePasswordResetToken() {
        return UUID.randomUUID().toString();
    }

    public boolean verifyEmail(String token) {
        UserDetail userDetail = userDetailRepository.findByVerificationToken(token).orElse(null);
        
        if (userDetail != null) {
            userDetail.setEmailVerified(true);
            userDetail.setVerificationToken(null);
            userDetailRepository.save(userDetail);
            return true;
        }
        
        return false;
    }

    public String createVerificationToken(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            String token = generateVerificationToken();
            
            UserDetail userDetail = userDetailRepository.findByUserId(userId)
                .orElse(new UserDetail());
            
            userDetail.setUser(user);
            userDetail.setVerificationToken(token);
            userDetail.setEmailVerified(false);
            
            userDetailRepository.save(userDetail);
            return token;
        }
        
        return null;
    }

    public String createPasswordResetToken(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            String token = generatePasswordResetToken();
            
            UserDetail userDetail = userDetailRepository.findByUserId(user.getId())
                .orElse(new UserDetail());
            
            userDetail.setUser(user);
            userDetail.setPasswordResetToken(token);
            
            userDetailRepository.save(userDetail);
            return token;
        }
        
        return null;
    }

    public boolean resetPassword(String token, String newPassword) {
        UserDetail userDetail = userDetailRepository.findByPasswordResetToken(token).orElse(null);
        
        if (userDetail != null && userDetail.getUser() != null) {
            User user = userDetail.getUser();
            user.setPassword(newPassword);
            
            userRepository.save(user);
            userDetail.setPasswordResetToken(null);
            userDetailRepository.save(userDetail);
            
            return true;
        }
        
        return false;
    }


    public void sendTemporaryPasswordEmail(User user, String tempPassword) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("Welcome to Brew & Book - Your Login Credentials");
            message.setText(
                "Dear " + user.getName() + ",\n\n" +
                "Welcome to Brew & Book! Your account has been created successfully.\n\n" +
                "You can now login to your account using the following credentials:\n\n" +
                "Email: " + user.getEmail() + "\n" +
                "Temporary Password: " + tempPassword + "\n\n" +
                "For security reasons, you will be required to change your password on first login.\n" +
                "Login at: http://localhost:3000/signin\n\n" +
                "Best regards,\n" +
                "Brew & Book Team"
            );
            
            mailSender.send(message);
            System.out.println("Welcome email sent to: " + user.getEmail());
        } catch (Exception e) {
            System.err.println("Failed to send welcome email: " + e.getMessage());
            // Fallback to console log
            System.out.println("=== WELCOME EMAIL (FALLBACK) ===");
            System.out.println("To: " + user.getEmail());
            System.out.println("Temporary Password: " + tempPassword);
            System.out.println("==================================");
        }
    }
}