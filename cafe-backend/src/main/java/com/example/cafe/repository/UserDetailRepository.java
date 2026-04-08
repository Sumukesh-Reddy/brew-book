package com.example.cafe.repository;

import com.example.cafe.entity.UserDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * UserDetailRepository - Data Access Layer for UserDetail entity
 * 
 * Extends JpaRepository to get CRUD operations for free
 * Provides methods to query UserDetail entities
 */
@Repository
public interface UserDetailRepository extends JpaRepository<UserDetail, Long> {
    
    /**
     * Find UserDetail by associated User ID
     * Spring Data JPA automatically generates query from method name
     */
    Optional<UserDetail> findByUserId(Long userId);
    
    /**
     * Check if UserDetail exists for a specific User
     */
    Boolean existsByUserId(Long userId);
    
    /**
     * Find UserDetail by verification token
     */
    Optional<UserDetail> findByVerificationToken(String token);
    
    /**
     * Find UserDetail by password reset token
     */
    Optional<UserDetail> findByPasswordResetToken(String token);
}