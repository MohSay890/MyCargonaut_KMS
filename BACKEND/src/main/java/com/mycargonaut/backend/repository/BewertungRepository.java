package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Bewertung;
import com.mycargonaut.backend.model.Cargonaut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface BewertungRepository extends JpaRepository<Bewertung, Long> {
    
    // Find reviews received by a user (as the reviewed person)
    // Note: This assumes Bewertung has a relationship to the reviewed person
    // For now, we'll add a query method
    
    @Query("SELECT AVG(b.sterne) FROM Bewertung b")
    Double findAverageRating();
    
    @Query("SELECT COUNT(b) FROM Bewertung b")
    Long countAllReviews();
}
