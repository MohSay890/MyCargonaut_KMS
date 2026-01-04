package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.TransportRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransportRequestRepository extends JpaRepository<TransportRequest, Long> {
    
    // Find all requests by creator email
    List<TransportRequest> findByErstellerEmail(String email);
    
    // Find active requests
    List<TransportRequest> findByStatus(String status);
    
    // Search requests by route and filters
    @Query("SELECT tr FROM TransportRequest tr WHERE " +
           "LOWER(tr.startOrt) LIKE LOWER(CONCAT('%', :start, '%')) AND " +
           "LOWER(tr.zielOrt) LIKE LOWER(CONCAT('%', :ziel, '%')) AND " +
           "(:datum IS NULL OR tr.datum = :datum) AND " +
           "(:maxPreis IS NULL OR tr.maxPreis <= :maxPreis) AND " +
           "(:kategorie IS NULL OR tr.kategorie = :kategorie) AND " +
           "tr.status = 'ACTIVE' " +
           "ORDER BY tr.erstelltAm DESC")
    List<TransportRequest> searchRequests(
        @Param("start") String start,
        @Param("ziel") String ziel,
        @Param("datum") LocalDate datum,
        @Param("maxPreis") BigDecimal maxPreis,
        @Param("kategorie") String kategorie
    );
}
