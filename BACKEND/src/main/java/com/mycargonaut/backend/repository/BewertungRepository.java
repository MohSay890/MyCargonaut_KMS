package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Bewertung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface BewertungRepository extends JpaRepository<Bewertung, Long> {

    // Bestehende Methoden
    List<Bewertung> findByBewerteterNutzerIdAndIstSichtbarTrue(Long nutzerId);
    List<Bewertung> findByFahrtId(Long fahrtId);

    // NEU: Berechnet den Durchschnitt der Sterne für einen Nutzer (nur sichtbare)
    @Query("SELECT AVG(b.sterne) FROM Bewertung b WHERE b.bewerteterNutzer.id = :nutzerId AND b.istSichtbar = true")
    Double findAverageRating(@Param("nutzerId") Long nutzerId);

    // NEU: Zählt alle sichtbaren Bewertungen eines Nutzers
    @Query("SELECT COUNT(b) FROM Bewertung b WHERE b.bewerteterNutzer.id = :nutzerId AND b.istSichtbar = true")
    Long countAllReviews(@Param("nutzerId") Long nutzerId);
}
