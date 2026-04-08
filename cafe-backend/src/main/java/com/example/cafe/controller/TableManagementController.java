package com.example.cafe.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.cafe.dto.ApiResponse;
import com.example.cafe.dto.BookingDto;
import com.example.cafe.dto.CartItemDto;
import com.example.cafe.dto.TableBookingCartDto;
import com.example.cafe.dto.WalkInBookingDto;
import com.example.cafe.entity.ActivityLog;
import com.example.cafe.entity.Booking;
import com.example.cafe.entity.Cafe;
import com.example.cafe.entity.TableType;
import com.example.cafe.entity.User;
import com.example.cafe.repository.ActivityLogRepository;
import com.example.cafe.repository.BookingRepository;
import com.example.cafe.repository.CafeRepository;
import com.example.cafe.repository.TableTypeRepository;
import com.example.cafe.repository.UserRepository;

@RestController
@RequestMapping("/api/tables")
@CrossOrigin(origins = "http://localhost:3000")
public class TableManagementController {

    @Autowired
    private CafeRepository cafeRepository;
    
    @Autowired
    private TableTypeRepository tableTypeRepository;
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ActivityLogRepository activityLogRepository;

    /**
     * POST /api/tables/walk-in - Create walk-in booking
     */
    @PostMapping("/walk-in")
    @Transactional
    public ResponseEntity<ApiResponse<BookingDto>> createWalkInBooking(@RequestBody WalkInBookingDto walkIn) {
        try {
            if (walkIn.getCafeId() == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Cafe ID is required"));
            }
            
            if (walkIn.getTableTypeId() == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Table type is required"));
            }
            
            if (walkIn.getCustomerName() == null || walkIn.getCustomerName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Customer name is required"));
            }

            Cafe cafe = cafeRepository.findById(walkIn.getCafeId())
                    .orElseThrow(() -> new RuntimeException("Cafe not found"));
            
            TableType tableType = tableTypeRepository.findById(walkIn.getTableTypeId())
                    .orElseThrow(() -> new RuntimeException("Table type not found"));
            
            int quantity = walkIn.getQuantity() != null && walkIn.getQuantity() > 0 
                ? walkIn.getQuantity() : 1;
            
            // Check availability
            if (tableType.getAvailableTables() < quantity) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("Not enough tables available. " +
                            "Available: " + tableType.getAvailableTables()));
            }
            
            // Check for overlapping bookings for this table type
            LocalDateTime now = LocalDateTime.now();
            int duration = walkIn.getDurationMinutes() != null && walkIn.getDurationMinutes() > 0 
                ? walkIn.getDurationMinutes() : 60;
            LocalDateTime endTime = now.plusMinutes(duration);
            
            List<Booking> overlapping = bookingRepository.findOverlappingBookingsForTableType(
                cafe.getId(),
                tableType.getId(),
                Arrays.asList(Booking.BookingStatus.ACCEPTED, Booking.BookingStatus.OCCUPIED_WALKIN),
                endTime,
                now
            );
            
            int bookedCount = overlapping.stream()
                .mapToInt(b -> b.getQuantity() != null ? b.getQuantity() : 1)
                .sum();
            
