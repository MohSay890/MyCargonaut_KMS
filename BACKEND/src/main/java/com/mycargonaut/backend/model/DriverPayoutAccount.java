package com.mycargonaut.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Driver Payout Account - stores bank account information for driver payouts
 * Each driver can have one payout account where they receive their earnings
 */
@Entity
@Table(name = "driver_payout_accounts")
@Data
public class DriverPayoutAccount {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "driver_id", nullable = false, unique = true)
    private Cargonaut driver;
    
    @Column(nullable = false, length = 100)
    private String accountHolderName; // Name on bank account
    
    @Column(nullable = false, length = 34)
    private String iban; // International Bank Account Number
    
    @Column(length = 11)
    private String bic; // Bank Identifier Code (optional for SEPA)
    
    @Column(nullable = false, length = 100)
    private String bankName; // Name of the bank
    
    @Column(nullable = false)
    private Boolean isVerified = false; // Has the account been verified?
    
    @Column(nullable = false)
    private Boolean isActive = true; // Is this account active for payouts?
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column
    private LocalDateTime verifiedAt;
    
    @Column
    private LocalDateTime updatedAt;
    
    @Column(length = 500)
    private String notes; // Admin notes about verification status
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
