// StaffMemberRepository.java - Add this method
package com.example.cafe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.cafe.entity.StaffMember;

@Repository
public interface StaffMemberRepository extends JpaRepository<StaffMember, Long> {
    List<StaffMember> findByCafeId(Long cafeId);
    List<StaffMember> findByCafeIdOrderByCreatedAtDesc(Long cafeId);
    Optional<StaffMember> findByUserId(Long userId); // Add this method
}