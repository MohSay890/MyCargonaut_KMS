package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.model.Fahrt;
import com.mycargonaut.backend.model.Buchung;
import com.mycargonaut.backend.repository.FahrtRepository;
import com.mycargonaut.backend.repository.BuchungRepository;
import com.mycargonaut.backend.service.FahrtService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/fahrten")
@CrossOrigin(origins = "http://localhost:4200")
public class FahrtController {

    private final FahrtRepository fahrtRepository;
    private final FahrtService fahrtService;
    private final BuchungRepository buchungRepository;

    public FahrtController(FahrtRepository fahrtRepository, FahrtService fahrtService, BuchungRepository buchungRepository) {
        this.fahrtRepository = fahrtRepository;
        this.fahrtService = fahrtService;
        this.buchungRepository = buchungRepository;
    }

    // GET single journey by ID
    @GetMapping("/{id}")
    public ResponseEntity<Fahrt> getFahrtById(@PathVariable Long id) {
        return fahrtRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // PUT - Update a journey
    @PutMapping("/{id}")
    public ResponseEntity<Fahrt> updateFahrt(@PathVariable Long id, @RequestBody Fahrt fahrtDetails) {
        return fahrtRepository.findById(id)
                .map(fahrt -> {
                    fahrt.setStartOrt(fahrtDetails.getStartOrt());
                    fahrt.setZielOrt(fahrtDetails.getZielOrt());
                    fahrt.setDatum(fahrtDetails.getDatum());
                    fahrt.setUhrzeit(fahrtDetails.getUhrzeit());
                    fahrt.setFreiePlaetze(fahrtDetails.getFreiePlaetze());
                    fahrt.setPreis(fahrtDetails.getPreis());
                    fahrt.setBeschreibung(fahrtDetails.getBeschreibung());
                    fahrt.setAbmessungen(fahrtDetails.getAbmessungen());
                    fahrt.setLadekapazitaet(fahrtDetails.getLadekapazitaet());
                    fahrt.setFahrzeugTyp(fahrtDetails.getFahrzeugTyp());
                    fahrt.setFahrzeugModell(fahrtDetails.getFahrzeugModell());
                    fahrt.setEntfernung(fahrtDetails.getEntfernung());
                    fahrt.setDauer(fahrtDetails.getDauer());
                    fahrt.setExtras(fahrtDetails.getExtras());
                    fahrt.setKategorie(fahrtDetails.getKategorie());
                    fahrt.setAbholadresse(fahrtDetails.getAbholadresse());
                    fahrt.setLieferadresse(fahrtDetails.getLieferadresse());
                    // Update creator info if provided
                    if (fahrtDetails.getErstellerName() != null) {
                        fahrt.setErstellerName(fahrtDetails.getErstellerName());
                    }
                    if (fahrtDetails.getErstellerEmail() != null) {
                        fahrt.setErstellerEmail(fahrtDetails.getErstellerEmail());
                    }
                    if (fahrtDetails.getErstellerAvatar() != null) {
                        fahrt.setErstellerAvatar(fahrtDetails.getErstellerAvatar());
                    }
                    return ResponseEntity.ok(fahrtRepository.save(fahrt));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE - Remove a journey
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFahrt(@PathVariable Long id) {
        return fahrtRepository.findById(id)
                .map(fahrt -> {
                    fahrtRepository.delete(fahrt);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // GET - Search with filters
    @GetMapping("/suche")
    public List<Fahrt> sucheFahrten(
            @RequestParam String start,
            @RequestParam String ziel,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate datum,
            @RequestParam(required = false) Double maxPreis,
            @RequestParam(required = false) String kategorie,
            @RequestParam(required = false) Double minRating) {
        return fahrtService.findePassendeFahrten(start, ziel, datum, maxPreis, kategorie, minRating);
    }

    // GET - Get journeys by creator email (for "Meine Fahrten")
    @GetMapping("/meine")
    public List<Fahrt> getMeineFahrten(@RequestParam String email) {
        return fahrtRepository.findByErstellerEmail(email);
    }
    @GetMapping
        public List<Fahrt> getAllFahrten() { return fahrtRepository.findAll(); }

        @PostMapping
        public ResponseEntity<Fahrt> createFahrt(@RequestBody Fahrt fahrt) {
            return ResponseEntity.ok(fahrtRepository.save(fahrt));
        }

        // --- NEUE METHODEN FÜR DEINE TABS ---

        /**
         * Tab 1: Meine Angebote (Aktive Fahrten, die ich anbiete)
         * Entspricht image_ca538e.jpg
         */
        @GetMapping("/angebote/aktiv")
        public List<Fahrt> getAktiveAngebote(@RequestParam String email) {
            return fahrtRepository.findByErstellerEmail(email).stream()
                    .filter(f -> f.getDatum().isAfter(LocalDate.now().minusDays(1)))
                    .collect(Collectors.toList());
        }

        /**
         * Tab 2: Gebuchte Transporte (Fahrten, die ich bei anderen gebucht habe)
         * Entspricht image_caa585.jpg
         */
        @GetMapping("/gebucht/aktiv")
        public List<Fahrt> getAktiveBuchungen(@RequestParam String email) {
            // Wir suchen alle Buchungen des Mitfahrers und geben die zugehörigen Fahrten zurück
            return buchungRepository.findByMitfahrerEmail(email).stream()
                    .map(Buchung::getFahrt)
                    .filter(f -> f.getDatum() != null && !f.getDatum().isBefore(LocalDate.now()))
                    .collect(Collectors.toList());
        }

        // Tab 3: Abgeschlossen (Kombiniert eigene Angebote & fremde Buchungen)
        @GetMapping("/abgeschlossen")
        public List<Fahrt> getVergangeneFahrten(@RequestParam String email) {
            // 1. Eigene abgelaufene Angebote
            List<Fahrt> eigeneVergangen = fahrtRepository.findByErstellerEmail(email).stream()
                    .filter(f -> f.getDatum() != null && f.getDatum().isBefore(LocalDate.now()))
                    .toList();

            // 2. Gebuchte Fahrten, die bereits stattgefunden haben
            List<Fahrt> gebuchteVergangen = buchungRepository.findByMitfahrerEmail(email).stream()
                    .map(Buchung::getFahrt)
                    .filter(f -> f.getDatum() != null && f.getDatum().isBefore(LocalDate.now()))
                    .toList();

            // Alles zusammenführen
            return Stream.concat(eigeneVergangen.stream(), gebuchteVergangen.stream())
                    .distinct()
                    .collect(Collectors.toList());
        }

    // PUT - Update a journey (with authorization check)
    @PutMapping("/{id}/authorized")
    public ResponseEntity<Fahrt> updateFahrtAuthorized(
            @PathVariable Long id,
            @RequestBody Fahrt fahrtDetails,
            @RequestParam String userEmail) {
        return fahrtRepository.findById(id)
                .map(fahrt -> {
                    // Authorization check: only the creator can edit
                    if (fahrt.getErstellerEmail() == null || !fahrt.getErstellerEmail().equals(userEmail)) {
                        return ResponseEntity.status(403).<Fahrt>build();
                    }
                    fahrt.setStartOrt(fahrtDetails.getStartOrt());
                    fahrt.setZielOrt(fahrtDetails.getZielOrt());
                    fahrt.setDatum(fahrtDetails.getDatum());
                    fahrt.setUhrzeit(fahrtDetails.getUhrzeit());
                    fahrt.setFreiePlaetze(fahrtDetails.getFreiePlaetze());
                    fahrt.setPreis(fahrtDetails.getPreis());
                    fahrt.setBeschreibung(fahrtDetails.getBeschreibung());
                    fahrt.setAbmessungen(fahrtDetails.getAbmessungen());
                    fahrt.setLadekapazitaet(fahrtDetails.getLadekapazitaet());
                    fahrt.setFahrzeugTyp(fahrtDetails.getFahrzeugTyp());
                    fahrt.setFahrzeugModell(fahrtDetails.getFahrzeugModell());
                    fahrt.setEntfernung(fahrtDetails.getEntfernung());
                    fahrt.setDauer(fahrtDetails.getDauer());
                    fahrt.setExtras(fahrtDetails.getExtras());
                    fahrt.setKategorie(fahrtDetails.getKategorie());
                    fahrt.setAbholadresse(fahrtDetails.getAbholadresse());
                    fahrt.setLieferadresse(fahrtDetails.getLieferadresse());
                    return ResponseEntity.ok(fahrtRepository.save(fahrt));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE - Remove a journey (with authorization check)
    @DeleteMapping("/{id}/authorized")
    public ResponseEntity<Void> deleteFahrtAuthorized(
            @PathVariable Long id,
            @RequestParam String userEmail) {
        System.out.println("DELETE FAHRT - Received request to delete ID: " + id + " from user: '" + userEmail + "'");
        return fahrtRepository.findById(id)
                .map(fahrt -> {
                    System.out.println("Found fahrt with creator email: '" + fahrt.getErstellerEmail() + "'");
                    System.out.println("Comparison: '" + fahrt.getErstellerEmail() + "' equals '" + userEmail + "': " +
                                     (fahrt.getErstellerEmail() != null && fahrt.getErstellerEmail().equals(userEmail)));

                    // Authorization check: only the creator can delete
                    if (fahrt.getErstellerEmail() == null || !fahrt.getErstellerEmail().equals(userEmail)) {
                        System.out.println("Authorization FAILED - User not authorized to delete this fahrt");
                        return ResponseEntity.status(403).<Void>build();
                    }
                    System.out.println("Authorization SUCCESS - Deleting fahrt");
                    fahrtRepository.delete(fahrt);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

}
