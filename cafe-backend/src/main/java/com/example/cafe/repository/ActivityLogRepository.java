// ActivityLogRepository.java
package com.example.cafe.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.cafe.entity.ActivityLog;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByCafeIdOrderByCreatedAtDesc(Long cafeId);
    List<ActivityLog> findTop20ByCafeIdOrderByCreatedAtDesc(Long cafeId);
}