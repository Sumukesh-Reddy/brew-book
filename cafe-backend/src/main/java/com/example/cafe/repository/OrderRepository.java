// OrderRepository.java
package com.example.cafe.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.cafe.entity.Order;
import com.example.cafe.entity.Order.OrderStatus;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    List<Order> findByCafeId(Long cafeId);
    
    List<Order> findByCafeIdOrderByCreatedAtDesc(Long cafeId);
    
    List<Order> findByCafeIdAndStatusIn(Long cafeId, List<OrderStatus> statuses);
    
    List<Order> findByBookingId(Long bookingId);
    
    @Query("SELECT o FROM Order o WHERE o.cafe.id = :cafeId AND o.status IN :statuses ORDER BY o.createdAt DESC")
    List<Order> findActiveOrders(@Param("cafeId") Long cafeId, @Param("statuses") List<OrderStatus> statuses);
    
    @Query("SELECT o FROM Order o WHERE o.cafe.id = :cafeId AND o.tableNumber = :tableNumber AND o.status NOT IN ('SERVED', 'CANCELLED')")
    List<Order> findActiveOrdersForTable(@Param("cafeId") Long cafeId, @Param("tableNumber") Integer tableNumber);
    
    @Query("SELECT o FROM Order o WHERE o.cafe.id = :cafeId AND o.status = :status AND DATE(o.createdAt) = CURRENT_DATE")
    List<Order> findByStatusAndToday(@Param("cafeId") Long cafeId, @Param("status") OrderStatus status);
    
    @Query("SELECT o FROM Order o WHERE o.cafe.id = :cafeId AND o.createdAt BETWEEN :startDate AND :endDate")
    List<Order> findByDateRange(@Param("cafeId") Long cafeId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}