package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Bewertung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface BewertungRepository extends JpaRepository<Bewertung, Long> {

    // WICHTIG: Der Unterstrich löst den "Unable to locate Attribute" Fehler!
    List<Bewertung> findByFahrt_Id(Long fahrtId);

    @Query("SELECT AVG(b.sterne) FROM Bewertung b WHERE b.bewerteterNutzer.id = :nutzerId AND b.istSichtbar = true")
    Double findAverageRating(@Param("nutzerId") Long nutzerId);

    @Query("SELECT COUNT(b) FROM Bewertung b WHERE b.bewerteterNutzer.id = :nutzerId AND b.istSichtbar = true")
    Long countAllReviews(@Param("nutzerId") Long nutzerId);

    List<Bewertung> findByBewerteterNutzerIdAndIstSichtbarTrue(Long nutzerId);
    // Prüft, ob dieser Autor für diese Fahrt bereits bewertet hat
    boolean existsByFahrt_IdAndAutor_Id(Long fahrtId, Long autorId);
}
