package com.example.cafe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.cafe.entity.Booking;
import com.example.cafe.entity.TableType;

@Repository
public interface TableTypeRepository extends JpaRepository<TableType, Long> {
    
    List<TableType> findByCafeId(Long cafeId);
    
    Optional<TableType> findByCafeIdAndId(Long cafeId, Long tableTypeId);
    
    @Query("SELECT t FROM TableType t WHERE t.cafe.id = :cafeId AND t.isActive = true")
    List<TableType> findActiveByCafeId(@Param("cafeId") Long cafeId);
    
    @Query("SELECT t FROM TableType t LEFT JOIN FETCH t.bookings b WHERE t.cafe.id = :cafeId AND (b.status IN :statuses OR b IS NULL)")
    List<TableType> findByCafeIdWithActiveBookings(@Param("cafeId") Long cafeId, @Param("statuses") List<Booking.BookingStatus> statuses);
    
    @Query("SELECT SUM(t.tableCount) FROM TableType t WHERE t.cafe.id = :cafeId")
    Integer getTotalTablesByCafeId(@Param("cafeId") Long cafeId);
    
    @Query("SELECT SUM(t.availableTables) FROM TableType t WHERE t.cafe.id = :cafeId")
    Integer getTotalAvailableTablesByCafeId(@Param("cafeId") Long cafeId);
}