            if (bookedCount + quantity > tableType.getTableCount()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("Not enough tables available for this time. " +
                            "Available: " + (tableType.getTableCount() - bookedCount)));
            }
            
            // Decrease available tables
            tableType.decreaseAvailableTables(quantity);
            tableTypeRepository.save(tableType);
            
            // Find available table numbers
            List<Integer> availableNumbers = findAvailableTableNumbers(
                cafe.getId(), now, endTime, quantity);
            
            Booking booking = new Booking();
            booking.setCafe(cafe);
            booking.setTableType(tableType);
            booking.setStartTime(now);
            booking.setEndTime(endTime);
            booking.setReservedUntil(endTime);
            booking.setStatus(Booking.BookingStatus.OCCUPIED_WALKIN);
            booking.setQuantity(quantity);
            booking.setTableNumber(availableNumbers.isEmpty() ? null : availableNumbers.get(0));
            booking.setCustomerName(walkIn.getCustomerName());
            booking.setCustomerPhone(walkIn.getCustomerPhone());
            booking.setNotes(walkIn.getNotes());
            booking.setIsWalkIn(true);
            
            Booking saved = bookingRepository.save(booking);
            
            // Log activity
            logActivity(cafe, "WALK_IN_BOOKING", 
                "Walk-in customer: " + walkIn.getCustomerName() + 
                " occupied " + quantity + " " + tableType.getTypeName() + " tables");
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Walk-in booking created", toDto(saved)));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create walk-in booking: " + e.getMessage()));
        }
    }

    /**
     * POST /api/tables/book-cart - Book multiple tables from cart
     */
    @PostMapping("/book-cart")
    @Transactional
    public ResponseEntity<ApiResponse<List<BookingDto>>> bookFromCart(@RequestBody TableBookingCartDto cart) {
        try {
            // Validate inputs
            if (cart.getCafeId() == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Cafe ID is required"));
            }
            
            if (cart.getCustomerId() == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Customer ID is required"));
            }
            
            if (cart.getItems() == null || cart.getItems().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Cart items are required"));
            }
            
            if (cart.getBookingDateTime() == null || cart.getBookingDateTime().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Booking date and time are required"));
            }

            Cafe cafe = cafeRepository.findById(cart.getCafeId())
                    .orElseThrow(() -> new RuntimeException("Cafe not found"));
            
            User customer = userRepository.findById(cart.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            
            LocalDateTime startTime;
            try {
                startTime = LocalDateTime.parse(cart.getBookingDateTime());
                // Validate that booking time is in the future
                if (startTime.isBefore(LocalDateTime.now())) {
                    return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Booking time must be in the future"));
                }
            } catch (Exception e) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid date time format. Use ISO format: yyyy-MM-ddTHH:mm:ss"));
            }
            
            int duration = cart.getDurationMinutes() != null && cart.getDurationMinutes() > 0 
                ? cart.getDurationMinutes() : 60;
            LocalDateTime endTime = startTime.plusMinutes(duration);
            
            List<Booking> createdBookings = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            
            for (CartItemDto item : cart.getItems()) {
                try {
                    if (item.getTableTypeId() == null) {
                        errors.add("Invalid item: missing table type");
                        continue;
                    }
                    
                    TableType tableType = tableTypeRepository.findById(item.getTableTypeId())
                            .orElseThrow(() -> new RuntimeException("Table type not found: " + item.getTableTypeId()));
                    
                    // Check if table type belongs to the cafe
                    if (!tableType.getCafe().getId().equals(cafe.getId())) {
                        errors.add("Table type " + tableType.getTypeName() + " does not belong to this cafe");
                        continue;
                    }
                    
                    int requestedQuantity = item.getQuantity() != null ? item.getQuantity() : 1;
                    
                    // Check if table type is active
                    if (!tableType.getIsActive()) {
                        errors.add("Table type " + tableType.getTypeName() + " is not available for booking");
                        continue;
                    }
                    
                    int availableTables = tableType.getAvailableTables();
                    
                    // Check availability
                    if (availableTables < requestedQuantity) {
                        errors.add("Not enough " + tableType.getTypeName() + 
                            " tables available. Available: " + availableTables + 
                            ", Requested: " + requestedQuantity);
                        continue;
                    }
                    
                    // Check for overlapping bookings for this table type
                    List<Booking> overlapping = bookingRepository.findOverlappingBookingsForTableType(
                        cafe.getId(),
                        tableType.getId(),
                        Arrays.asList(Booking.BookingStatus.ACCEPTED, Booking.BookingStatus.OCCUPIED_WALKIN),
                        endTime,
                        startTime
                    );
                    
                    // Calculate total tables already booked for this time
                    int bookedCount = overlapping.stream()
                        .mapToInt(b -> b.getQuantity() != null ? b.getQuantity() : 1)
                        .sum();
                    
                    if (bookedCount + requestedQuantity > tableType.getTableCount()) {
                        errors.add("Not enough " + tableType.getTypeName() + 
                            " tables available for the selected time. Available: " + 
                            (tableType.getTableCount() - bookedCount) + ", Requested: " + requestedQuantity);
                        continue;
                    }
                    
                    // Decrease available tables
                    tableType.decreaseAvailableTables(requestedQuantity);
                    tableTypeRepository.save(tableType);
                    
                    // Find available table numbers
                    List<Integer> availableNumbers = findAvailableTableNumbers(
                        cafe.getId(), startTime, endTime, requestedQuantity);
                    
                    String customerPhone = item.getCustomerPhone() != null ? item.getCustomerPhone() : 
                                           (cart.getCustomerPhone() != null ? cart.getCustomerPhone() : null);
                    
                    for (int i = 0; i < requestedQuantity; i++) {
                        Booking booking = new Booking();
                        booking.setCafe(cafe);
                        booking.setCustomer(customer);
                        booking.setTableType(tableType);
                        booking.setStartTime(startTime);
                        booking.setEndTime(endTime);
                        booking.setReservedUntil(endTime);
                        booking.setStatus(Booking.BookingStatus.REQUESTED);
                        booking.setQuantity(1);
                        booking.setTableNumber(i < availableNumbers.size() ? availableNumbers.get(i) : null);
                        booking.setNotes(item.getSpecialRequests());
                        booking.setCustomerName(customer.getName());
                        booking.setCustomerPhone(customerPhone);
                        booking.setIsWalkIn(false);
                        
                        Booking saved = bookingRepository.save(booking);
                        createdBookings.add(saved);
                    }
                    
                } catch (Exception e) {
                    errors.add("Failed to book " + (item.getTableTypeName() != null ? 
                        item.getTableTypeName() : "table") + ": " + e.getMessage());
                }
            }
            
            if (createdBookings.isEmpty()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("Failed to book any tables: " + 
                            String.join(", ", errors)));
            }
            
            // Log activity
            try {
                ActivityLog log = new ActivityLog();
                log.setCafe(cafe);
                log.setType("CART_BOOKING");
                log.setMessage(customer.getName() + " booked " + createdBookings.size() + 
                    " tables via cart" + (!errors.isEmpty() ? " with some errors: " + 
                    String.join(", ", errors) : ""));
                activityLogRepository.save(log);
            } catch (Exception ignored) {}
            
            List<BookingDto> dtos = createdBookings.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
            
            String message = "Successfully booked " + createdBookings.size() + " tables";
            if (!errors.isEmpty()) {
                message += ". Some items failed: " + String.join(", ", errors);
            }
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(message, dtos));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to book tables: " + e.getMessage()));
        }
    }

    /**
     * GET /api/tables/availability/{cafeId} - Check table availability
     */
    @GetMapping("/availability/{cafeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTableAvailability(
            @PathVariable Long cafeId,
            @RequestParam(required = false) String date) {
        try {
            Cafe cafe = cafeRepository.findById(cafeId)
                    .orElseThrow(() -> new RuntimeException("Cafe not found"));
            
            LocalDateTime checkDate = date != null ? 
                LocalDateTime.parse(date) : LocalDateTime.now();
            
            List<TableType> tableTypes = tableTypeRepository.findByCafeId(cafeId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("cafeId", cafeId);
            response.put("cafeName", cafe.getCafeName());
            response.put("date", checkDate.toString());
            
            Map<Long, Map<String, Object>> availabilityMap = new HashMap<>();
            
            for (TableType type : tableTypes) {
                Map<String, Object> typeInfo = new HashMap<>();
                typeInfo.put("tableTypeId", type.getId());
                typeInfo.put("typeName", type.getTypeName());
                typeInfo.put("totalTables", type.getTableCount());
                typeInfo.put("availableTables", type.getAvailableTables());
                typeInfo.put("seatingCapacity", type.getSeatingCapacityPerTable());
                typeInfo.put("pricePerHour", type.getPricePerHour());
                typeInfo.put("minimumOrderAmount", type.getMinimumOrderAmount());
                
                availabilityMap.put(type.getId(), typeInfo);
            }
            
            response.put("tableTypes", availabilityMap);
            
            return ResponseEntity.ok(ApiResponse.success("Availability retrieved", response));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to get availability: " + e.getMessage()));
        }
    }

    /**
     * GET /api/tables/availability/detailed/{cafeId} - Detailed availability check
     */
    @GetMapping("/availability/detailed/{cafeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDetailedAvailability(
            @PathVariable Long cafeId,
            @RequestParam String dateTime,
            @RequestParam(required = false) Integer duration) {
        try {
            Cafe cafe = cafeRepository.findById(cafeId)
                    .orElseThrow(() -> new RuntimeException("Cafe not found"));
            
            LocalDateTime checkTime;
            try {
                checkTime = LocalDateTime.parse(dateTime);
            } catch (Exception e) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid date time format"));
            }
            
            int checkDuration = duration != null && duration > 0 ? duration : 60;
            LocalDateTime endTime = checkTime.plusMinutes(checkDuration);
            
            List<TableType> tableTypes = tableTypeRepository.findByCafeId(cafeId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("cafeId", cafeId);
            response.put("cafeName", cafe.getCafeName());
            response.put("dateTime", checkTime.toString());
            response.put("duration", checkDuration);
            
            List<Map<String, Object>> availabilityList = new ArrayList<>();
            
            for (TableType type : tableTypes) {
                Map<String, Object> typeInfo = new HashMap<>();
                typeInfo.put("tableTypeId", type.getId());
                typeInfo.put("typeName", type.getTypeName());
                typeInfo.put("totalTables", type.getTableCount());
                typeInfo.put("currentAvailable", type.getAvailableTables());
                
                // Get overlapping bookings for this time
                List<Booking> overlapping = bookingRepository.findOverlappingBookingsForTableType(
                    cafeId,
                    type.getId(),
                    Arrays.asList(Booking.BookingStatus.ACCEPTED, Booking.BookingStatus.OCCUPIED_WALKIN),
                    endTime,
                    checkTime
                );
                
                int bookedCount = overlapping.stream()
                    .mapToInt(b -> b.getQuantity() != null ? b.getQuantity() : 1)
                    .sum();
                
                int availableForTime = type.getTableCount() - bookedCount;
                
                typeInfo.put("bookedForTime", bookedCount);
                typeInfo.put("availableForTime", availableForTime);
                typeInfo.put("isAvailable", availableForTime > 0);
                typeInfo.put("seatingCapacity", type.getSeatingCapacityPerTable());
                typeInfo.put("pricePerHour", type.getPricePerHour());
                
                // Add current bookings for this time
                List<Map<String, Object>> bookingInfo = overlapping.stream()
                        .map(b -> {
                            Map<String, Object> info = new HashMap<>();
                            info.put("bookingId", b.getId());
                            info.put("tableNumber", b.getTableNumber());
                            info.put("quantity", b.getQuantity());
                            info.put("status", b.getStatus().toString());
                            return info;
                        })
                        .collect(Collectors.toList());
                typeInfo.put("currentBookings", bookingInfo);
                
                availabilityList.add(typeInfo);
            }
            
            response.put("tableTypes", availabilityList);
            
            return ResponseEntity.ok(ApiResponse.success("Detailed availability retrieved", response));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to get availability: " + e.getMessage()));
        }
    }

    /**
     * GET /api/tables/owner/{ownerId}/occupied - Get occupied tables for owner
     */
    @GetMapping("/owner/{ownerId}/occupied")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getOccupiedTables(@PathVariable Long ownerId) {
        try {
            Cafe cafe = cafeRepository.findByOwnerId(ownerId)
                    .orElseThrow(() -> new RuntimeException("No cafe found for this owner"));
            
            LocalDateTime now = LocalDateTime.now();
            
            List<Booking> occupiedBookings = bookingRepository.findByCafeIdAndStatusInAndStartTimeLessThanAndReservedUntilGreaterThan(
                    cafe.getId(),
                    Arrays.asList(Booking.BookingStatus.ACCEPTED, 
                                 Booking.BookingStatus.OCCUPIED_WALKIN),
                    now.plusHours(1),
                    now.minusHours(1));
            
            List<Map<String, Object>> result = new ArrayList<>();
            for (Booking booking : occupiedBookings) {
                Map<String, Object> item = new HashMap<>();
                item.put("bookingId", booking.getId());
                item.put("tableNumber", booking.getTableNumber());
                item.put("tableType", booking.getTableType() != null ? 
                    booking.getTableType().getTypeName() : "Regular");
                item.put("customerName", booking.getCustomerName());
                item.put("startTime", booking.getStartTime() != null ? 
                    booking.getStartTime().toString() : null);
                item.put("endTime", booking.getEndTime() != null ? 
                    booking.getEndTime().toString() : null);
                item.put("status", booking.getStatus() != null ? 
                    booking.getStatus().toString() : null);
                item.put("isWalkIn", booking.getIsWalkIn() != null ? booking.getIsWalkIn() : false);
                item.put("customerPhone", booking.getCustomerPhone());
                result.add(item);
            }
            
            return ResponseEntity.ok(ApiResponse.success("Occupied tables retrieved", result));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to get occupied tables: " + e.getMessage()));
        }
    }

    /**
     * POST /api/tables/{bookingId}/complete - Complete a booking
     */
    @PostMapping("/{bookingId}/complete")
    @Transactional
    public ResponseEntity<ApiResponse<BookingDto>> completeBooking(
            @PathVariable Long bookingId,
            @RequestParam(required = false) Long ownerId) {
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));
            
            if (booking.getStatus() != Booking.BookingStatus.ACCEPTED && 
                booking.getStatus() != Booking.BookingStatus.OCCUPIED_WALKIN) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Only accepted or occupied bookings can be completed"));
            }
            
            // Calculate table revenue before completing
            if (booking.getTableType() != null && booking.getStartTime() != null && booking.getEndTime() != null) {
                double hours = java.time.Duration.between(booking.getStartTime(), booking.getEndTime()).toMinutes() / 60.0;
                double tableRevenue = booking.getTableType().getPricePerHour() * hours * (booking.getQuantity() != null ? booking.getQuantity() : 1);
                
                // Add revenue to cafe
                Cafe cafe = booking.getCafe();
                if (cafe != null) {
                    cafe.addRevenue(tableRevenue);
                    cafeRepository.save(cafe);
                }
            }
            
            // Increase available tables back
            if (booking.getTableType() != null) {
                TableType tableType = booking.getTableType();
                int quantity = booking.getQuantity() != null ? booking.getQuantity() : 1;
                tableType.increaseAvailableTables(quantity);
                tableTypeRepository.save(tableType);
            }
            
            booking.setStatus(Booking.BookingStatus.COMPLETED);
            booking.setCompletedAt(LocalDateTime.now());
            booking.setReleaseAt(LocalDateTime.now().plusMinutes(5));
            booking.setReservedUntil(booking.getReleaseAt());
            
            Booking saved = bookingRepository.save(booking);
            
            // Log activity
            logActivity(booking.getCafe(), "BOOKING_COMPLETED",
                "Booking completed for " + booking.getCustomerName() + 
                " (Table " + booking.getTableNumber() + ")");
            
            return ResponseEntity.ok(ApiResponse.success("Booking completed", toDto(saved)));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to complete booking: " + e.getMessage()));
        }
    }

    /**
     * POST /api/tables/{bookingId}/cancel - Cancel a booking
     */
    @PostMapping("/{bookingId}/cancel")
    @Transactional
    public ResponseEntity<ApiResponse<BookingDto>> cancelBooking(
            @PathVariable Long bookingId,
            @RequestParam(required = false) Long ownerId) {
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));
            
            // Increase available tables back
            if (booking.getTableType() != null) {
                TableType tableType = booking.getTableType();
                int quantity = booking.getQuantity() != null ? booking.getQuantity() : 1;
                tableType.increaseAvailableTables(quantity);
                tableTypeRepository.save(tableType);
            }
            
            booking.setStatus(Booking.BookingStatus.REJECTED);
            Booking saved = bookingRepository.save(booking);
            
            return ResponseEntity.ok(ApiResponse.success("Booking cancelled", toDto(saved)));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to cancel booking: " + e.getMessage()));
        }
    }

    /**
     * GET /api/tables/revenue/stats/{ownerId} - Get revenue statistics for owner
     */
    @GetMapping("/revenue/stats/{ownerId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRevenueStats(@PathVariable Long ownerId) {
        try {
            Cafe cafe = cafeRepository.findByOwnerId(ownerId)
                    .orElseThrow(() -> new RuntimeException("No cafe found for this owner"));
            
            List<Booking> completedBookings = bookingRepository.findByCafeIdAndStatus(cafe.getId(), Booking.BookingStatus.COMPLETED);
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalRevenue", cafe.getTotalRevenue());
            stats.put("completedBookings", completedBookings.size());
            
            // Revenue by table type
            Map<String, Double> revenueByTableType = new HashMap<>();
            Map<String, Integer> bookingsByTableType = new HashMap<>();
            
            for (Booking booking : completedBookings) {
                if (booking.getTableType() != null) {
                    String typeName = booking.getTableType().getTypeName();
                    double hours = java.time.Duration.between(booking.getStartTime(), booking.getEndTime()).toMinutes() / 60.0;
                    double revenue = booking.getTableType().getPricePerHour() * hours * (booking.getQuantity() != null ? booking.getQuantity() : 1);
                    
                    revenueByTableType.put(typeName, 
                        revenueByTableType.getOrDefault(typeName, 0.0) + revenue);
                    
                    bookingsByTableType.put(typeName,
                        bookingsByTableType.getOrDefault(typeName, 0) + 1);
                }
            }
            
            stats.put("revenueByTableType", revenueByTableType);
            stats.put("bookingsByTableType", bookingsByTableType);
            
            // Daily revenue for last 7 days
            Map<String, Double> dailyRevenue = new HashMap<>();
            LocalDateTime now = LocalDateTime.now();
            for (int i = 6; i >= 0; i--) {
                LocalDateTime day = now.minusDays(i);
                String dayKey = day.toLocalDate().toString();
                
                double dayRevenue = completedBookings.stream()
                    .filter(b -> b.getCompletedAt() != null && 
                                 b.getCompletedAt().toLocalDate().equals(day.toLocalDate()))
                    .mapToDouble(b -> {
                        if (b.getTableType() != null) {
                            double hours = java.time.Duration.between(b.getStartTime(), b.getEndTime()).toMinutes() / 60.0;
                            return b.getTableType().getPricePerHour() * hours * (b.getQuantity() != null ? b.getQuantity() : 1);
                        }
                        return 0;
                    })
                    .sum();
                
                dailyRevenue.put(dayKey, dayRevenue);
            }
            stats.put("dailyRevenue", dailyRevenue);
            
            return ResponseEntity.ok(ApiResponse.success("Revenue stats retrieved", stats));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to get revenue stats: " + e.getMessage()));
        }
    }

    /**
     * Helper method to find available table numbers
     */
    private List<Integer> findAvailableTableNumbers(Long cafeId, LocalDateTime start, 
                                                    LocalDateTime end, int count) {
        List<Booking> overlapping = bookingRepository
                .findByCafeIdAndStatusInAndStartTimeLessThanAndReservedUntilGreaterThan(
                        cafeId,
                        Arrays.asList(Booking.BookingStatus.ACCEPTED, 
                                     Booking.BookingStatus.OCCUPIED_WALKIN),
                        end,
                        start);
        
        Set<Integer> occupied = new HashSet<>();
        for (Booking b : overlapping) {
            if (b.getTableNumber() != null) occupied.add(b.getTableNumber());
        }
        
        List<Integer> available = new ArrayList<>();
        // Assuming max 100 tables per cafe
        for (int i = 1; i <= 100 && available.size() < count; i++) {
            if (!occupied.contains(i)) {
                available.add(i);
            }
        }
        
        return available;
    }

    /**
     * Helper method to convert Booking to DTO
     */
    private BookingDto toDto(Booking booking) {
        BookingDto dto = new BookingDto();
        dto.setId(booking.getId());
        dto.setCafeId(booking.getCafe() != null ? booking.getCafe().getId() : null);
        dto.setCafeName(booking.getCafe() != null ? booking.getCafe().getCafeName() : null);
        dto.setCustomerId(booking.getCustomer() != null ? booking.getCustomer().getId() : null);
        dto.setCustomerName(booking.getCustomerName() != null ? 
            booking.getCustomerName() : 
            (booking.getCustomer() != null ? booking.getCustomer().getName() : null));
        dto.setCustomerPhone(booking.getCustomerPhone());
        dto.setTableTypeId(booking.getTableType() != null ? booking.getTableType().getId() : null);
        dto.setTableTypeName(booking.getTableType() != null ? booking.getTableType().getTypeName() : null);
        dto.setStartTime(booking.getStartTime() != null ? booking.getStartTime().toString() : null);
        dto.setEndTime(booking.getEndTime() != null ? booking.getEndTime().toString() : null);
        dto.setStatus(booking.getStatus() != null ? booking.getStatus().toString().toLowerCase() : null);
        dto.setTableNumber(booking.getTableNumber());
        dto.setNotes(booking.getNotes());
        dto.setQuantity(booking.getQuantity());
        dto.setCreatedAt(booking.getCreatedAt() != null ? booking.getCreatedAt().toString() : null);
        return dto;
    }

    /**
     * Helper method to log activity
     */
    private void logActivity(Cafe cafe, String type, String message) {
        try {
            ActivityLog log = new ActivityLog();
            log.setCafe(cafe);
            log.setType(type);
            log.setMessage(message);
            activityLogRepository.save(log);
        } catch (Exception ignored) {}
    }

    /**
 * GET /api/tables/cafe/{cafeId}/occupied - Get occupied tables for a cafe
 */
