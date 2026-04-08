// OrderController.java
package com.example.cafe.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.cafe.dto.ApiResponse;
import com.example.cafe.dto.OrderDto;
import com.example.cafe.dto.OrderItemDto;
import com.example.cafe.dto.OrderRequestDto;
import com.example.cafe.entity.ActivityLog;
import com.example.cafe.entity.Booking;
import com.example.cafe.entity.Cafe;
import com.example.cafe.entity.MenuItem;
import com.example.cafe.entity.Order;
import com.example.cafe.entity.Order.OrderStatus;
import com.example.cafe.entity.Order.OrderType;
import com.example.cafe.entity.TableType;
import com.example.cafe.entity.User;
import com.example.cafe.repository.ActivityLogRepository;
import com.example.cafe.repository.BookingRepository;
import com.example.cafe.repository.CafeRepository;
import com.example.cafe.repository.MenuItemRepository;
import com.example.cafe.repository.OrderRepository;
import com.example.cafe.repository.UserRepository;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "http://localhost:3000")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private CafeRepository cafeRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private MenuItemRepository menuItemRepository;
    
    @Autowired
    private ActivityLogRepository activityLogRepository;

    /**
     * POST /api/orders/create - Waiter creates an order for a table
     */
    @PostMapping("/create")
    @Transactional
    public ResponseEntity<ApiResponse<OrderDto>> createOrder(@RequestBody OrderRequestDto request) {
        try {
            // Validate required fields
            if (request.getCafeId() == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Cafe ID is required"));
            }
            
            if (request.getTableNumber() == null && request.getBookingId() == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Either table number or booking ID is required"));
            }
            
            if (request.getItems() == null || request.getItems().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("At least one item is required"));
            }

            Cafe cafe = cafeRepository.findById(request.getCafeId())
                    .orElseThrow(() -> new RuntimeException("Cafe not found"));
            
            User waiter = null;
            if (request.getWaiterId() != null) {
                waiter = userRepository.findById(request.getWaiterId()).orElse(null);
            }
            
            Booking booking = null;
            if (request.getBookingId() != null) {
                booking = bookingRepository.findById(request.getBookingId()).orElse(null);
            }
            
            TableType tableType = null;
            if (request.getTableTypeId() != null) {
                tableType = cafe.getTableTypes().stream()
                    .filter(tt -> tt.getId().equals(request.getTableTypeId()))
                    .findFirst()
                    .orElse(null);
            }
            
            // Create order
            Order order = new Order();
            order.setCafe(cafe);
            order.setBooking(booking);
            order.setTableType(tableType);
            order.setTableNumber(request.getTableNumber());
            order.setCustomerName(request.getCustomerName());
            order.setCustomerPhone(request.getCustomerPhone());
            order.setSpecialInstructions(request.getSpecialInstructions());
            order.setOrderType(request.getOrderType() != null ? 
                OrderType.valueOf(request.getOrderType()) : OrderType.DINE_IN);
            order.setStatus(OrderStatus.WAITING);
            
            // Add items
            double subtotal = 0;
            for (OrderItemDto itemDto : request.getItems()) {
                MenuItem menuItem = menuItemRepository.findById(itemDto.getMenuItemId())
                    .orElseThrow(() -> new RuntimeException("Menu item not found: " + itemDto.getMenuItemId()));
                
                com.example.cafe.entity.OrderItem item = new com.example.cafe.entity.OrderItem();
                item.setMenuItem(menuItem);
                item.setItemName(menuItem.getName());
                item.setQuantity(itemDto.getQuantity());
                item.setPrice(menuItem.getPrice());
                item.setSpecialRequest(itemDto.getSpecialRequest());
                
                order.addItem(item);
                subtotal += menuItem.getPrice() * itemDto.getQuantity();
            }
            
            order.setSubtotal(subtotal);
            order.setTaxAmount(subtotal * 0.05);
            order.setTotalAmount(subtotal + (subtotal * 0.05));
            
            Order saved = orderRepository.save(order);
            
            // Log activity
            logActivity(cafe, "ORDER_CREATED", 
                "New order created for Table #" + request.getTableNumber() + 
                " by " + (waiter != null ? waiter.getName() : "waiter"));
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created successfully", toDto(saved)));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to create order: " + e.getMessage()));
        }
    }

    /**
     * GET /api/orders/chef/{cafeId} - Chef views waiting and preparing orders
     */
    @GetMapping("/chef/{cafeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getChefOrders(@PathVariable Long cafeId) {
        try {
            Cafe cafe = cafeRepository.findById(cafeId)
                    .orElseThrow(() -> new RuntimeException("Cafe not found"));
            
            List<Order> waitingOrders = orderRepository.findByCafeIdAndStatusIn(cafeId, 
                List.of(OrderStatus.WAITING));
            
            List<Order> preparingOrders = orderRepository.findByCafeIdAndStatusIn(cafeId, 
                List.of(OrderStatus.PREPARING));
            
            List<Order> readyOrders = orderRepository.findByCafeIdAndStatusIn(cafeId, 
                List.of(OrderStatus.READY));
            
            Map<String, Object> response = new HashMap<>();
            response.put("waiting", waitingOrders.stream().map(this::toDto).collect(Collectors.toList()));
            response.put("preparing", preparingOrders.stream().map(this::toDto).collect(Collectors.toList()));
            response.put("ready", readyOrders.stream().map(this::toDto).collect(Collectors.toList()));
            
            return ResponseEntity.ok(ApiResponse.success("Chef orders retrieved", response));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to get chef orders: " + e.getMessage()));
        }
    }

    /**
     * GET /api/orders/waiter/{cafeId} - Waiter views active orders
     */
    @GetMapping("/waiter/{cafeId}")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getWaiterOrders(@PathVariable Long cafeId) {
        try {
            List<Order> activeOrders = orderRepository.findActiveOrders(cafeId, 
                List.of(OrderStatus.WAITING, OrderStatus.PREPARING, OrderStatus.READY));
            
            List<OrderDto> dtos = activeOrders.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(ApiResponse.success("Waiter orders retrieved", dtos));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to get waiter orders: " + e.getMessage()));
        }
    }

    /**
     * GET /api/orders/table/{cafeId}/{tableNumber} - Get orders for a specific table
     */
    @GetMapping("/table/{cafeId}/{tableNumber}")
    public ResponseEntity<ApiResponse<List<OrderDto>>> getTableOrders(
            @PathVariable Long cafeId,
            @PathVariable Integer tableNumber) {
        try {
            List<Order> orders = orderRepository.findActiveOrdersForTable(cafeId, tableNumber);
            
            List<OrderDto> dtos = orders.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(ApiResponse.success("Table orders retrieved", dtos));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to get table orders: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/orders/{orderId}/accept - Chef accepts an order
     */
    @PutMapping("/{orderId}/accept")
    @Transactional
    public ResponseEntity<ApiResponse<OrderDto>> acceptOrder(
            @PathVariable Long orderId,
            @RequestParam(required = false) Long chefId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            
            if (order.getStatus() != OrderStatus.WAITING) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only waiting orders can be accepted"));
            }
            
            order.setStatus(OrderStatus.PREPARING);
            order.setAcceptedAt(LocalDateTime.now());
            
            Order saved = orderRepository.save(order);
            
            logActivity(order.getCafe(), "ORDER_ACCEPTED", 
                "Chef accepted order #" + orderId + " for Table #" + order.getTableNumber());
            
            return ResponseEntity.ok(ApiResponse.success("Order accepted", toDto(saved)));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to accept order: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/orders/{orderId}/ready - Chef marks order as ready
     */
    @PutMapping("/{orderId}/ready")
    @Transactional
    public ResponseEntity<ApiResponse<OrderDto>> markOrderReady(
            @PathVariable Long orderId,
            @RequestParam(required = false) Long chefId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            
            if (order.getStatus() != OrderStatus.PREPARING) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only preparing orders can be marked ready"));
            }
            
            order.setStatus(OrderStatus.READY);
            order.setReadyAt(LocalDateTime.now());
            
            Order saved = orderRepository.save(order);
            
            logActivity(order.getCafe(), "ORDER_READY", 
                "Order #" + orderId + " is ready for Table #" + order.getTableNumber());
            
            return ResponseEntity.ok(ApiResponse.success("Order marked ready", toDto(saved)));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to mark order ready: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/orders/{orderId}/serve - Waiter serves order to customer
     */
    @PutMapping("/{orderId}/serve")
    @Transactional
    public ResponseEntity<ApiResponse<OrderDto>> serveOrder(
            @PathVariable Long orderId,
            @RequestParam(required = false) Long waiterId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            
            if (order.getStatus() != OrderStatus.READY) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only ready orders can be served"));
            }
            
            order.setStatus(OrderStatus.SERVED);
            order.setServedAt(LocalDateTime.now());
            
            Order saved = orderRepository.save(order);
            
            logActivity(order.getCafe(), "ORDER_SERVED", 
                "Order #" + orderId + " served to Table #" + order.getTableNumber());
            
            return ResponseEntity.ok(ApiResponse.success("Order served", toDto(saved)));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to serve order: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/orders/{orderId}/cancel - Cancel an order
     */
    @PutMapping("/{orderId}/cancel")
    @Transactional
    public ResponseEntity<ApiResponse<OrderDto>> cancelOrder(
            @PathVariable Long orderId,
            @RequestParam(required = false) Long userId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            
            if (order.getStatus() == OrderStatus.SERVED || 
                order.getStatus() == OrderStatus.CANCELLED) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Order cannot be cancelled"));
            }
            
            order.setStatus(OrderStatus.CANCELLED);
            order.setCancelledAt(LocalDateTime.now());
            
            Order saved = orderRepository.save(order);
            
            logActivity(order.getCafe(), "ORDER_CANCELLED", 
                "Order #" + orderId + " cancelled for Table #" + order.getTableNumber());
            
            return ResponseEntity.ok(ApiResponse.success("Order cancelled", toDto(saved)));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to cancel order: " + e.getMessage()));
        }
    }

    /**
     * GET /api/orders/bill/{bookingId} - Get all served orders for billing
     */
    @GetMapping("/bill/{bookingId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBillForBooking(@PathVariable Long bookingId) {
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));
            
            List<Order> servedOrders = orderRepository.findByBookingId(bookingId).stream()
                .filter(o -> o.getStatus() == OrderStatus.SERVED)
                .collect(Collectors.toList());
            
            double subtotal = servedOrders.stream()
                .mapToDouble(Order::getSubtotal)
                .sum();
            double tax = servedOrders.stream()
                .mapToDouble(Order::getTaxAmount)
                .sum();
            double total = servedOrders.stream()
                .mapToDouble(Order::getTotalAmount)
                .sum();
            
            // Add table revenue
            double tableRevenue = 0;
            if (booking.getTableType() != null && booking.getStartTime() != null && booking.getEndTime() != null) {
                double hours = java.time.Duration.between(booking.getStartTime(), booking.getEndTime()).toMinutes() / 60.0;
                tableRevenue = booking.getTableType().getPricePerHour() * hours * (booking.getQuantity() != null ? booking.getQuantity() : 1);
            }
            
            Map<String, Object> bill = new HashMap<>();
            bill.put("bookingId", bookingId);
            bill.put("tableNumber", booking.getTableNumber());
            bill.put("customerName", booking.getCustomerName());
            bill.put("orders", servedOrders.stream().map(this::toDto).collect(Collectors.toList()));
            bill.put("foodSubtotal", subtotal);
            bill.put("foodTax", tax);
            bill.put("foodTotal", total);
            bill.put("tableRevenue", tableRevenue);
            bill.put("grandTotal", total + tableRevenue);
            
            return ResponseEntity.ok(ApiResponse.success("Bill retrieved", bill));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to get bill: " + e.getMessage()));
        }
    }

    /**
     * Helper method to convert Order to DTO
     */
    private OrderDto toDto(Order order) {
        OrderDto dto = new OrderDto();
        dto.setId(order.getId());
        dto.setCafeId(order.getCafe() != null ? order.getCafe().getId() : null);
        dto.setBookingId(order.getBooking() != null ? order.getBooking().getId() : null);
        dto.setTableNumber(order.getTableNumber());
        dto.setCustomerName(order.getCustomerName());
        dto.setCustomerPhone(order.getCustomerPhone());
        dto.setStatus(order.getStatus().toString().toLowerCase());
        dto.setOrderType(order.getOrderType().toString().toLowerCase());
        dto.setSpecialInstructions(order.getSpecialInstructions());
        dto.setSubtotal(order.getSubtotal());
        dto.setTaxAmount(order.getTaxAmount());
        dto.setTotalAmount(order.getTotalAmount());
        
        List<OrderItemDto> itemDtos = order.getItems().stream()
            .map(item -> {
                OrderItemDto itemDto = new OrderItemDto();
                itemDto.setId(item.getId());
                itemDto.setMenuItemId(item.getMenuItem() != null ? item.getMenuItem().getId() : null);
                itemDto.setItemName(item.getItemName());
                itemDto.setQuantity(item.getQuantity());
                itemDto.setPrice(item.getPrice());
                itemDto.setSpecialRequest(item.getSpecialRequest());
                return itemDto;
            })
            .collect(Collectors.toList());
        dto.setItems(itemDtos);
        
        dto.setCreatedAt(order.getCreatedAt() != null ? order.getCreatedAt().toString() : null);
        dto.setAcceptedAt(order.getAcceptedAt() != null ? order.getAcceptedAt().toString() : null);
        dto.setReadyAt(order.getReadyAt() != null ? order.getReadyAt().toString() : null);
        dto.setServedAt(order.getServedAt() != null ? order.getServedAt().toString() : null);
        
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
}
