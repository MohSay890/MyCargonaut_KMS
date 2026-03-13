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
    
    @Autowired
    private PayoutService payoutService;
    
    @Autowired
    private com.mycargonaut.backend.repository.BuchungRepository buchungRepository;

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

        // Check if a valid payment already exists
        List<Payment> existingPayments = paymentRepository.findByFahrtIdAndPayerId(fahrt.getId(), payer.getId());
        for (Payment p : existingPayments) {
            if (p.getStatus() == PaymentStatus.COMPLETED || p.getStatus() == PaymentStatus.PROCESSING || p.getStatus() == PaymentStatus.PENDING) {
                throw new IllegalStateException("Payment already exists for this trip.");
            }
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
     * Process a payment with ESCROW logic
     * Money is held by platform until trip completion
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
        // TODO: Replace with real Stripe/PayPal integration
        boolean success = random.nextDouble() < 0.9;

        if (success) {
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setTransactionReference("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            
            // ESCROW: Money is held by platform, NOT sent to driver yet
            payment.setEscrowStatus(EscrowStatus.HELD);
            payment.setEscrowHeldAt(LocalDateTime.now());
            
            // Mark booking as paid
            try {
                Fahrt fahrt = payment.getFahrt();
                Cargonaut payer = payment.getPayer();
                buchungRepository.findByFahrtAndMitfahrer(fahrt, payer).ifPresent(buchung -> {
                    buchung.setIsPaid(true);
                    buchungRepository.save(buchung);
                    System.out.println("Booking " + buchung.getId() + " marked as paid");
                });
            } catch (Exception e) {
                System.err.println("Failed to update booking payment status: " + e.getMessage());
            }

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
            payment.setEscrowStatus(EscrowStatus.FAILED);
            payment.setNotes("Payment processing failed. Please try again.");
        }

        payment.setProcessedAt(LocalDateTime.now());
        return paymentRepository.save(payment);
    }
    
    /**
     * Release escrow and trigger payout to driver
     * Called after trip completion
     */
    @Transactional
    public Payment releaseEscrow(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found with id: " + paymentId));
        
        if (payment.getEscrowStatus() != EscrowStatus.HELD) {
            throw new IllegalStateException("Payment escrow is not in HELD status. Current: " + payment.getEscrowStatus());
        }
        
        // Release escrow
        payment.setEscrowStatus(EscrowStatus.RELEASED);
        payment.setEscrowReleasedAt(LocalDateTime.now());
        payment = paymentRepository.save(payment);
        
        // Create payout record and schedule payout to driver
        try {
            payoutService.createPayout(payment);
            System.out.println("Payout created for payment " + paymentId);
        } catch (Exception e) {
            System.err.println("Failed to create payout for payment " + paymentId + ": " + e.getMessage());
        }
        
        return payment;
    }
    
    /**
     * Refund payment and cancel escrow
     * Called when trip is cancelled before completion
     */
    @Transactional
    public Payment refundEscrow(Long paymentId, String reason) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found with id: " + paymentId));
        
        if (payment.getEscrowStatus() != EscrowStatus.HELD) {
            throw new IllegalStateException("Cannot refund payment that is not held in escrow");
        }
        
        // Refund to passenger
        payment.setStatus(PaymentStatus.REFUNDED);
        payment.setEscrowStatus(EscrowStatus.REFUNDED);
        payment.setEscrowRefundedAt(LocalDateTime.now());
        payment.setNotes("Refunded: " + reason);
        
        // TODO: Process actual refund via Stripe/PayPal
        
        return paymentRepository.save(payment);
    }
    
    /**
     * Get all payments that are held in escrow
     */
    public List<Payment> getPaymentsInEscrow() {
        return paymentRepository.findByEscrowStatus(EscrowStatus.HELD);
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
     * Refund a payment (legacy method - use refundEscrow instead)
     */
    @Transactional
    public Payment refundPayment(Long paymentId) {
        return refundEscrow(paymentId, "Manual refund requested");
    }
}
