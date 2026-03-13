package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Payout;
import com.mycargonaut.backend.model.PayoutStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PayoutRepository extends JpaRepository<Payout, Long> {
    
    List<Payout> findByDriverId(Long driverId);
    
    List<Payout> findByStatus(PayoutStatus status);
    
    List<Payout> findByDriverIdOrderByCreatedAtDesc(Long driverId);
    
    List<Payout> findByStatusAndScheduledAtBefore(PayoutStatus status, LocalDateTime dateTime);
}