@GetMapping("/cafe/{cafeId}/occupied")
public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getOccupiedTablesByCafe(@PathVariable Long cafeId) {
    try {
        LocalDateTime now = LocalDateTime.now();
        
        List<Booking> occupiedBookings = bookingRepository.findByCafeIdAndStatusInAndStartTimeLessThanAndReservedUntilGreaterThan(
                cafeId,
                Arrays.asList(Booking.BookingStatus.ACCEPTED, 
                             Booking.BookingStatus.OCCUPIED_WALKIN),
                now.plusHours(1),
                now.minusHours(1));
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Booking booking : occupiedBookings) {
            Map<String, Object> item = new HashMap<>();
            item.put("bookingId", booking.getId());
            item.put("tableNumber", booking.getTableNumber());
            item.put("tableType", booking.getTableType() != null ? 
                booking.getTableType().getTypeName() : "Regular");
            item.put("customerName", booking.getCustomerName());
            item.put("startTime", booking.getStartTime() != null ? 
                booking.getStartTime().toString() : null);
            item.put("endTime", booking.getEndTime() != null ? 
                booking.getEndTime().toString() : null);
            item.put("status", booking.getStatus() != null ? 
                booking.getStatus().toString() : null);
            item.put("isWalkIn", booking.getIsWalkIn() != null ? booking.getIsWalkIn() : false);
            item.put("customerPhone", booking.getCustomerPhone());
            result.add(item);
        }
        
        return ResponseEntity.ok(ApiResponse.success("Occupied tables retrieved", result));
        
    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error("Failed to get occupied tables: " + e.getMessage()));
    }
}
}
