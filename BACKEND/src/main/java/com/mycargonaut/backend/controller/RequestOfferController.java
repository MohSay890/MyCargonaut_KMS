package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.model.RequestOffer;
import com.mycargonaut.backend.repository.RequestOfferRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/request-offers")
@CrossOrigin(origins = "*")
public class RequestOfferController {

    private final RequestOfferRepository offerRepository;

    public RequestOfferController(RequestOfferRepository offerRepository) {
        this.offerRepository = offerRepository;
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
            
            // Reject all other offers for this request
            List<RequestOffer> otherOffers = offerRepository.findByRequestIdOrderByErstelltAmDesc(offer.getRequestId());
            for (RequestOffer other : otherOffers) {
                if (!other.getId().equals(id) && "PENDING".equals(other.getStatus())) {
                    other.setStatus("REJECTED");
                    other.setBeantwortetAm(LocalDate.now());
                    offerRepository.save(other);
                }
            }
            
            return ResponseEntity.ok(offer);
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
