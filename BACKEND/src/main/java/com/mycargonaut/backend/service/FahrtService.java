package com.mycargonaut.backend.service;

import com.mycargonaut.backend.model.Fahrt;
import com.mycargonaut.backend.model.Cargonaut;
import com.mycargonaut.backend.repository.FahrtRepository;
import com.mycargonaut.backend.repository.BewertungRepository;
import com.mycargonaut.backend.repository.CargonautRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.time.LocalDate;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.util.Optional;

@Service
public class FahrtService {

    private final FahrtRepository fahrtRepository;
    private final BewertungRepository bewertungRepository;
    private final CargonautRepository cargonautRepository;

    public FahrtService(FahrtRepository fahrtRepository, BewertungRepository bewertungRepository, CargonautRepository cargonautRepository) {
        this.fahrtRepository = fahrtRepository;
        this.bewertungRepository = bewertungRepository;
        this.cargonautRepository = cargonautRepository;
    }

    public List<Fahrt> findePassendeFahrten(String start, String ziel, LocalDate datum, Double maxPreis, String kategorie, Double minRating) {
        List<Fahrt> fahrten = fahrtRepository.searchFahrten(
            start, 
            ziel, 
            datum != null ? datum : LocalDate.now()
        );

        return fahrten.stream()
                .filter(f -> f.getStatus() == null || "ACTIVE".equalsIgnoreCase(f.getStatus()))
                .filter(f -> maxPreis == null || f.getPreis().compareTo(BigDecimal.valueOf(maxPreis)) <= 0)
                .filter(f -> f.getFreiePlaetze() > 0)
                .filter(f -> kategorie == null || kategorie.isEmpty() || 
                            (f.getKategorie() != null && f.getKategorie().equalsIgnoreCase(kategorie)))
                .map(this::enrichFahrt)
                .filter(f -> minRating == null || (f.getDurchschnittlicheBewertung() != null && f.getDurchschnittlicheBewertung() >= minRating))
                .collect(Collectors.toList());
    }
    
    public Fahrt enrichFahrt(Fahrt fahrt) {
        fahrt.setDurchschnittlicheBewertung(getDriverRating(fahrt));
        fahrt.setErstellerFahrten(getDriverCompletedFahrten(fahrt));
        return fahrt;
    }

    private int getDriverCompletedFahrten(Fahrt fahrt) {
        if (fahrt.getErstellerEmail() != null) {
            return fahrtRepository.countByErstellerEmailAndStatus(fahrt.getErstellerEmail(), "COMPLETED");
        }
        return 0;
    }

    private double getDriverRating(Fahrt fahrt) {
        // Use the pre-calculated rating on the Fahrt if available
        if (fahrt.getDurchschnittlicheBewertung() != null && fahrt.getDurchschnittlicheBewertung() > 0) {
            return fahrt.getDurchschnittlicheBewertung();
        }

        // Otherwise, calculate from driver's email
        if (fahrt.getErstellerEmail() != null) {
            Optional<Cargonaut> driver = cargonautRepository.findByEmail(fahrt.getErstellerEmail());
            if (driver.isPresent()) {
                Double avgRating = bewertungRepository.findAverageRatingForUser(driver.get());
                return avgRating != null ? avgRating : 0.0;
            }
        }
        
        // No rating available - return 0.0 instead of mock 4.5
        return 0.0;
    }

    public Fahrt createFahrt(Fahrt fahrt) {
        return fahrtRepository.save(fahrt);
    }
}
