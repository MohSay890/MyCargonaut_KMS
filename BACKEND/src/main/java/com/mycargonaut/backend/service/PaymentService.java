package com.mycargonaut.backend.service;

import com.mycargonaut.backend.model.*;
import com.mycargonaut.backend.repository.PaymentRepository;
import com.mycargonaut.backend.repository.CargonautRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private CargonautRepository cargonautRepository;

    @Autowired
    private TrackingService trackingService;

    private final Random random = new Random();

    /**
     * Create a new payment
     */
    @Transactional
    public Payment createPayment(Fahrt fahrt, Cargonaut payer, BigDecimal amount,
                                String currency, PaymentMethod paymentMethod) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }

        Payment payment = new Payment();
        payment.setFahrt(fahrt);
        payment.setPayer(payer);

        // Set recipient: try fahrer first, then find by erstellerEmail
        Cargonaut recipient = null;
        if (fahrt.getFahrer() != null) {
            recipient = fahrt.getFahrer();
        } else if (fahrt.getErstellerEmail() != null) {
            recipient = cargonautRepository.findByEmail(fahrt.getErstellerEmail())
                .orElseThrow(() -> new IllegalArgumentException(
                    "Journey creator not found with email: " + fahrt.getErstellerEmail()));
        } else {
            throw new IllegalArgumentException("Journey must have a driver/creator or creator email");
        }
        payment.setRecipient(recipient);

        payment.setAmount(amount);
        payment.setCurrency(currency);
        payment.setPaymentMethod(paymentMethod);
        payment.setStatus(PaymentStatus.PENDING);
        
        // Calculate platform fee (15% commission)
        BigDecimal platformFee = amount.multiply(new BigDecimal("0.15"));
        payment.setPlatformFee(platformFee);
        
        // Calculate recipient amount (amount - platform fee)
        BigDecimal recipientAmount = amount.subtract(platformFee);
        payment.setRecipientAmount(recipientAmount);

        return paymentRepository.save(payment);
    }

    /**
     * Process a payment (simulate payment processing)
     */
    @Transactional
    public Payment processPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found with id: " + paymentId));

        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalStateException("Payment is not in PENDING status");
        }

        payment.setStatus(PaymentStatus.PROCESSING);
        paymentRepository.save(payment);

        // Simulate payment processing (90% success rate for demo)
        boolean success = random.nextDouble() < 0.9;

        if (success) {
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setTransactionReference("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

            // Auto-create tracking for this journey when payment is completed
            try {
                Fahrt fahrt = payment.getFahrt();
                String driverEmail = fahrt.getErstellerEmail();
                trackingService.createTracking(fahrt.getId(), driverEmail);
            } catch (Exception e) {
                // Log error but don't fail payment
                System.err.println("Failed to create tracking: " + e.getMessage());
            }
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setNotes("Payment processing failed. Please try again.");
        }

        payment.setProcessedAt(LocalDateTime.now());
        return paymentRepository.save(payment);
    }

    /**
     * Get payment by ID
     */
    public Optional<Payment> getPaymentById(Long id) {
        return paymentRepository.findById(id);
    }

    /**
     * Get all payments by user
     */
    public List<Payment> getPaymentsByUser(Long userId) {
        return paymentRepository.findByPayerIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get all payments received by user (as recipient)
     */
    public List<Payment> getPaymentsByRecipient(Long recipientId) {
        return paymentRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
    }

    /**
     * Get all payments for a trip
     */
    public List<Payment> getPaymentsByFahrt(Long fahrtId) {
        return paymentRepository.findByFahrtIdOrderByCreatedAtDesc(fahrtId);
    }

    /**
     * Get payments by status
     */
    public List<Payment> getPaymentsByStatus(PaymentStatus status) {
        return paymentRepository.findByStatus(status);
    }

    /**
     * Refund a payment
     */
    @Transactional
    public Payment refundPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found with id: " + paymentId));

        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            throw new IllegalStateException("Only completed payments can be refunded");
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        return paymentRepository.save(payment);
    }
}
