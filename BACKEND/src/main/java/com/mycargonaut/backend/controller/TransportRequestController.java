package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.model.TransportRequest;
import com.mycargonaut.backend.repository.TransportRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "*")
public class TransportRequestController {

    @Autowired
    private TransportRequestRepository requestRepository;

    /**
     * GET all transport requests
     */
    @GetMapping
    public List<TransportRequest> getAllRequests() {
        return requestRepository.findByStatus("ACTIVE");
    }

    /**
     * GET transport request by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<TransportRequest> getRequestById(@PathVariable Long id) {
        return requestRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET my transport requests (by email)
     */
    @GetMapping("/meine")
    public List<TransportRequest> getMyRequests(@RequestParam String email) {
        return requestRepository.findByErstellerEmail(email);
    }

    /**
     * POST - Create new transport request
     */
    @PostMapping
    public ResponseEntity<TransportRequest> createRequest(@RequestBody TransportRequest request) {
        TransportRequest savedRequest = requestRepository.save(request);
        return ResponseEntity.ok(savedRequest);
    }

    /**
     * PUT - Update transport request
     */
    @PutMapping("/{id}")
    public ResponseEntity<TransportRequest> updateRequest(
            @PathVariable Long id,
            @RequestBody TransportRequest requestDetails) {
        return requestRepository.findById(id)
                .map(request -> {
                    request.setStartOrt(requestDetails.getStartOrt());
                    request.setZielOrt(requestDetails.getZielOrt());
                    request.setDatum(requestDetails.getDatum());
                    request.setUhrzeit(requestDetails.getUhrzeit());
                    request.setBeschreibung(requestDetails.getBeschreibung());
                    request.setAbmessungen(requestDetails.getAbmessungen());
                    request.setGewicht(requestDetails.getGewicht());
                    request.setKategorie(requestDetails.getKategorie());
                    request.setMaxPreis(requestDetails.getMaxPreis());
                    request.setAbholadresse(requestDetails.getAbholadresse());
                    request.setLieferadresse(requestDetails.getLieferadresse());
                    request.setExtras(requestDetails.getExtras());
                    request.setEntfernung(requestDetails.getEntfernung());
                    request.setDauer(requestDetails.getDauer());
                    
                    if (requestDetails.getErstellerName() != null) {
                        request.setErstellerName(requestDetails.getErstellerName());
                    }
                    if (requestDetails.getErstellerEmail() != null) {
                        request.setErstellerEmail(requestDetails.getErstellerEmail());
                    }
                    if (requestDetails.getErstellerAvatar() != null) {
                        request.setErstellerAvatar(requestDetails.getErstellerAvatar());
                    }
                    
                    return ResponseEntity.ok(requestRepository.save(request));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE - Remove transport request (with authorization)
     */
    @DeleteMapping("/{id}/authorized")
    public ResponseEntity<Void> deleteRequestAuthorized(
            @PathVariable Long id,
            @RequestParam String userEmail) {
        return requestRepository.findById(id)
                .map(request -> {
                    // Authorization check
                    if (request.getErstellerEmail() == null || 
                        !request.getErstellerEmail().equals(userEmail)) {
                        return ResponseEntity.status(403).<Void>build();
                    }
                    requestRepository.delete(request);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET - Search transport requests
     */
    @GetMapping("/suche")
    public List<TransportRequest> searchRequests(
            @RequestParam String start,
            @RequestParam String ziel,
            @RequestParam(required = false) LocalDate datum,
            @RequestParam(required = false) BigDecimal maxPreis,
            @RequestParam(required = false) String kategorie) {
        
        return requestRepository.searchRequests(start, ziel, datum, maxPreis, kategorie);
    }
}
