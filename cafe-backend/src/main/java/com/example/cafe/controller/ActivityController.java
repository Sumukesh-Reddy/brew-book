package com.example.cafe.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.cafe.dto.ApiResponse;
import com.example.cafe.entity.ActivityLog;
import com.example.cafe.entity.Cafe;
import com.example.cafe.repository.ActivityLogRepository;
import com.example.cafe.repository.CafeRepository;

@RestController
@RequestMapping("/api/activity")
@CrossOrigin(origins = "http://localhost:3000")
public class ActivityController {

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyActivity(@RequestParam(required = false) Long ownerId) {
        try {
            Long userId = ownerId != null ? ownerId : 1L;
            Cafe cafe = cafeRepository.findByOwnerId(userId)
                    .orElseThrow(() -> new RuntimeException("No cafe found for this owner"));

            List<Map<String, Object>> result = activityLogRepository.findTop20ByCafeIdOrderByCreatedAtDesc(cafe.getId())
                    .stream()
                    .map(this::toMap)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.success("Activity retrieved", result));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to load activity: " + e.getMessage()));
        }
    }

    private Map<String, Object> toMap(ActivityLog log) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", log.getId());
        m.put("type", log.getType());
        m.put("message", log.getMessage());
        m.put("createdAt", log.getCreatedAt() != null ? log.getCreatedAt().toString() : null);
        return m;
    }
}

