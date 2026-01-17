package com.mycargonaut.backend.service;

import com.mycargonaut.backend.model.*;
import com.mycargonaut.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.mycargonaut.backend.service.NotificationService;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BewertungService {

    private final BewertungRepository bewertungRepository;
    private final FahrtRepository fahrtRepository;
    private final CargonautRepository cargonautRepository;
    private final BuchungRepository buchungRepository;
    private final NotificationService notificationService; // Für die "Neue Bewertung" Nachricht

    @Transactional
    public Bewertung speichereBewertung(Bewertung bewertung) {
        // 1. Basis-Daten aus der DB laden
        Fahrt fahrt = fahrtRepository.findById(bewertung.getFahrt().getId())
                .orElseThrow(() -> new RuntimeException("Fahrt nicht gefunden"));

        Cargonaut autor = cargonautRepository.findById(bewertung.getAutor().getId())
                .orElseThrow(() -> new RuntimeException("Autor nicht gefunden"));

        // 2. Partner-Ermittlung (Wer wird bewertet?)
        Cargonaut partner = null;
        if (autor.getId().equals(fahrt.getFahrer().getId())) {
            // Ich bin der Fahrer -> Suche Mitfahrer in der Buchungstabelle
            List<Buchung> buchungen = buchungRepository.findByFahrtId(fahrt.getId());
            if (buchungen != null && !buchungen.isEmpty()) {
                partner = buchungen.get(0).getMitfahrer();
            }
        } else {
            // Ich bin der Mitfahrer -> Partner ist der Fahrer der Fahrt
            partner = fahrt.getFahrer();
        }

        if (partner == null) {
            throw new RuntimeException("Bewertungspartner konnte nicht gefunden werden (Keine Buchung vorhanden).");
        }

        // 3. Dubletten-Check: Hat dieser User diese Fahrt schon einmal bewertet?
        // (Verhindert mehrfaches Absenden)
        List<Bewertung> bisherige = bewertungRepository.findByFahrt_Id(fahrt.getId());
        for (Bewertung b : bisherige) {
            if (b.getAutor().getId().equals(autor.getId())) {
                throw new RuntimeException("Du hast diese Fahrt bereits bewertet.");
            }
        }

        // 4. Bewertung finalisieren
        bewertung.setBewerteterNutzer(partner);
        bewertung.setFahrt(fahrt);
        bewertung.setAutor(autor);
        bewertung.setIstSichtbar(false); // Zuerst unsichtbar (Double-Blind)

        Bewertung gespeicherteBewertung = bewertungRepository.save(bewertung);

        // 5. BENACHRICHTIGUNG SENDEN (In die neue Notification-Tabelle)
        String autorName = autor.getVorname() + " " + autor.getNachname().substring(0, 1) + ".";
        String titel = "Neue Bewertung";
        String nachricht = autorName + " hat dich mit " + bewertung.getSterne() + " Sternen bewertet.";

        notificationService.sende(partner, titel, nachricht, "REVIEW");

        // 6. DOUBLE-BLIND LOGIK: Sichtbarkeit freischalten
        // Wir laden die Liste der Bewertungen neu (inkl. der gerade gespeicherten)
        List<Bewertung> alleBewertungen = bewertungRepository.findByFahrt_Id(fahrt.getId());

        if (alleBewertungen.size() >= 2) {
            // Sobald beide (Fahrer & Mitfahrer) bewertet haben, werden alle sichtbar
            for (Bewertung b : alleBewertungen) {
                b.setIstSichtbar(true);
            }
            bewertungRepository.saveAll(alleBewertungen);
        }

        return gespeicherteBewertung;
    }
}
