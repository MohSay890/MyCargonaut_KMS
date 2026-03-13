package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Payment;
import com.mycargonaut.backend.model.PaymentStatus;
import com.mycargonaut.backend.model.EscrowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    List<Payment> findByPayerId(Long payerId);
    
    List<Payment> findByFahrtId(Long fahrtId);
    
    List<Payment> findByFahrtIdAndPayerId(Long fahrtId, Long payerId);

    List<Payment> findByPayerIdOrderByCreatedAtDesc(Long payerId);
    
    List<Payment> findByFahrtIdOrderByCreatedAtDesc(Long fahrtId);
    
    List<Payment> findByRecipientId(Long recipientId);
    
    List<Payment> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    
    List<Payment> findByStatus(PaymentStatus status);

    List<Payment> findByEscrowStatus(EscrowStatus escrowStatus);
    
    List<Payment> findByEscrowStatusAndEscrowHeldAtBefore(EscrowStatus escrowStatus, LocalDateTime dateTime);
    
    List<Payment> findByFahrtIdAndEscrowStatus(Long fahrtId, EscrowStatus escrowStatus);
}

