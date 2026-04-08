package com.example.cafe.repository;

import com.example.cafe.entity.AcademicRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * AcademicRecordRepository - Data Access Layer for AcademicRecord entity
 * 
 * Provides methods to query AcademicRecord entities
 * Supports operations on academic records associated with users
 */
@Repository
public interface AcademicRecordRepository extends JpaRepository<AcademicRecord, Long> {
    
    /**
     * Find all academic records for a specific user detail
     */
    List<AcademicRecord> findByUserDetailId(Long userDetailId);
    
    /**
     * Delete all academic records for a specific user detail
     */
    void deleteByUserDetailId(Long userDetailId);
}