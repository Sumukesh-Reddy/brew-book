package com.example.cafe.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
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
import com.example.cafe.dto.BookingRequestDto;
import com.example.cafe.entity.ActivityLog;
import com.example.cafe.entity.Booking;
import com.example.cafe.entity.Booking.BookingStatus;
import com.example.cafe.entity.Cafe;
import com.example.cafe.entity.TableType;
import com.example.cafe.entity.User;
import com.example.cafe.repository.ActivityLogRepository;
import com.example.cafe.repository.BookingRepository;
import com.example.cafe.repository.CafeRepository;
import com.example.cafe.repository.TableTypeRepository;
import com.example.cafe.repository.UserRepository;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:3000")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TableTypeRepository tableTypeRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    /**
     * POST /api/bookings/request - Customer creates a booking request.
     */
    @PostMapping("/request")
    public ResponseEntity<ApiResponse<BookingDto>> requestBooking(@RequestBody BookingRequestDto req) {
        try {
            if (req.getCafeId() == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("cafeId is required"));
            }
            if (req.getCustomerId() == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("customerId is required"));
            }
            if (req.getStartTime() == null || req.getStartTime().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("startTime is required"));
            }

            int duration = (req.getDurationMinutes() != null && req.getDurationMinutes() > 0)
                    ? req.getDurationMinutes()
                    : 60;

            LocalDateTime start;
            try {
                start = LocalDateTime.parse(req.getStartTime());
            } catch (DateTimeParseException e) {
                return ResponseEntity.badRequest().body(ApiResponse.error("startTime must be ISO LocalDateTime, e.g. 2026-02-24T18:30"));
            }

            LocalDateTime end = start.plusMinutes(duration);

            Cafe cafe = cafeRepository.findById(req.getCafeId())
                    .orElseThrow(() -> new RuntimeException("Cafe not found"));

            User customer = userRepository.findById(req.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            TableType tableType = null;
            if (req.getTableTypeId() != null) {
                Optional<TableType> typeOpt = tableTypeRepository.findById(req.getTableTypeId());
                if (typeOpt.isPresent()) {
                    if (typeOpt.get().getCafe() != null && !typeOpt.get().getCafe().getId().equals(cafe.getId())) {
                        return ResponseEntity.badRequest().body(ApiResponse.error("Selected table type does not belong to this cafe"));
                    }
                    tableType = typeOpt.get();
                    
                    // Check availability
                    if (tableType.getAvailableTables() < 1) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body(ApiResponse.error("No tables of this type available"));
                    }
                    
                    // Decrease available tables
                    tableType.decreaseAvailableTables(1);
                    tableTypeRepository.save(tableType);
                }
            }

            Booking booking = new Booking();
            booking.setCafe(cafe);
            booking.setCustomer(customer);
            booking.setTableType(tableType);
            booking.setStartTime(start);
            booking.setEndTime(end);
            booking.setReservedUntil(end);
            booking.setStatus(BookingStatus.REQUESTED);
            booking.setNotes(req.getNotes());
            booking.setCustomerName(customer.getName());
            booking.setQuantity(1);

            Booking saved = bookingRepository.save(booking);

            logActivity(cafe, "BOOKING_REQUESTED",
                    "New booking request from " + customer.getName() + " for " + start.toString());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Booking requested", toDto(saved)));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to request booking: " + e.getMessage()));
        }
    }

    /**
     * GET /api/bookings/owner - List bookings for owner's cafe.
     */
    @GetMapping("/owner")
    public ResponseEntity<ApiResponse<List<BookingDto>>> getOwnerBookings(@RequestParam(required = false) Long ownerId) {
        try {
            Long userId = ownerId != null ? ownerId : 1L;
            Cafe cafe = cafeRepository.findByOwnerId(userId)
                    .orElseThrow(() -> new RuntimeException("No cafe found for this owner"));

            List<BookingDto> list = bookingRepository.findByCafeIdOrderByCreatedAtDesc(cafe.getId())
                    .stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.success("Bookings retrieved", list));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve bookings: " + e.getMessage()));
        }
    }

    /**
     * GET /api/bookings/customer - List bookings for a customer.
     */
    @GetMapping("/customer")
    public ResponseEntity<ApiResponse<List<BookingDto>>> getCustomerBookings(@RequestParam Long customerId) {
        try {
            List<BookingDto> list = bookingRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                    .stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.success("Bookings retrieved", list));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to retrieve bookings: " + e.getMessage()));
        }
    }

    /**
     * POST /api/bookings/{id}/accept - Owner accepts a request, assigns a table number.
     */
    @PostMapping("/{bookingId}/accept")
    @Transactional
    public ResponseEntity<ApiResponse<BookingDto>> acceptBooking(
            @PathVariable Long bookingId,
            @RequestParam(required = false) Long ownerId) {
        try {
            Long userId = ownerId != null ? ownerId : 1L;
            Cafe cafe = cafeRepository.findByOwnerId(userId)
                    .orElseThrow(() -> new RuntimeException("No cafe found for this owner"));

            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));

            if (!booking.getCafe().getId().equals(cafe.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("This booking does not belong to your cafe"));
            }

            if (booking.getStatus() != BookingStatus.REQUESTED) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Only REQUESTED bookings can be accepted"));
            }

            Integer tableNumber = findAvailableTableNumber(cafe.getId(), booking.getStartTime(), booking.getReservedUntil(),
                    cafe.getTotalTables() != null ? cafe.getTotalTables() : 0);

            if (tableNumber == null) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("No tables available for the selected time"));
            }

            booking.setStatus(BookingStatus.ACCEPTED);
            booking.setAcceptedAt(LocalDateTime.now());
            booking.setTableNumber(tableNumber);
            Booking saved = bookingRepository.save(booking);

            logActivity(cafe, "BOOKING_ACCEPTED",
                    "Booking accepted for " + booking.getCustomer().getName() + " (Table " + tableNumber + ")");

            return ResponseEntity.ok(ApiResponse.success("Booking accepted", toDto(saved)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to accept booking: " + e.getMessage()));
        }
    }

    /**
     * POST /api/bookings/{id}/reject
     */
    @PostMapping("/{bookingId}/reject")
    @Transactional
    public ResponseEntity<ApiResponse<BookingDto>> rejectBooking(
            @PathVariable Long bookingId,
            @RequestParam(required = false) Long ownerId) {
        try {
            Long userId = ownerId != null ? ownerId : 1L;
            Cafe cafe = cafeRepository.findByOwnerId(userId)
                    .orElseThrow(() -> new RuntimeException("No cafe found for this owner"));

            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));

            if (!booking.getCafe().getId().equals(cafe.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("This booking does not belong to your cafe"));
            }

            if (booking.getStatus() != BookingStatus.REQUESTED) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Only REQUESTED bookings can be rejected"));
            }

            // Return the tables to available pool
            if (booking.getTableType() != null) {
                TableType tableType = booking.getTableType();
                int quantity = booking.getQuantity() != null ? booking.getQuantity() : 1;
                tableType.increaseAvailableTables(quantity);
                tableTypeRepository.save(tableType);
            }

            booking.setStatus(BookingStatus.REJECTED);
            Booking saved = bookingRepository.save(booking);

            logActivity(cafe, "BOOKING_REJECTED",
                    "Booking rejected for " + booking.getCustomer().getName());

            return ResponseEntity.ok(ApiResponse.success("Booking rejected", toDto(saved)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to reject booking: " + e.getMessage()));
        }
    }

    /**
     * POST /api/bookings/{id}/complete
     */
    @PostMapping("/{bookingId}/complete")
    @Transactional
    public ResponseEntity<ApiResponse<BookingDto>> completeBooking(
            @PathVariable Long bookingId,
            @RequestParam(required = false) Long ownerId) {
        try {
            Long userId = ownerId != null ? ownerId : 1L;
            Cafe cafe = cafeRepository.findByOwnerId(userId)
                    .orElseThrow(() -> new RuntimeException("No cafe found for this owner"));

            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));

            if (!booking.getCafe().getId().equals(cafe.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("This booking does not belong to your cafe"));
            }

            if (booking.getStatus() != BookingStatus.ACCEPTED) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Only ACCEPTED bookings can be completed"));
            }

            // Return the tables to available pool
            if (booking.getTableType() != null) {
                TableType tableType = booking.getTableType();
                int quantity = booking.getQuantity() != null ? booking.getQuantity() : 1;
                tableType.increaseAvailableTables(quantity);
                tableTypeRepository.save(tableType);
            }

            LocalDateTime now = LocalDateTime.now();
            booking.setStatus(BookingStatus.COMPLETED);
            booking.setCompletedAt(now);
            booking.setReleaseAt(now.plusMinutes(5));
            booking.setReservedUntil(booking.getReleaseAt());

            Booking saved = bookingRepository.save(booking);

            logActivity(cafe, "BOOKING_COMPLETED",
                    "Booking completed for " + booking.getCustomer().getName() + " (Table " + booking.getTableNumber() + ")");

            return ResponseEntity.ok(ApiResponse.success("Booking completed", toDto(saved)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to complete booking: " + e.getMessage()));
        }
    }

    private Integer findAvailableTableNumber(Long cafeId, LocalDateTime start, LocalDateTime end, int totalTables) {
        if (totalTables <= 0) return null;

        List<Booking> overlapping = bookingRepository
                .findByCafeIdAndStatusInAndStartTimeLessThanAndReservedUntilGreaterThan(
                        cafeId,
                        Arrays.asList(BookingStatus.ACCEPTED, BookingStatus.COMPLETED, BookingStatus.OCCUPIED_WALKIN),
                        end,
                        start);

        Set<Integer> occupied = new HashSet<>();
        for (Booking b : overlapping) {
            if (b.getTableNumber() != null) occupied.add(b.getTableNumber());
        }

        for (int i = 1; i <= totalTables; i++) {
            if (!occupied.contains(i)) return i;
        }
        return null;
    }

    private BookingDto toDto(Booking booking) {
        BookingDto dto = new BookingDto();
        dto.setId(booking.getId());
        dto.setCafeId(booking.getCafe() != null ? booking.getCafe().getId() : null);
        dto.setCafeName(booking.getCafe() != null ? booking.getCafe().getCafeName() : null);
        dto.setCustomerId(booking.getCustomer() != null ? booking.getCustomer().getId() : null);
        dto.setCustomerName(booking.getCustomerName() != null ? 
            booking.getCustomerName() : 
            (booking.getCustomer() != null ? booking.getCustomer().getName() : null));
        dto.setTableTypeId(booking.getTableType() != null ? booking.getTableType().getId() : null);
        dto.setTableTypeName(booking.getTableType() != null ? booking.getTableType().getTypeName() : null);
        dto.setStartTime(booking.getStartTime() != null ? booking.getStartTime().toString() : null);
        dto.setEndTime(booking.getEndTime() != null ? booking.getEndTime().toString() : null);
        dto.setStatus(booking.getStatus() != null ? booking.getStatus().toString().toLowerCase() : null);
        dto.setTableNumber(booking.getTableNumber());
        dto.setNotes(booking.getNotes());
        dto.setCreatedAt(booking.getCreatedAt() != null ? booking.getCreatedAt().toString() : null);
        return dto;
    }

    private void logActivity(Cafe cafe, String type, String message) {
        try {
            ActivityLog log = new ActivityLog();
            log.setCafe(cafe);
            log.setType(type);
            log.setMessage(message);
            activityLogRepository.save(log);
        } catch (Exception ignored) {}
    }
}