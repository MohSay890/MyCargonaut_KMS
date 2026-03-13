package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.model.*;
import com.mycargonaut.backend.repository.CargonautRepository;
import com.mycargonaut.backend.repository.FahrtRepository;
import com.mycargonaut.backend.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {
    
    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private FahrtRepository fahrtRepository;
    
    @Autowired
    private CargonautRepository cargonautRepository;
    
    /**
     * Create a new payment
     * POST /api/payments
     */
    @PostMapping
    public ResponseEntity<?> createPayment(@RequestBody CreatePaymentRequest request) {
        try {
            Fahrt fahrt = fahrtRepository.findById(request.getFahrtId())
                .orElseThrow(() -> new RuntimeException("Fahrt not found"));
            
            Cargonaut payer = cargonautRepository.findById(request.getPayerId())
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            Payment payment = paymentService.createPayment(
                fahrt,
                payer,
                request.getAmount(),
                request.getCurrency(),
                request.getPaymentMethod()
            );
            
            return ResponseEntity.ok(toPaymentResponse(payment));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Process a payment
     * POST /api/payments/{id}/process
     */
    @PostMapping("/{id}/process")
    public ResponseEntity<?> processPayment(@PathVariable Long id) {
        try {
            Payment payment = paymentService.processPayment(id);
            return ResponseEntity.ok(toPaymentResponse(payment));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get payment by ID
     * GET /api/payments/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPayment(@PathVariable Long id) {
        return paymentService.getPaymentById(id)
            .map(payment -> ResponseEntity.ok(toPaymentResponse(payment)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get payments by user
     * GET /api/payments/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getPaymentsByUser(@PathVariable Long userId) {
        List<Payment> payments = paymentService.getPaymentsByUser(userId);
        return ResponseEntity.ok(payments.stream()
            .map(this::toPaymentResponse)
            .toList());
    }
    
    /**
     * Get payments by trip
     * GET /api/payments/fahrt/{fahrtId}
     */
    @GetMapping("/fahrt/{fahrtId}")
    public ResponseEntity<List<Map<String, Object>>> getPaymentsByFahrt(@PathVariable Long fahrtId) {
        List<Payment> payments = paymentService.getPaymentsByFahrt(fahrtId);
        return ResponseEntity.ok(payments.stream()
            .map(this::toPaymentResponse)
            .toList());
    }
    
    /**
     * Refund a payment (escrow refund)
     * POST /api/payments/{id}/refund
     */
    @PostMapping("/{id}/refund")
    public ResponseEntity<?> refundPayment(@PathVariable Long id, @RequestParam(required = false) String reason) {
        try {
            String refundReason = reason != null ? reason : "Manual refund requested";
            Payment payment = paymentService.refundEscrow(id, refundReason);
            return ResponseEntity.ok(toPaymentResponse(payment));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Release escrow after trip completion
     * POST /api/payments/{id}/release-escrow
     */
    @PostMapping("/{id}/release-escrow")
    public ResponseEntity<?> releaseEscrow(@PathVariable Long id) {
        try {
            Payment payment = paymentService.releaseEscrow(id);
            return ResponseEntity.ok(toPaymentResponse(payment));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get payments in escrow
     * GET /api/payments/escrow
     */
    @GetMapping("/escrow")
    public ResponseEntity<List<Map<String, Object>>> getPaymentsInEscrow() {
        List<Payment> payments = paymentService.getPaymentsInEscrow();
        return ResponseEntity.ok(payments.stream()
            .map(this::toPaymentResponse)
            .toList());
    }
    
    /**
     * Get payment history for a user (payments they made)
     * GET /api/payments/history?email=user@example.com
     */
    @GetMapping("/history")
    public ResponseEntity<?> getPaymentHistory(@RequestParam String email) {
        try {
            var user = cargonautRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            List<Payment> payments = paymentService.getPaymentsByUser(user.getId());
            return ResponseEntity.ok(payments.stream()
                .map(this::toPaymentResponse)
                .toList());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get earnings for a user (payments they received)
     * GET /api/payments/earnings?email=user@example.com
     */
    @GetMapping("/earnings")
    public ResponseEntity<?> getEarnings(@RequestParam String email) {
        try {
            var user = cargonautRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            List<Payment> receivedPayments = paymentService.getPaymentsByRecipient(user.getId());

            // Calculate total earnings (completed payments AND Escrow released)
            BigDecimal totalEarnings = receivedPayments.stream()
                    .filter(p -> p.getStatus() == PaymentStatus.COMPLETED && p.getEscrowStatus() == EscrowStatus.RELEASED)
                    .map(Payment::getRecipientAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Calculate pending payout (in Escrow)
            BigDecimal pendingPayout = receivedPayments.stream()
                    .filter(p -> p.getStatus() == PaymentStatus.COMPLETED && p.getEscrowStatus() == EscrowStatus.HELD)
                    .map(Payment::getRecipientAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Subtract refunded amounts - use recipientAmount for refunds too
            BigDecimal refundedAmount = receivedPayments.stream()
                    .filter(p -> p.getStatus() == PaymentStatus.REFUNDED)
                    .map(Payment::getRecipientAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal netEarnings = totalEarnings.subtract(refundedAmount);

            Map<String, Object> response = new HashMap<>();
            response.put("totalEarnings", totalEarnings);
            response.put("pendingPayout", pendingPayout);
            response.put("refundedAmount", refundedAmount);
            response.put("netEarnings", netEarnings);
            response.put("completedPayments", receivedPayments.stream()
                    .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                    .count());
            response.put("refundedPayments", receivedPayments.stream()
                    .filter(p -> p.getStatus() == PaymentStatus.REFUNDED)
                    .count());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    // Helper method to convert Payment to response DTO
    private Map<String, Object> toPaymentResponse(Payment payment) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", payment.getId());
        response.put("fahrtId", payment.getFahrt().getId());
        response.put("payerId", payment.getPayer().getId());
        response.put("amount", payment.getAmount());
        response.put("platformFee", payment.getPlatformFee());
        response.put("recipientAmount", payment.getRecipientAmount());
        response.put("currency", payment.getCurrency());
        response.put("paymentMethod", payment.getPaymentMethod().name());
        response.put("status", payment.getStatus().name());
        response.put("escrowStatus", payment.getEscrowStatus() != null ? payment.getEscrowStatus().name() : null);
        response.put("escrowHeldAt", payment.getEscrowHeldAt());
        response.put("escrowReleasedAt", payment.getEscrowReleasedAt());
        response.put("escrowRefundedAt", payment.getEscrowRefundedAt());
        response.put("createdAt", payment.getCreatedAt());
        response.put("processedAt", payment.getProcessedAt());
        response.put("transactionReference", payment.getTransactionReference());
        response.put("payerName", payment.getPayer().getVorname() + " " + payment.getPayer().getNachname());
        response.put("payerEmail", payment.getPayer().getEmail());
        response.put("route", payment.getFahrt().getStartOrt() + " → " + payment.getFahrt().getZielOrt());
        
        // Add recipient information
        if (payment.getRecipient() != null) {
            response.put("recipientId", payment.getRecipient().getId());
            response.put("recipientName", payment.getRecipient().getVorname() + " " + payment.getRecipient().getNachname());
            response.put("recipientEmail", payment.getRecipient().getEmail());
        }
        
        return response;
    }
    
    // Request DTO
    public static class CreatePaymentRequest {
        private Long fahrtId;
        private Long payerId;
        private BigDecimal amount;
        private String currency = "EUR";
        private PaymentMethod paymentMethod;
        
        // Getters and setters
        public Long getFahrtId() { return fahrtId; }
        public void setFahrtId(Long fahrtId) { this.fahrtId = fahrtId; }
        
        public Long getPayerId() { return payerId; }
        public void setPayerId(Long payerId) { this.payerId = payerId; }
        
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        
        public PaymentMethod getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    }
}
