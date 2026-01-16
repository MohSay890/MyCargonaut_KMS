package com.mycargonaut.backend.service;

import com.mycargonaut.backend.model.Buchung;
import com.mycargonaut.backend.model.Fahrt;
import com.mycargonaut.backend.model.Cargonaut;
import com.mycargonaut.backend.repository.BuchungRepository;
import com.mycargonaut.backend.repository.FahrtRepository;
import com.mycargonaut.backend.repository.CargonautRepository;
import com.mycargonaut.backend.service.NotificationService;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;

@Service
public class BuchungService {

    private final BuchungRepository buchungRepo;
    private final FahrtRepository fahrtRepo;
    private final CargonautRepository cargonautRepo;
    private final NotificationService notificationService;

    public BuchungService(BuchungRepository buchungRepo,
                          FahrtRepository fahrtRepo,
                          CargonautRepository cargonautRepo,
                          NotificationService notificationService) {
        this.buchungRepo = buchungRepo;
        this.fahrtRepo = fahrtRepo;
        this.cargonautRepo = cargonautRepo;
        this.notificationService = notificationService;
    }

    @Transactional
    public Buchung createBuchung(Long fahrtId, Long userId) {
        // 1. Fahrt laden
        Fahrt fahrt = fahrtRepo.findById(fahrtId)
                .orElseThrow(() -> new RuntimeException("Fahrt nicht gefunden"));

        // 2. Verfügbarkeit prüfen
        if (fahrt.getFreiePlaetze() <= 0) {
            throw new RuntimeException("Ausgebucht");
        }

        // 3. Mitfahrer laden
        Cargonaut mitfahrer = cargonautRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Benutzer mit ID " + userId + " nicht gefunden"));

        // --- KORREKTUR: Kein Absturz mehr wenn fahrer_id null ist ---
        Cargonaut fahrer = fahrt.getFahrer();
        if (fahrer == null && fahrt.getErstellerEmail() != null) {
            // Falls fahrer_id null ist, suchen wir ihn über die E-Mail als Sicherheitsnetz
            fahrer = cargonautRepo.findByEmail(fahrt.getErstellerEmail()).orElse(null);
        }
        // ------------------------------------------------------------

        // 4. Sitzplatz reservieren
        fahrt.setFreiePlaetze(fahrt.getFreiePlaetze() - 1);
        fahrtRepo.save(fahrt);

        // 5. Buchung erstellen
        Buchung b = new Buchung();
        b.setFahrt(fahrt);
        b.setMitfahrer(mitfahrer);
        b.setMitfahrerEmail(mitfahrer.getEmail());
        b.setGebuchtAm(LocalDateTime.now());
        b.setStatus("BESTAETIGT");

        // Zuerst die Buchung speichern, damit sie sicher in der DB ist
        Buchung savedBuchung = buchungRepo.save(b);

        // 6. BENACHRICHTIGUNG SENDEN (nur wenn Fahrer gefunden wurde)
        if (fahrer != null) {
            try {
                notificationService.sende(
                    fahrer,
                    "Neue Buchungsanfrage erhalten",
                    mitfahrer.getVorname() + " möchte deine Fahrt " + fahrt.getStartOrt() + " → " + fahrt.getZielOrt() + " buchen.",
                    "BOOKING"
                );
            } catch (Exception e) {
                // Wenn das Senden hakt, loggen wir es nur, damit die Buchung klappt!
                System.err.println("Benachrichtigung fehlgeschlagen: " + e.getMessage());
            }
        }

        return savedBuchung;
    }
}
