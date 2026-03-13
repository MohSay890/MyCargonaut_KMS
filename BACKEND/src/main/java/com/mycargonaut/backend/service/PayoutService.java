package com.mycargonaut.backend.service;

import com.mycargonaut.backend.model.*;
import com.mycargonaut.backend.repository.DriverPayoutAccountRepository;
import com.mycargonaut.backend.repository.PaymentRepository;
import com.mycargonaut.backend.repository.PayoutRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;

/**
 * Service for handling driver payouts
 * Automatically processes payouts for completed trips
 */
@Service
public class PayoutService {

    @Autowired
    private PayoutRepository payoutRepository;
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private DriverPayoutAccountRepository driverPayoutAccountRepository;

    /**
     * Create a payout for a payment that has been released from escrow
     */
    @Transactional
    public Payout createPayout(Payment payment) {
        if (payment.getEscrowStatus() != EscrowStatus.RELEASED) {
            throw new IllegalStateException("Payment must be released from escrow before creating payout");
        }
        
        Cargonaut driver = payment.getRecipient();
        
        // Get driver's payout account
        Optional<DriverPayoutAccount> accountOpt = driverPayoutAccountRepository
            .findByDriverIdAndIsActive(driver.getId(), true);
        
        Payout payout = new Payout();
        payout.setPayment(payment);
        payout.setDriver(driver);
        payout.setAmount(payment.getRecipientAmount()); // Amount after platform fee
        payout.setCurrency(payment.getCurrency());
        
        if (accountOpt.isPresent()) {
            payout.setPayoutAccount(accountOpt.get());
            payout.setStatus(PayoutStatus.PENDING);
        } else {
            // No bank account configured - cannot process payout
            payout.setStatus(PayoutStatus.FAILED);
            payout.setNotes("Driver has not configured payout account");
        }
        
        // Schedule payout for next Monday
        LocalDateTime nextMonday = LocalDateTime.now()
            .with(TemporalAdjusters.next(DayOfWeek.MONDAY))
            .withHour(2)
            .withMinute(0)
            .withSecond(0);
        payout.setScheduledAt(nextMonday);
        
        return payoutRepository.save(payout);
    }

    /**
     * Process scheduled payouts
     * Runs every Monday at 2:00 AM
     */
    @Scheduled(cron = "0 0 2 * * MON")
    @Transactional
    public void processScheduledPayouts() {
        System.out.println("Processing scheduled payouts...");
        
        LocalDateTime now = LocalDateTime.now();
        
        // Find all pending payouts that are scheduled for now or earlier
        List<Payout> duePayouts = payoutRepository
            .findByStatusAndScheduledAtBefore(PayoutStatus.PENDING, now);
        
        System.out.println("Found " + duePayouts.size() + " payouts to process");
        
        for (Payout payout : duePayouts) {
            try {
                processPayout(payout);
            } catch (Exception e) {
                System.err.println("Failed to process payout " + payout.getId() + ": " + e.getMessage());
                payout.setStatus(PayoutStatus.FAILED);
                payout.setNotes("Processing failed: " + e.getMessage());
                payoutRepository.save(payout);
            }
        }
    }

    /**
     * Process individual payout
     * TODO: Integrate with Stripe Connect or bank transfer API
     */
    @Transactional
    public Payout processPayout(Payout payout) {
        if (payout.getStatus() != PayoutStatus.PENDING) {
            throw new IllegalStateException("Payout is not in PENDING status");
        }
        
        DriverPayoutAccount account = payout.getPayoutAccount();
        if (account == null || !account.getIsActive()) {
            payout.setStatus(PayoutStatus.FAILED);
            payout.setNotes("Invalid or inactive payout account");
            return payoutRepository.save(payout);
        }
        
        payout.setStatus(PayoutStatus.PROCESSING);
        payout.setProcessedAt(LocalDateTime.now());
        payoutRepository.save(payout);
        
        // TODO: Integrate with real payment provider (Stripe Connect, Bank Transfer API)
        // For now, simulate successful payout
        boolean success = true; // Would be result of actual bank transfer
        
        if (success) {
            payout.setStatus(PayoutStatus.COMPLETED);
            payout.setCompletedAt(LocalDateTime.now());
            payout.setTransactionReference("PAYOUT-" + System.currentTimeMillis());
            payout.setNotes("Payout completed successfully");
        } else {
            payout.setStatus(PayoutStatus.FAILED);
            payout.setNotes("Bank transfer failed");
        }
        
        return payoutRepository.save(payout);
    }

    /**
     * Get all payouts for a driver
     */
    public List<Payout> getPayoutsByDriver(Long driverId) {
        return payoutRepository.findByDriverIdOrderByCreatedAtDesc(driverId);
    }

    /**
     * Get payout by ID
     */
    public Optional<Payout> getPayoutById(Long payoutId) {
        return payoutRepository.findById(payoutId);
    }

    /**
     * Cancel a payout (must be pending or scheduled)
     */
    @Transactional
    public Payout cancelPayout(Long payoutId, String reason) {
        Payout payout = payoutRepository.findById(payoutId)
            .orElseThrow(() -> new RuntimeException("Payout not found"));
        
        if (payout.getStatus() != PayoutStatus.PENDING && payout.getStatus() != PayoutStatus.SCHEDULED) {
            throw new IllegalStateException("Can only cancel pending or scheduled payouts");
        }
        
        payout.setStatus(PayoutStatus.CANCELLED);
        payout.setNotes("Cancelled: " + reason);
        
        return payoutRepository.save(payout);
    }
}
