package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Buchung;
import com.mycargonaut.backend.model.Cargonaut;
import com.mycargonaut.backend.model.Fahrt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BuchungRepository extends JpaRepository<Buchung, Long> {
    
    // Find all bookings for a specific trip
    List<Buchung> findByFahrt(Fahrt fahrt);
    
    // Find bookings by trip and status
    List<Buchung> findByFahrtAndStatus(Fahrt fahrt, String status);
    
    // Find all bookings made by a user (as passenger)
    List<Buchung> findByMitfahrer(Cargonaut mitfahrer);
    
    // Find bookings by passenger and status
    List<Buchung> findByMitfahrerAndStatus(Cargonaut mitfahrer, String status);
    
    // Check if user already has a booking for this trip
    boolean existsByFahrtAndMitfahrer(Fahrt fahrt, Cargonaut mitfahrer);
    
    // Find specific booking by trip and passenger
    Optional<Buchung> findByFahrtAndMitfahrer(Fahrt fahrt, Cargonaut mitfahrer);
    
    // Find all pending booking requests for trips created by a specific user
    @Query("SELECT b FROM Buchung b WHERE b.fahrt.erstellerEmail = :creatorEmail AND b.status = 'PENDING'")
    List<Buchung> findPendingBookingRequestsForCreator(@Param("creatorEmail") String creatorEmail);
    
    // Count pending requests for a trip
    @Query("SELECT COUNT(b) FROM Buchung b WHERE b.fahrt = :fahrt AND b.status = 'PENDING'")
    Long countPendingRequestsForTrip(@Param("fahrt") Fahrt fahrt);

    @Query("SELECT b FROM Buchung b WHERE b.fahrt.erstellerEmail = :creatorEmail AND b.status = 'CONFIRMED'")
    List<Buchung> findConfirmedBookingsForCreator(@Param("creatorEmail") String creatorEmail);
}
