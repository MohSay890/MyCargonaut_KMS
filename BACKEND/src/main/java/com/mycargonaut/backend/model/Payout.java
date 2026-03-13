package com.mycargonaut.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Payout - tracks individual payout transactions to drivers
 * Created automatically after trip completion when escrow is released
 */
@Entity
@Table(name = "payouts")
@Data
public class Payout {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment; // Original payment that this payout is from
    
    @ManyToOne
    @JoinColumn(name = "driver_id", nullable = false)
    private Cargonaut driver; // Driver receiving the payout
    
    @ManyToOne
    @JoinColumn(name = "payout_account_id", nullable = true)
    private DriverPayoutAccount payoutAccount; // Bank account for payout
    
    @Column(nullable = false)
    private BigDecimal amount; // Amount to be paid out (after platform fee)
    
    @Column(nullable = false, length = 3)
    private String currency = "EUR";
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PayoutStatus status = PayoutStatus.PENDING;
    
    @Column(length = 100)
    private String transactionReference; // Bank transfer reference
    
    @Column(nullable = false)
    private LocalDateTime createdAt; // When payout was created
    
    @Column
    private LocalDateTime scheduledAt; // When payout is scheduled (e.g., next Monday)
    
    @Column
    private LocalDateTime processedAt; // When payout was actually sent
    
    @Column
    private LocalDateTime completedAt; // When payout was confirmed by bank
    
    @Column(length = 500)
    private String notes; // Additional notes or error messages
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
