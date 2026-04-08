package com.example.cafe.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.cafe.dto.AddressDto;
import com.example.cafe.dto.UpdateUserRequest;
import com.example.cafe.entity.Address;
import com.example.cafe.entity.User;
import com.example.cafe.entity.UserDetail;
import com.example.cafe.repository.UserDetailRepository;
import com.example.cafe.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDetailRepository userDetailRepository;

    /**
     * Update user profile information
     */
    @Transactional
    public UserDetail updateUserProfile(Long userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        UserDetail userDetail = userDetailRepository.findByUserId(userId)
            .orElse(new UserDetail());

        // Set user if new detail
        if (userDetail.getId() == null) {
            userDetail.setUser(user);
        }

        // Update personal information
        if (request.getFirstName() != null) {
            userDetail.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            userDetail.setLastName(request.getLastName());
        }
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isEmpty()) {
            try {
                userDetail.setDateOfBirth(LocalDate.parse(request.getDateOfBirth()));
            } catch (Exception e) {
                // Handle parse error
            }
        }
        if (request.getGender() != null && !request.getGender().isEmpty()) {
            try {
                userDetail.setGender(UserDetail.Gender.valueOf(request.getGender().toUpperCase()));
            } catch (IllegalArgumentException e) {
                userDetail.setGender(UserDetail.Gender.OTHER);
            }
        }

        // Update address
        if (request.getAddress() != null) {
            AddressDto addrDto = request.getAddress();
            Address address = userDetail.getAddress() != null ? userDetail.getAddress() : new Address();
            
            if (addrDto.getStreet() != null) address.setStreet(addrDto.getStreet());
            if (addrDto.getPlotNo() != null) address.setPlotNo(addrDto.getPlotNo());
            if (addrDto.getCity() != null) address.setCity(addrDto.getCity());
            if (addrDto.getPincode() != null) address.setPincode(addrDto.getPincode());
            if (addrDto.getCountry() != null) address.setCountry(addrDto.getCountry());
            if (addrDto.getIsPrimary() != null) address.setIsPrimary(addrDto.getIsPrimary());
            
            userDetail.setAddress(address);
        }

        return userDetailRepository.save(userDetail);
    }

    /**
     * Get user profile completeness status
     */
    public Map<String, Object> getProfileStatus(Long userId) {
        Optional<UserDetail> userDetailOpt = userDetailRepository.findByUserId(userId);
        
        Map<String, Object> status = new HashMap<>();
        if (userDetailOpt.isPresent()) {
            UserDetail detail = userDetailOpt.get();
            boolean isProfileCompleted = detail.getFirstName() != null && 
                                       !detail.getFirstName().isEmpty() &&
                                       detail.getLastName() != null && 
                                       !detail.getLastName().isEmpty();
            
            status.put("profileCompleted", isProfileCompleted);
            status.put("emailVerified", detail.getEmailVerified());
            status.put("hasAddress", detail.getAddress() != null);
            status.put("hasAcademicRecords", detail.getAcademicRecords() != null && !detail.getAcademicRecords().isEmpty());
            status.put("hasWorkExperiences", detail.getWorkExperiences() != null && !detail.getWorkExperiences().isEmpty());
        } else {
            status.put("profileCompleted", false);
            status.put("emailVerified", false);
        }
        
        return status;
    }
}