package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Fahrt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.time.LocalDate;

public interface FahrtRepository extends JpaRepository<Fahrt, Long> {

    // Search by start and destination
    List<Fahrt> findByStartOrtAndZielOrt(String startOrt, String zielOrt);

    // Find all journeys created by a specific user (by email)
    List<Fahrt> findByErstellerEmail(String erstellerEmail);
    
    // Count completed journeys by a specific user (by email) and status
    int countByErstellerEmailAndStatus(String erstellerEmail, String status);

    // Search with date filter
    @Query("SELECT f FROM Fahrt f WHERE " +
           "LOWER(f.startOrt) LIKE LOWER(CONCAT('%', :start, '%')) AND " +
           "LOWER(f.zielOrt) LIKE LOWER(CONCAT('%', :ziel, '%')) AND " +
           "f.datum >= :abDatum")
    List<Fahrt> searchFahrten(@Param("start") String start,
                             @Param("ziel") String ziel,
                             @Param("abDatum") LocalDate abDatum);
}