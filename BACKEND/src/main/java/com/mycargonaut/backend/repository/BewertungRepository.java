package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Bewertung;
import com.mycargonaut.backend.model.Cargonaut;
import com.mycargonaut.backend.model.Fahrt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BewertungRepository extends JpaRepository<Bewertung, Long> {
    
    // Find all visible reviews received by a user
    List<Bewertung> findByBewertetAndIstSichtbar(Cargonaut bewertet, boolean istSichtbar);
    
    // Find reviews for a specific trip
    List<Bewertung> findByFahrt(Fahrt fahrt);
    
    // Find review by trip and reviewer
    Optional<Bewertung> findByFahrtAndVerfasser(Fahrt fahrt, Cargonaut verfasser);
    
    // Check if user has already reviewed this trip
    boolean existsByFahrtAndVerfasser(Fahrt fahrt, Cargonaut verfasser);
    
    // Calculate average rating for a user (only visible reviews)
    @Query("SELECT AVG(b.sterne) FROM Bewertung b WHERE b.bewertet = :user AND b.istSichtbar = true")
    Double findAverageRatingForUser(@Param("user") Cargonaut user);
    
    // Count reviews for a user (only visible)
    @Query("SELECT COUNT(b) FROM Bewertung b WHERE b.bewertet = :user AND b.istSichtbar = true")
    Long countReviewsForUser(@Param("user") Cargonaut user);
    
    // Get all reviews for a user as driver (visible only)
    @Query("SELECT b FROM Bewertung b WHERE b.bewertet = :user AND b.reviewerRole = 'PASSENGER' AND b.istSichtbar = true")
    List<Bewertung> findDriverReviews(@Param("user") Cargonaut user);
    
    // Get all reviews for a user as passenger (visible only)
    @Query("SELECT b FROM Bewertung b WHERE b.bewertet = :user AND b.reviewerRole = 'DRIVER' AND b.istSichtbar = true")
    List<Bewertung> findPassengerReviews(@Param("user") Cargonaut user);
}
