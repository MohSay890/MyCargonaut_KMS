package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Payment;
import com.mycargonaut.backend.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    List<Payment> findByPayerId(Long payerId);
    
    List<Payment> findByFahrtId(Long fahrtId);
    
    List<Payment> findByStatus(PaymentStatus status);
    
    List<Payment> findByPayerIdOrderByCreatedAtDesc(Long payerId);
    
    List<Payment> findByFahrtIdOrderByCreatedAtDesc(Long fahrtId);
    
    List<Payment> findByRecipientId(Long recipientId);
    
    List<Payment> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
}
