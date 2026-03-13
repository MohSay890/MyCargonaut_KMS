package com.mycargonaut.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
public class Payment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "fahrt_id", nullable = false)
    private Fahrt fahrt;
    
    @ManyToOne
    @JoinColumn(name = "payer_id", nullable = false)
    private Cargonaut payer;
    
    @ManyToOne
    @JoinColumn(name = "recipient_id", nullable = false)
    private Cargonaut recipient;
    
    @Column(nullable = false)
    private BigDecimal amount;
    
    @Column(nullable = false)
    private BigDecimal platformFee = BigDecimal.ZERO;
    
    @Column(nullable = false)
    private BigDecimal recipientAmount = BigDecimal.ZERO;
    
    @Column(nullable = false, length = 3)
    private String currency = "EUR";
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;
    
    // Escrow fields
    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private EscrowStatus escrowStatus = EscrowStatus.HELD;
    
    @Column
    private LocalDateTime escrowHeldAt; // When money was held by platform
    
    @Column
    private LocalDateTime escrowReleasedAt; // When money was released to driver
    
    @Column
    private LocalDateTime escrowRefundedAt; // When money was refunded to passenger
    
    @Column(length = 100)
    private String transactionReference;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column
    private LocalDateTime processedAt;
    
    @Column(length = 500)
    private String notes;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
