package com.mycargonaut.backend.service;

import com.mycargonaut.backend.model.Bewertung;
import com.mycargonaut.backend.repository.BewertungRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class BewertungService {
    @Autowired
    private BewertungRepository bewertungRepository;

    public Bewertung speichereBewertung(Bewertung neueBewertung) {
        Bewertung gespeichert = bewertungRepository.save(neueBewertung);

        // "Blind-Rating" Logik: Prüfen, ob beide Parteien bewertet haben
        List<Bewertung> bewertungenFuerFahrt = bewertungRepository.findByFahrtId(neueBewertung.getFahrtId());
        if (bewertungenFuerFahrt.size() >= 2) {
            for (Bewertung b : bewertungenFuerFahrt) {
                b.setIstSichtbar(true);
                bewertungRepository.save(b);
            }
        }
        return gespeichert;
    }
}
