package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.RequestOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequestOfferRepository extends JpaRepository<RequestOffer, Long> {
    
    // Find all offers for a specific request
    List<RequestOffer> findByRequestIdOrderByErstelltAmDesc(Long requestId);
    
    // Find offers by driver email
    List<RequestOffer> findByDriverEmailOrderByErstelltAmDesc(String driverEmail);
    
    // Find offers by status
    List<RequestOffer> findByStatusOrderByErstelltAmDesc(String status);
    
    // Count offers for a request
    long countByRequestId(Long requestId);
    
    // Find accepted offer for a request
    RequestOffer findByRequestIdAndStatus(Long requestId, String status);
}
