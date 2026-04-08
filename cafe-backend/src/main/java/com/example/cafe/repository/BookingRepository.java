package com.example.cafe.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.cafe.entity.Booking;
import com.example.cafe.entity.Booking.BookingStatus;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByCafeIdOrderByCreatedAtDesc(Long cafeId);

    List<Booking> findByCafeIdAndStatusOrderByCreatedAtDesc(Long cafeId, BookingStatus status);
    
    List<Booking> findByCafeIdAndStatus(Long cafeId, BookingStatus status); // Add this line

    List<Booking> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    @Query("SELECT b FROM Booking b WHERE b.cafe.id = :cafeId AND b.status IN :statuses " +
           "AND b.startTime < :endTime AND b.reservedUntil > :startTime")
    List<Booking> findByCafeIdAndStatusInAndStartTimeLessThanAndReservedUntilGreaterThan(
            @Param("cafeId") Long cafeId,
            @Param("statuses") List<BookingStatus> statuses,
            @Param("endTime") LocalDateTime endTime,
            @Param("startTime") LocalDateTime startTime);
    
    @Query("SELECT b FROM Booking b WHERE b.cafe.id = :cafeId AND b.tableType.id = :tableTypeId " +
           "AND b.status IN :statuses AND b.startTime < :endTime AND b.reservedUntil > :startTime")
    List<Booking> findOverlappingBookingsForTableType(
            @Param("cafeId") Long cafeId,
            @Param("tableTypeId") Long tableTypeId,
            @Param("statuses") List<BookingStatus> statuses,
            @Param("endTime") LocalDateTime endTime,
            @Param("startTime") LocalDateTime startTime);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.cafe.id = :cafeId AND b.status IN :statuses " +
           "AND b.startTime < :endTime AND b.reservedUntil > :startTime")
    long countActiveBookings(
            @Param("cafeId") Long cafeId,
            @Param("statuses") List<BookingStatus> statuses,
            @Param("endTime") LocalDateTime endTime,
            @Param("startTime") LocalDateTime startTime);
    
    @Query("SELECT b FROM Booking b WHERE b.cafe.id = :cafeId AND b.status = :status " +
           "AND b.tableNumber IS NOT NULL ORDER BY b.tableNumber")
    List<Booking> findByCafeIdAndStatusWithTableNumber(
            @Param("cafeId") Long cafeId,
            @Param("status") BookingStatus status);
    
    @Query("SELECT b FROM Booking b WHERE b.customerPhone = :phone AND b.startTime > :now ORDER BY b.startTime DESC")
    List<Booking> findByCustomerPhoneAndFutureBookings(
            @Param("phone") String phone,
            @Param("now") LocalDateTime now);
}