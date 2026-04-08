package com.example.cafe.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cafe.dto.ApiResponse;
import com.example.cafe.dto.TableTypeDetailDto;
import com.example.cafe.dto.TableTypeDto;
import com.example.cafe.entity.Booking;
import com.example.cafe.entity.Cafe;
import com.example.cafe.entity.TableType;
import com.example.cafe.repository.BookingRepository;
import com.example.cafe.repository.CafeRepository;
import com.example.cafe.repository.TableTypeRepository;

@RestController
@RequestMapping("/api/table-types")
@CrossOrigin(origins = "http://localhost:3000")
public class TableTypeController {

    @Autowired
    private TableTypeRepository tableTypeRepository;

    @Autowired
    private CafeRepository cafeRepository;
    
    @Autowired
    private BookingRepository bookingRepository;

    @GetMapping("/cafe/{cafeId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTableTypesForCafe(@PathVariable Long cafeId) {
        try {
            Optional<Cafe> cafeOpt = cafeRepository.findById(cafeId);
            if (cafeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Cafe not found"));
            }

            List<Map<String, Object>> list = tableTypeRepository.findByCafeId(cafeId)
                    .stream()
                    .filter(t -> t.getIsActive() != null && t.getIsActive())
                    .map(this::toMap)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.success("Table types retrieved", list));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to load table types: " + e.getMessage()));
        }
    }
    
    @GetMapping("/cafe/{cafeId}/with-bookings")
    public ResponseEntity<ApiResponse<List<TableTypeDetailDto>>> getTableTypesWithBookings(@PathVariable Long cafeId) {
        try {
            Optional<Cafe> cafeOpt = cafeRepository.findById(cafeId);
            if (cafeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Cafe not found"));
            }

            List<TableType> tableTypes = tableTypeRepository.findByCafeId(cafeId);
            
            // Get active bookings
            LocalDateTime now = LocalDateTime.now();
            List<Booking> activeBookings = bookingRepository.findByCafeIdAndStatusInAndStartTimeLessThanAndReservedUntilGreaterThan(
                    cafeId,
                    Arrays.asList(Booking.BookingStatus.ACCEPTED, 
                                 Booking.BookingStatus.OCCUPIED_WALKIN),
                    now.plusHours(24),
                    now.minusHours(1));
            
            // Group bookings by table type
            Map<Long, List<Booking>> bookingsByType = activeBookings.stream()
                    .filter(b -> b.getTableType() != null)
                    .collect(Collectors.groupingBy(b -> b.getTableType().getId()));
            
            List<TableTypeDetailDto> result = new ArrayList<>();
            for (TableType type : tableTypes) {
                TableTypeDetailDto dto = new TableTypeDetailDto();
                dto.setId(type.getId());
                dto.setTypeName(type.getTypeName());
                dto.setDescription(type.getDescription());
                dto.setTableCount(type.getTableCount());
                dto.setAvailableTables(type.getAvailableTables());
                dto.setSeatingCapacityPerTable(type.getSeatingCapacityPerTable());
                dto.setMinimumOrderAmount(type.getMinimumOrderAmount());
                dto.setPricePerHour(type.getPricePerHour());
                dto.setIsActive(type.getIsActive());
                
                // Add bookings for this table type
                List<Booking> typeBookings = bookingsByType.getOrDefault(type.getId(), new ArrayList<>());
                List<Map<String, Object>> bookingInfo = typeBookings.stream()
                        .map(b -> {
                            Map<String, Object> info = new HashMap<>();
                            info.put("bookingId", b.getId());
                            info.put("tableNumber", b.getTableNumber());
                            info.put("customerName", b.getCustomerName());
                            info.put("startTime", b.getStartTime() != null ? b.getStartTime().toString() : null);
                            info.put("endTime", b.getEndTime() != null ? b.getEndTime().toString() : null);
                            info.put("status", b.getStatus() != null ? b.getStatus().toString() : null);
                            info.put("isWalkIn", b.getIsWalkIn() != null ? b.getIsWalkIn() : false);
                            info.put("customerPhone", b.getCustomerPhone());
                            return info;
                        })
                        .collect(Collectors.toList());
                dto.setCurrentBookings(bookingInfo);
                
                result.add(dto);
            }

            return ResponseEntity.ok(ApiResponse.success("Table types with bookings retrieved", result));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to load table types: " + e.getMessage()));
        }
    }

    @GetMapping("/{tableTypeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTableTypeById(@PathVariable Long tableTypeId) {
        try {
            Optional<TableType> tableTypeOpt = tableTypeRepository.findById(tableTypeId);
            if (tableTypeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Table type not found"));
            }

            return ResponseEntity.ok(ApiResponse.success("Table type retrieved", toMap(tableTypeOpt.get())));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to load table type: " + e.getMessage()));
        }
    }

    @PostMapping("/cafe/{cafeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createTableType(
            @PathVariable Long cafeId,
            @RequestBody TableTypeDto tableTypeDto) {
        try {
            Optional<Cafe> cafeOpt = cafeRepository.findById(cafeId);
            if (cafeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Cafe not found"));
            }

            Cafe cafe = cafeOpt.get();

            TableType tableType = new TableType();
            tableType.setCafe(cafe);
            tableType.setTypeName(tableTypeDto.getTypeName());
            tableType.setDescription(tableTypeDto.getDescription());

            int tableCount = tableTypeDto.getTableCount() != null ? tableTypeDto.getTableCount() : 0;
            tableType.setTableCount(tableCount);
            // Initially set available = total
            tableType.setAvailableTables(tableCount);

            tableType.setSeatingCapacityPerTable(
                tableTypeDto.getSeatingCapacityPerTable() != null 
                    ? tableTypeDto.getSeatingCapacityPerTable() 
                    : 4
            );
            tableType.setMinimumOrderAmount(
                tableTypeDto.getMinimumOrderAmount() != null 
                    ? tableTypeDto.getMinimumOrderAmount() 
                    : 0.0
            );
            tableType.setPricePerHour(
                tableTypeDto.getPricePerHour() != null 
                    ? tableTypeDto.getPricePerHour() 
                    : 0.0
            );
            tableType.setIsActive(tableTypeDto.getIsActive() != null ? tableTypeDto.getIsActive() : true);

            TableType saved = tableTypeRepository.save(tableType);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Table type created successfully", toMap(saved)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create table type: " + e.getMessage()));
        }
    }

    @PutMapping("/{tableTypeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateTableType(
            @PathVariable Long tableTypeId,
            @RequestBody TableTypeDto tableTypeDto) {
        try {
            Optional<TableType> tableTypeOpt = tableTypeRepository.findById(tableTypeId);
            if (tableTypeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Table type not found"));
            }

            TableType tableType = tableTypeOpt.get();
            
            // Update fields
            if (tableTypeDto.getTypeName() != null) {
                tableType.setTypeName(tableTypeDto.getTypeName());
            }
            if (tableTypeDto.getDescription() != null) {
                tableType.setDescription(tableTypeDto.getDescription());
            }
            if (tableTypeDto.getTableCount() != null) {
                int oldCount = tableType.getTableCount();
                int newCount = tableTypeDto.getTableCount();
                tableType.setTableCount(newCount);
                // Adjust available tables by the difference
                tableType.setAvailableTables(tableType.getAvailableTables() + (newCount - oldCount));
            }
            if (tableTypeDto.getSeatingCapacityPerTable() != null) {
                tableType.setSeatingCapacityPerTable(tableTypeDto.getSeatingCapacityPerTable());
            }
            if (tableTypeDto.getMinimumOrderAmount() != null) {
                tableType.setMinimumOrderAmount(tableTypeDto.getMinimumOrderAmount());
            }
            if (tableTypeDto.getPricePerHour() != null) {
                tableType.setPricePerHour(tableTypeDto.getPricePerHour());
            }
            if (tableTypeDto.getIsActive() != null) {
                tableType.setIsActive(tableTypeDto.getIsActive());
            }

            TableType saved = tableTypeRepository.save(tableType);

            return ResponseEntity.ok(ApiResponse.success("Table type updated successfully", toMap(saved)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update table type: " + e.getMessage()));
        }
    }

    @PutMapping("/{tableTypeId}/price")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateTableTypePrice(
            @PathVariable Long tableTypeId,
            @RequestBody Map<String, Double> priceData) {
        try {
            Optional<TableType> tableTypeOpt = tableTypeRepository.findById(tableTypeId);
            if (tableTypeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Table type not found"));
            }

            TableType tableType = tableTypeOpt.get();
            Double price = priceData.get("pricePerHour");
            
            if (price == null || price < 0) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Valid price is required"));
            }

            tableType.setPricePerHour(price);
            TableType saved = tableTypeRepository.save(tableType);

            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getId());
            response.put("typeName", saved.getTypeName());
            response.put("pricePerHour", saved.getPricePerHour());

            return ResponseEntity.ok(ApiResponse.success("Price updated successfully", response));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to update price: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{tableTypeId}")
    public ResponseEntity<ApiResponse<Void>> deleteTableType(@PathVariable Long tableTypeId) {
        try {
            Optional<TableType> tableTypeOpt = tableTypeRepository.findById(tableTypeId);
            if (tableTypeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Table type not found"));
            }

            // Soft delete - just mark as inactive
            TableType tableType = tableTypeOpt.get();
            tableType.setIsActive(false);
            tableTypeRepository.save(tableType);

            return ResponseEntity.ok(ApiResponse.success("Table type deleted successfully", null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete table type: " + e.getMessage()));
        }
    }

    private Map<String, Object> toMap(TableType type) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", type.getId());
        m.put("typeName", type.getTypeName());
        m.put("description", type.getDescription());
        m.put("tableCount", type.getTableCount());
        m.put("availableTables", type.getAvailableTables());
        m.put("seatingCapacityPerTable", type.getSeatingCapacityPerTable());
        m.put("minimumOrderAmount", type.getMinimumOrderAmount());
        m.put("pricePerHour", type.getPricePerHour());
        m.put("isActive", type.getIsActive());
        return m;
    }
}