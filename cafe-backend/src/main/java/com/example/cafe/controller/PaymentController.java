package com.example.cafe.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import org.springframework.web.bind.annotation.RestController;

import com.example.cafe.dto.ApiResponse;
import com.example.cafe.dto.RazorpayOrderDto;
import com.example.cafe.dto.RazorpayPaymentRequest;
import com.example.cafe.entity.Booking;
import com.example.cafe.entity.Cafe;
import com.example.cafe.entity.Order;
import com.example.cafe.entity.Order.OrderStatus;
import com.example.cafe.entity.TableType;
import com.example.cafe.entity.Transaction;
import com.example.cafe.repository.BookingRepository;
import com.example.cafe.repository.CafeRepository;
import com.example.cafe.repository.OrderRepository;
import com.example.cafe.repository.TableTypeRepository;
import com.example.cafe.repository.TransactionRepository;
import com.example.cafe.service.RazorpayService;
import com.razorpay.RazorpayException;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "http://localhost:3000")
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private RazorpayService razorpayService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private TableTypeRepository tableTypeRepository;
    
    @Autowired
    private TransactionRepository transactionRepository;

    /**
     * POST /api/payments/create-order - Create Razorpay order for a booking
     */
    @PostMapping("/create-order")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createPaymentOrder(@RequestBody Map<String, Object> request) {
        logger.info("========== CREATE PAYMENT ORDER REQUEST ==========");
        logger.info("Received request to create payment order: {}", request);
        
        try {
            // Log all keys in the request
            logger.info("Request keys: {}", request.keySet());
            
            // Validate request
            if (request == null) {
                logger.error("Request is null");
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Request body is required"));
            }
            
            if (!request.containsKey("bookingId")) {
                logger.error("Request missing bookingId key. Available keys: {}", request.keySet());
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Booking ID is required"));
            }

            // Get the bookingId object
            Object bookingIdObj = request.get("bookingId");
            logger.info("bookingId object type: {}", bookingIdObj != null ? bookingIdObj.getClass().getName() : "null");
            logger.info("bookingId object value: {}", bookingIdObj);
            
            Long bookingId;
            
            if (bookingIdObj == null) {
                logger.error("bookingId is null");
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Booking ID cannot be null"));
            }
            
            // Handle different types of bookingId
            if (bookingIdObj instanceof Number) {
                bookingId = ((Number) bookingIdObj).longValue();
                logger.info("bookingId is Number type, converted to: {}", bookingId);
            }
            else if (bookingIdObj instanceof String) {
                try {
                    bookingId = Long.parseLong((String) bookingIdObj);
                    logger.info("bookingId is String type, parsed to: {}", bookingId);
                } catch (NumberFormatException e) {
                    logger.error("Invalid booking ID string format: {}", bookingIdObj);
                    return ResponseEntity.badRequest()
                            .body(ApiResponse.error("Invalid booking ID format: not a valid number"));
                }
            }
            else {
                logger.error("Unexpected type for bookingId: {}", bookingIdObj.getClass().getName());
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Invalid booking ID type: " + bookingIdObj.getClass().getSimpleName()));
            }

            logger.info("Creating payment order for booking ID: {}", bookingId);
            
            // Find the booking
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

            logger.info("Found booking: {}", booking.getId());
            logger.info("Booking details - Table: {}, Customer: {}", 
                booking.getTableNumber(), booking.getCustomerName());

            // Calculate total amount from served orders
            List<Order> servedOrders = orderRepository.findByBookingId(bookingId).stream()
                    .filter(o -> o.getStatus() == OrderStatus.SERVED)
                    .toList();

            logger.info("Found {} served orders for booking", servedOrders.size());
            
            // Log each served order
            servedOrders.forEach(order -> {
                logger.info("Order {}: Total amount: {}", order.getId(), order.getTotalAmount());
            });

            double foodSubtotal = servedOrders.stream()
                    .mapToDouble(Order::getSubtotal)
                    .sum();
            double foodTax = servedOrders.stream()
                    .mapToDouble(Order::getTaxAmount)
                    .sum();
            double foodTotal = servedOrders.stream()
                    .mapToDouble(Order::getTotalAmount)
                    .sum();

            logger.info("Food totals - Subtotal: {}, Tax: {}, Total: {}", foodSubtotal, foodTax, foodTotal);

            double tableRevenue = 0;
            if (booking.getTableType() != null && booking.getStartTime() != null && booking.getEndTime() != null) {
                double hours = java.time.Duration.between(booking.getStartTime(), booking.getEndTime()).toMinutes() / 60.0;
                tableRevenue = booking.getTableType().getPricePerHour() * hours * 
                              (booking.getQuantity() != null ? booking.getQuantity() : 1);
                logger.info("Table revenue: {}, hours: {}, price per hour: {}", 
                    tableRevenue, hours, booking.getTableType().getPricePerHour());
            } else {
                logger.info("No table revenue calculated - tableType: {}, startTime: {}, endTime: {}",
                    booking.getTableType() != null, booking.getStartTime() != null, booking.getEndTime() != null);
            }

            double grandTotal = foodTotal + tableRevenue;
            logger.info("Grand total calculated: {}", grandTotal);

            // Create Razorpay order
            String receiptId = "rcpt_" + bookingId + "_" + System.currentTimeMillis();
            logger.info("Creating Razorpay order with receipt: {}", receiptId);
            
            RazorpayOrderDto razorpayOrder = razorpayService.createOrder(grandTotal, receiptId, 
                "Payment for booking #" + bookingId);

            logger.info("Razorpay order created successfully: {}", razorpayOrder.getId());
            logger.info("Razorpay order details - Amount: {}, Currency: {}", 
                razorpayOrder.getAmount(), razorpayOrder.getCurrency());

            Map<String, Object> response = new HashMap<>();
            response.put("razorpayOrderId", razorpayOrder.getId());
            response.put("amount", razorpayOrder.getAmount());
            response.put("currency", razorpayOrder.getCurrency());
            response.put("receipt", razorpayOrder.getReceipt());
            response.put("bookingId", bookingId);
            response.put("grandTotal", grandTotal);
            response.put("keyId", razorpayService.getRazorpayKeyId()); 

            logger.info("Response prepared successfully");
            logger.info("========== END CREATE PAYMENT ORDER ==========");

            return ResponseEntity.ok(ApiResponse.success("Razorpay order created", response));

        } catch (NumberFormatException e) {
            logger.error("Number format exception: {}", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Invalid booking ID format: " + e.getMessage()));
        } catch (RazorpayException e) {
            logger.error("Razorpay error: {}", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Razorpay error: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("Failed to create payment order: {}", e.getMessage());
            logger.error("Exception type: {}", e.getClass().getName());
            logger.error("Stack trace:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create payment order: " + e.getMessage()));
        }
    }

    /**
     * POST /api/payments/verify - Verify payment and complete transaction
     */
    @PostMapping("/verify")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyPayment(@RequestBody RazorpayPaymentRequest request) {
        logger.info("========== VERIFY PAYMENT REQUEST ==========");
        logger.info("Verifying payment for booking: {}", request.getBookingId());
        logger.info("Payment details - Order ID: {}, Payment ID: {}", 
            request.getRazorpayOrderId(), request.getRazorpayPaymentId());
        
        try {
            // Verify payment signature
            boolean isValid = razorpayService.verifyPaymentSignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
            );

            if (!isValid) {
                logger.error("Invalid payment signature for order: {}", request.getRazorpayOrderId());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Invalid payment signature"));
            }

            logger.info("Payment signature verified successfully");

            // Get booking
            Booking booking = bookingRepository.findById(request.getBookingId())
                    .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + request.getBookingId()));

            logger.info("Found booking: {}", booking.getId());

            // Calculate total amount for verification
            List<Order> servedOrders = orderRepository.findByBookingId(request.getBookingId()).stream()
                    .filter(o -> o.getStatus() == OrderStatus.SERVED)
                    .toList();

            double foodTotal = servedOrders.stream()
                    .mapToDouble(Order::getTotalAmount)
                    .sum();

            double tableRevenue = 0;
            if (booking.getTableType() != null && booking.getStartTime() != null && booking.getEndTime() != null) {
                double hours = java.time.Duration.between(booking.getStartTime(), booking.getEndTime()).toMinutes() / 60.0;
                tableRevenue = booking.getTableType().getPricePerHour() * hours * 
                              (booking.getQuantity() != null ? booking.getQuantity() : 1);
                logger.info("Table revenue: {}, hours: {}", tableRevenue, hours);
            }

            double grandTotal = foodTotal + tableRevenue;
            logger.info("Calculated grand total: {}", grandTotal);

            // Verify amount (allow small difference due to rounding)
            if (Math.abs(grandTotal - request.getAmount()) > 0.01) {
                logger.error("Amount mismatch. Expected: {}, Got: {}", grandTotal, request.getAmount());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Amount mismatch. Expected: " + grandTotal + ", Got: " + request.getAmount()));
            }

            logger.info("Amount verification passed");

            // Add revenue to cafe
            Cafe cafe = booking.getCafe();
            cafe.addRevenue(grandTotal);
            cafeRepository.save(cafe);
            logger.info("Added revenue {} to cafe {}", grandTotal, cafe.getId());

            // Increase available tables back
            if (booking.getTableType() != null) {
                TableType tableType = booking.getTableType();
                int quantity = booking.getQuantity() != null ? booking.getQuantity() : 1;
                tableType.increaseAvailableTables(quantity);
                tableTypeRepository.save(tableType);
                logger.info("Released {} tables of type {}", quantity, tableType.getId());
            }

            // Update booking status
            booking.setStatus(Booking.BookingStatus.COMPLETED);
            booking.setCompletedAt(LocalDateTime.now());
            booking.setReleaseAt(LocalDateTime.now().plusMinutes(5));
            booking.setReservedUntil(booking.getReleaseAt());
            bookingRepository.save(booking);
            logger.info("Booking {} completed successfully", booking.getId());

            // Save transaction record
            Transaction transaction = new Transaction();
            transaction.setBookingId(booking.getId());
            transaction.setAmount(grandTotal);
            transaction.setPaymentMethod("RAZORPAY");
            transaction.setTransactionId(request.getRazorpayPaymentId());
            transaction.setStatus("SUCCESS");
            transaction.setPaymentDate(LocalDateTime.now());
            transactionRepository.save(transaction);

            Map<String, Object> response = new HashMap<>();
            response.put("bookingId", booking.getId());
            response.put("paymentId", request.getRazorpayPaymentId());
            response.put("orderId", request.getRazorpayOrderId());
            response.put("amount", grandTotal);
            response.put("message", "Payment successful");

            logger.info("Payment verification completed successfully");
            logger.info("========== END VERIFY PAYMENT ==========");

            return ResponseEntity.ok(ApiResponse.success("Payment verified and completed", response));

        } catch (Exception e) {
            logger.error("Failed to verify payment: {}", e.getMessage());
            logger.error("Exception type: {}", e.getClass().getName());
            logger.error("Stack trace:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to verify payment: " + e.getMessage()));
        }
    }

    /**
     * POST /api/payments/verify-upi - Verify UPI payment and complete transaction
     */
    @PostMapping("/verify-upi")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyUPIPayment(@RequestBody Map<String, Object> request) {
        logger.info("========== VERIFY UPI PAYMENT ==========");
        
        try {
            Long bookingId = Long.parseLong(request.get("bookingId").toString());
            Double amount = Double.parseDouble(request.get("amount").toString());
            String upiTransactionId = (String) request.get("upiTransactionId");
            String upiApp = (String) request.get("upiApp");
            String status = (String) request.get("status");

            // Get booking
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

            // Verify amount matches
            List<Order> servedOrders = orderRepository.findByBookingId(bookingId).stream()
                    .filter(o -> o.getStatus() == Order.OrderStatus.SERVED)
                    .toList();

            double foodTotal = servedOrders.stream()
                    .mapToDouble(Order::getTotalAmount)
                    .sum();

            double tableRevenue = 0;
            if (booking.getTableType() != null && booking.getStartTime() != null && booking.getEndTime() != null) {
                double hours = java.time.Duration.between(booking.getStartTime(), booking.getEndTime()).toMinutes() / 60.0;
                tableRevenue = booking.getTableType().getPricePerHour() * hours * 
                              (booking.getQuantity() != null ? booking.getQuantity() : 1);
            }

            double grandTotal = foodTotal + tableRevenue;

            if (Math.abs(grandTotal - amount) > 0.01) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Amount mismatch"));
            }

            // Add revenue to cafe
            Cafe cafe = booking.getCafe();
            cafe.addRevenue(grandTotal);
            cafeRepository.save(cafe);

            // Increase available tables back
            if (booking.getTableType() != null) {
                TableType tableType = booking.getTableType();
                int quantity = booking.getQuantity() != null ? booking.getQuantity() : 1;
                tableType.increaseAvailableTables(quantity);
                tableTypeRepository.save(tableType);
            }

            // Update booking status
            booking.setStatus(Booking.BookingStatus.COMPLETED);
            booking.setCompletedAt(LocalDateTime.now());
            booking.setReleaseAt(LocalDateTime.now().plusMinutes(5));
            booking.setReservedUntil(booking.getReleaseAt());
            bookingRepository.save(booking);

            // Save transaction record
            Transaction transaction = new Transaction();
            transaction.setBookingId(bookingId);
            transaction.setAmount(grandTotal);
            transaction.setPaymentMethod("UPI");
            transaction.setUpiApp(upiApp);
            transaction.setTransactionId(upiTransactionId);
            transaction.setStatus("SUCCESS");
            transaction.setPaymentDate(LocalDateTime.now());
            transactionRepository.save(transaction);

            Map<String, Object> response = new HashMap<>();
            response.put("bookingId", booking.getId());
            response.put("paymentId", upiTransactionId);
            response.put("amount", grandTotal);
            response.put("message", "UPI payment successful");

            return ResponseEntity.ok(ApiResponse.success("Payment verified and completed", response));

        } catch (Exception e) {
            logger.error("Failed to verify UPI payment: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to verify payment: " + e.getMessage()));
        }
    }

    /**
     * GET /api/payments/payment-history/{bookingId} - Get payment history for a booking
     */
    @GetMapping("/payment-history/{bookingId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPaymentHistory(@PathVariable Long bookingId) {
        logger.info("Fetching payment history for booking: {}", bookingId);
        
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

            List<Order> servedOrders = orderRepository.findByBookingId(bookingId).stream()
                    .filter(o -> o.getStatus() == OrderStatus.SERVED)
                    .toList();

            double foodTotal = servedOrders.stream()
                    .mapToDouble(Order::getTotalAmount)
                    .sum();

            double tableRevenue = 0;
            if (booking.getTableType() != null && booking.getStartTime() != null && booking.getEndTime() != null) {
                double hours = java.time.Duration.between(booking.getStartTime(), booking.getEndTime()).toMinutes() / 60.0;
                tableRevenue = booking.getTableType().getPricePerHour() * hours * 
                              (booking.getQuantity() != null ? booking.getQuantity() : 1);
            }

            Map<String, Object> paymentInfo = new HashMap<>();
            paymentInfo.put("bookingId", bookingId);
            paymentInfo.put("status", booking.getStatus() != null ? booking.getStatus().toString() : null);
            paymentInfo.put("foodTotal", foodTotal);
            paymentInfo.put("tableRevenue", tableRevenue);
            paymentInfo.put("grandTotal", foodTotal + tableRevenue);
            paymentInfo.put("completedAt", booking.getCompletedAt());

            return ResponseEntity.ok(ApiResponse.success("Payment history retrieved", paymentInfo));

        } catch (Exception e) {
            logger.error("Failed to get payment history: {}", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to get payment history: " + e.getMessage()));
        }
    }

    /**
     * GET /api/payments/test - Test endpoint to check configuration
     */
    @GetMapping("/test")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testRazorpayConfig() {
        Map<String, Object> response = new HashMap<>();
        try {
            String keyId = razorpayService.getRazorpayKeyId();
            response.put("keyId", keyId != null ? "Configured" : "Not configured");
            response.put("keyIdValue", keyId);
            response.put("status", "Razorpay service is working");
            
            logger.info("Test endpoint called successfully");
            
            return ResponseEntity.ok(ApiResponse.success("Razorpay configuration test successful", response));
        } catch (Exception e) {
            logger.error("Test endpoint failed: {}", e.getMessage());
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Razorpay test failed: " + e.getMessage()));
        }
    }

    /**
     * POST /api/payments/debug - Debug endpoint to check request structure
     */
    @PostMapping("/debug")
    public ResponseEntity<ApiResponse<Map<String, Object>>> debugRequest(@RequestBody Map<String, Object> request) {
        logger.info("Debug endpoint called with request: {}", request);
        
        Map<String, Object> debug = new HashMap<>();
        
        for (Map.Entry<String, Object> entry : request.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            debug.put(key + "_type", value != null ? value.getClass().getName() : "null");
            debug.put(key + "_value", String.valueOf(value));
        }
        
        logger.info("Debug info: {}", debug);
        
        return ResponseEntity.ok(ApiResponse.success("Debug info", debug));
    }
}