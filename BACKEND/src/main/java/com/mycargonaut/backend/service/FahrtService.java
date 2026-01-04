package com.mycargonaut.backend.service;

import com.mycargonaut.backend.model.Fahrt;
import com.mycargonaut.backend.repository.FahrtRepository;
import com.mycargonaut.backend.repository.BewertungRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.time.LocalDate;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@Service
public class FahrtService {

    private final FahrtRepository fahrtRepository;
    private final BewertungRepository bewertungRepository;

    public FahrtService(FahrtRepository fahrtRepository, BewertungRepository bewertungRepository) {
        this.fahrtRepository = fahrtRepository;
        this.bewertungRepository = bewertungRepository;
    }

    public List<Fahrt> findePassendeFahrten(String start, String ziel, LocalDate datum, Double maxPreis, String kategorie, Double minRating) {
        List<Fahrt> fahrten = fahrtRepository.searchFahrten(
            start, 
            ziel, 
            datum != null ? datum : LocalDate.now()
        );

        return fahrten.stream()
                .filter(f -> maxPreis == null || f.getPreis().compareTo(BigDecimal.valueOf(maxPreis)) <= 0)
                .filter(f -> f.getFreiePlaetze() > 0)
                .filter(f -> kategorie == null || kategorie.isEmpty() || 
                            (f.getKategorie() != null && f.getKategorie().equalsIgnoreCase(kategorie)))
                .filter(f -> minRating == null || getDriverRating(f) >= minRating)
                .collect(Collectors.toList());
    }

    /**
     * Calculate average rating for the driver of this trip.
     * For now, returns a default rating since we don't have user-review relationship.
     * In production, this would query actual reviews for the driver.
     */
    private double getDriverRating(Fahrt fahrt) {
        // If we have a driver assigned, we could calculate their actual rating
        // For now, return average rating or a default
        Double avgRating = bewertungRepository.findAverageRating();
        return avgRating != null ? avgRating : 4.5;
    }

    public Fahrt createFahrt(Fahrt fahrt) {
        return fahrtRepository.save(fahrt);
    }
}
