package com.example.cafe.service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.cafe.dto.RazorpayOrderDto;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;

@Service
public class RazorpayService {

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @Value("${razorpay.currency}")
    private String currency;

    public String getRazorpayKeyId() {
        return razorpayKeyId;
    }

    private RazorpayClient getRazorpayClient() throws RazorpayException {
        return new RazorpayClient(razorpayKeyId, razorpayKeySecret);
    }

    public RazorpayOrderDto createOrder(Double amount, String receiptId, String notes) throws RazorpayException {
        // Convert rupees to paise (Razorpay expects amount in smallest currency unit)
        Integer amountInPaise = (int) (amount * 100);
        
        System.out.println("Creating Razorpay order with amount: " + amount + " INR (" + amountInPaise + " paise)");
        System.out.println("Receipt ID: " + receiptId);
        System.out.println("Currency: " + currency);

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaise);
        orderRequest.put("currency", currency);
        orderRequest.put("receipt", receiptId);
        orderRequest.put("payment_capture", 1);

        if (notes != null && !notes.isEmpty()) {
            JSONObject notesObj = new JSONObject();
            notesObj.put("notes", notes);
            orderRequest.put("notes", notesObj);
        }

        Order order = getRazorpayClient().orders.create(orderRequest);
        
        System.out.println("Razorpay order created: " + order);

        RazorpayOrderDto dto = new RazorpayOrderDto();
        dto.setId(order.get("id"));
        dto.setEntity(order.get("entity"));
        dto.setAmount(order.get("amount"));
        dto.setAmountPaid(order.get("amount_paid"));
        dto.setAmountDue(order.get("amount_due"));
        dto.setCurrency(order.get("currency"));
        dto.setReceipt(order.get("receipt"));
        dto.setStatus(order.get("status"));
        dto.setAttempts(order.get("attempts"));

        // Razorpay returns created_at as a Date object; convert safely to epoch milliseconds
        Object createdAt = order.get("created_at");
        if (createdAt instanceof java.util.Date) {
            dto.setCreatedAt(((java.util.Date) createdAt).getTime());
        } else if (createdAt instanceof Long) {
            dto.setCreatedAt((Long) createdAt);
        } else if (createdAt instanceof Integer) {
            dto.setCreatedAt(((Integer) createdAt).longValue());
        } else if (createdAt != null) {
            dto.setCreatedAt(Long.parseLong(createdAt.toString()));
        }

        return dto;
    }

    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        try {
            System.out.println("Verifying payment signature - Order ID: " + orderId + ", Payment ID: " + paymentId);
            
            // Razorpay expects: HMAC-SHA256(orderId + "|" + paymentId, secret) encoded as lowercase hex
            String payload = orderId + "|" + paymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(razorpayKeySecret.getBytes("UTF-8"), "HmacSHA256");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(payload.getBytes("UTF-8"));
            
            // Convert bytes to lowercase hex string (NOT Base64)
            StringBuilder hexSignature = new StringBuilder();
            for (byte b : hash) {
                hexSignature.append(String.format("%02x", b));
            }
            String calculatedSignature = hexSignature.toString();
            
            boolean isValid = calculatedSignature.equals(signature);
            System.out.println("Calculated: " + calculatedSignature);
            System.out.println("Received:   " + signature);
            System.out.println("Signature verification result: " + isValid);
            
            return isValid;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean verifyPaymentSignatureUsingUtils(String orderId, String paymentId, String signature) {
        try {
            return Utils.verifyPaymentSignature(
                new JSONObject()
                    .put("razorpay_order_id", orderId)
                    .put("razorpay_payment_id", paymentId)
                    .put("razorpay_signature", signature),
                razorpayKeySecret
            );
        } catch (RazorpayException e) {
            e.printStackTrace();
            return false;
        }
    }
}