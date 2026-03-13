package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.model.RequestOffer;
import com.mycargonaut.backend.model.TransportRequest;
import com.mycargonaut.backend.model.Fahrt;
import com.mycargonaut.backend.model.Buchung;
import com.mycargonaut.backend.model.Cargonaut;
import com.mycargonaut.backend.repository.RequestOfferRepository;
import com.mycargonaut.backend.repository.TransportRequestRepository;
import com.mycargonaut.backend.repository.FahrtRepository;
import com.mycargonaut.backend.repository.BuchungRepository;
import com.mycargonaut.backend.repository.CargonautRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/request-offers")
@CrossOrigin(origins = "*")
public class RequestOfferController {

    private final RequestOfferRepository offerRepository;
    private final TransportRequestRepository requestRepository;
    private final FahrtRepository fahrtRepository;
    private final BuchungRepository buchungRepository;
    private final CargonautRepository cargonautRepository;

    public RequestOfferController(
            RequestOfferRepository offerRepository,
            TransportRequestRepository requestRepository,
            FahrtRepository fahrtRepository,
            BuchungRepository buchungRepository,
            CargonautRepository cargonautRepository) {
        this.offerRepository = offerRepository;
        this.requestRepository = requestRepository;
        this.fahrtRepository = fahrtRepository;
        this.buchungRepository = buchungRepository;
        this.cargonautRepository = cargonautRepository;
    }

    // Neues Angebot für eine Anfrage erstellen
    @PostMapping
    public ResponseEntity<?> createOffer(@RequestBody RequestOffer offer) {
        try {
            offer.setErstelltAm(LocalDate.now());
            offer.setStatus("PENDING");
            
            RequestOffer savedOffer = offerRepository.save(offer);
            return ResponseEntity.ok(savedOffer);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Fehler beim Erstellen des Angebots: " + e.getMessage());
        }
    }

    // Alle Angebote für eine Anfrage holen
    @GetMapping("/request/{requestId}")
    public ResponseEntity<List<RequestOffer>> getOffersByRequest(@PathVariable Long requestId) {
        List<RequestOffer> offers = offerRepository.findByRequestIdOrderByErstelltAmDesc(requestId);
        return ResponseEntity.ok(offers);
    }

    // Angebote eines Fahrers abrufen
    @GetMapping("/driver")
    public ResponseEntity<List<RequestOffer>> getOffersByDriver(@RequestParam String email) {
        List<RequestOffer> offers = offerRepository.findByDriverEmailOrderByErstelltAmDesc(email);
        return ResponseEntity.ok(offers);
    }

    // Angebote, die an die Anfragen eines Nutzers gesendet wurden
    @GetMapping("/user/{userEmail}/offers-received")
    public ResponseEntity<List<RequestOffer>> getOffersReceived(@PathVariable String userEmail) {
        List<TransportRequest> requests = requestRepository.findByErstellerEmail(userEmail);
        List<Long> requestIds = requests.stream().map(TransportRequest::getId).toList();
        if (requestIds.isEmpty()) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        List<RequestOffer> offers = offerRepository.findByRequestIdInOrderByErstelltAmDesc(requestIds);
        return ResponseEntity.ok(offers);
    }

