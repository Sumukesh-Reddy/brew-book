package com.example.cafe.repository;

import com.example.cafe.entity.WorkExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * WorkExperienceRepository - Data Access Layer for WorkExperience entity
 * 
 * Provides methods to query WorkExperience entities
 * Supports operations on work experiences associated with users
 */
@Repository
public interface WorkExperienceRepository extends JpaRepository<WorkExperience, Long> {
    
    /**
     * Find all work experiences for a specific user detail
     */
    List<WorkExperience> findByUserDetailId(Long userDetailId);
    
    /**
     * Delete all work experiences for a specific user detail
     */
    void deleteByUserDetailId(Long userDetailId);
}