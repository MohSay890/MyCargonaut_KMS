package com.mycargonaut.backend.service;

import com.mycargonaut.backend.model.Buchung;
import com.mycargonaut.backend.model.Fahrt;
import com.mycargonaut.backend.repository.BuchungRepository;
import com.mycargonaut.backend.repository.FahrtRepository;
import org.springframework.stereotype.Service;

@Service
public class BuchungService {

    private final BuchungRepository buchungRepo;
    private final FahrtRepository fahrtRepo;

    public BuchungService(BuchungRepository buchungRepo, FahrtRepository fahrtRepo) {
        this.buchungRepo = buchungRepo;
        this.fahrtRepo = fahrtRepo;
    }

    public Buchung createBuchung(Long fahrtId, Long userId) {
        Fahrt fahrt = fahrtRepo.findById(fahrtId)
                .orElseThrow(() -> new RuntimeException("Fahrt nicht gefunden"));

        if (fahrt.getFreiePlaetze() <= 0) {
            throw new RuntimeException("Ausgebucht");
        }

        fahrt.setFreiePlaetze(fahrt.getFreiePlaetze() - 1);
        fahrtRepo.save(fahrt);

        Buchung b = new Buchung();
        b.setFahrt(fahrt);
        // Hinweis: Hier müsste noch der Mitfahrer/User gesetzt werden
        return buchungRepo.save(b);
    }
}