    // Einzelnes Angebot abrufen
    @GetMapping("/{id}")
    public ResponseEntity<?> getOfferById(@PathVariable Long id) {
        return offerRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // Angebot akzeptieren (nur für Anfragesteller)
    @PutMapping("/{id}/accept")
    public ResponseEntity<?> acceptOffer(
            @PathVariable Long id,
            @RequestParam String userEmail) {
        
        try {
            RequestOffer offer = offerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Angebot nicht gefunden"));
            
            // TODO: Add authorization check - verify userEmail owns the request
            
            offer.setStatus("ACCEPTED");
            offer.setBeantwortetAm(LocalDate.now());
            offerRepository.save(offer);

            // 1. Fetch the original TransportRequest and close it
            TransportRequest request = requestRepository.findById(offer.getRequestId())
                .orElseThrow(() -> new RuntimeException("TransportRequest nicht gefunden"));
            request.setStatus("MATCHED");
            requestRepository.save(request);

            // 2. Generate a new Fahrt based on TransportRequest and Offer
            Fahrt fahrt = new Fahrt();
            fahrt.setStartOrt(request.getStartOrt());
            fahrt.setZielOrt(request.getZielOrt());
            fahrt.setAbholadresse(request.getAbholadresse());
            fahrt.setLieferadresse(request.getLieferadresse());
            fahrt.setDatum(request.getDatum());
            fahrt.setUhrzeit(request.getUhrzeit());
            fahrt.setKategorie(request.getKategorie());
            fahrt.setBeschreibung(request.getBeschreibung() != null ? request.getBeschreibung() : "Transportfahrt aus Anfrage");
            fahrt.setAbmessungen(request.getAbmessungen());
            fahrt.setEntfernung(request.getEntfernung());
            fahrt.setDauer(request.getDauer());
            fahrt.setExtras(request.getExtras());
            fahrt.setPreis(offer.getAngebotspreis());
            
            // Map weight to freiePlaetze (Max. Gewicht)
            if (request.getGewicht() != null) {
                fahrt.setFreiePlaetze(request.getGewicht().intValue());
            } else {
                fahrt.setFreiePlaetze(0); 
            }
            
            fahrt.setStatus("BOOKED"); // Hide from active generic search

            Cargonaut driver = cargonautRepository.findByEmail(offer.getDriverEmail())
                .orElse(null);
                
            fahrt.setErstellerName(driver != null ? driver.getVorname() + (driver.getNachname() != null ? " " + driver.getNachname() : "") : offer.getDriverName());
            fahrt.setErstellerEmail(offer.getDriverEmail());
            fahrt.setErstellerAvatar(driver != null && driver.getProfilbild() != null ? driver.getProfilbild() : offer.getDriverAvatar());

            // Set vehicle details from driver's active vehicle
            if (driver != null && driver.getFahrzeuge() != null && !driver.getFahrzeuge().isEmpty()) {
                com.mycargonaut.backend.model.Fahrzeug activeVehicle = driver.getFahrzeuge().stream()
                    .filter(com.mycargonaut.backend.model.Fahrzeug::isIstAktiv)
                    .findFirst()
                    .orElse(driver.getFahrzeuge().get(0));
                
                fahrt.setFahrzeug(activeVehicle);
                fahrt.setFahrzeugTyp(activeVehicle.getTyp());
                fahrt.setFahrzeugModell(activeVehicle.getMarke() + " " + activeVehicle.getModell());
                fahrt.setLadekapazitaet(activeVehicle.getKapazitaet() + " m³");
            } else {
                fahrt.setFahrzeugTyp(offer.getFahrzeugtyp());
                fahrt.setFahrzeugModell(offer.getFahrzeugmarke());
                // Default capacity
                fahrt.setLadekapazitaet("Nicht spezifiziert");
            }

            fahrt.setFahrer(driver);

            Fahrt savedFahrt = fahrtRepository.save(fahrt);
            
            // Map the matched Fahrt back to the Request so frontend doesn't mix IDs
            request.setFahrtId(savedFahrt.getId());
            requestRepository.save(request);

            // 3. Auto-Booking: Generate an approved Buchung
            Buchung buchung = new Buchung();
            buchung.setFahrt(savedFahrt);
            
            Cargonaut passenger = cargonautRepository.findByEmail(userEmail)
                .orElse(null);
            buchung.setMitfahrer(passenger);
            buchung.setStatus("CONFIRMED"); // Pre-approved since the user accepted the offer
            buchung.setBestaetigtAm(java.time.LocalDateTime.now());
            buchung.setAnzahlPlaetze(1);
            buchung.setPaymentRequired(true);
            buchung.setIsPaid(false);
            buchung.setNachricht("Auto-generated booking from accepted Transport Request & Offer");

            buchungRepository.save(buchung);

            // Reject all other offers for this request
            List<RequestOffer> otherOffers = offerRepository.findByRequestIdOrderByErstelltAmDesc(offer.getRequestId());
            for (RequestOffer other : otherOffers) {
                if (!other.getId().equals(id) && "PENDING".equals(other.getStatus())) {
                    other.setStatus("REJECTED");
                    other.setBeantwortetAm(LocalDate.now());
                    offerRepository.save(other);
                }
            }

            return ResponseEntity.ok(java.util.Map.of("offer", offer, "fahrtId", savedFahrt.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Fehler beim Akzeptieren des Angebots: " + e.getMessage());
        }
    }

    // Angebot ablehnen (nur für Anfragesteller)
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectOffer(
            @PathVariable Long id,
            @RequestParam String userEmail) {
        
        try {
            RequestOffer offer = offerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Angebot nicht gefunden"));
            
            // TODO: Add authorization check - verify userEmail owns the request
            
            offer.setStatus("REJECTED");
            offer.setBeantwortetAm(LocalDate.now());
            offerRepository.save(offer);
            
            return ResponseEntity.ok(offer);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Fehler beim Ablehnen des Angebots: " + e.getMessage());
        }
    }

    // Angebot löschen (nur eigene, solange noch PENDING)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOffer(
            @PathVariable Long id,
            @RequestParam String driverEmail) {
        
        try {
            RequestOffer offer = offerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Angebot nicht gefunden"));
            
            // Verify driver owns this offer
            if (!offer.getDriverEmail().equals(driverEmail)) {
                return ResponseEntity.status(403).body("Nicht autorisiert");
            }
            
            // Can only delete pending offers
            if (!"PENDING".equals(offer.getStatus())) {
                return ResponseEntity.badRequest().body("Nur ausstehende Angebote können gelöscht werden");
            }
            
            offerRepository.delete(offer);
            return ResponseEntity.ok("Angebot gelöscht");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Fehler beim Löschen des Angebots: " + e.getMessage());
        }
    }
}
