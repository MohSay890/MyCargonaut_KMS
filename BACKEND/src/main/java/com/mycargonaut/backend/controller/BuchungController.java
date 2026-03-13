package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.model.Buchung;
import com.mycargonaut.backend.service.BuchungService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/buchungen")
@CrossOrigin(origins = "http://localhost:4200")
public class BuchungController {

    private final BuchungService buchungService;

    public BuchungController(BuchungService buchungService) {
        this.buchungService = buchungService;
    }

    /**
     * Create a booking request (PENDING status)
     * POST /api/buchungen/request
     */
    @PostMapping("/request")
    public ResponseEntity<?> createBookingRequest(@RequestBody BookingRequestDto request) {
        try {
            Buchung buchung = buchungService.createBookingRequest(
                    request.fahrtId(),
                    request.passengerEmail(),
                    request.nachricht(),
                    request.anzahlPlaetze() != null ? request.anzahlPlaetze() : 1
            );
            return ResponseEntity.ok(buchung);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Confirm a booking request (trip creator approves)
     * POST /api/buchungen/{id}/confirm
     */
    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirmBooking(@PathVariable Long id, @RequestParam String creatorEmail) {
        try {
            Buchung buchung = buchungService.confirmBooking(id, creatorEmail);
            return ResponseEntity.ok(buchung);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Reject a booking request (trip creator declines)
     * POST /api/buchungen/{id}/reject
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectBooking(@PathVariable Long id, @RequestParam String creatorEmail) {
        try {
            Buchung buchung = buchungService.rejectBooking(id, creatorEmail);
            return ResponseEntity.ok(buchung);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Cancel a confirmed booking
     * POST /api/buchungen/{id}/cancel
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id, @RequestParam String userEmail) {
        try {
            Buchung buchung = buchungService.cancelBooking(id, userEmail);
            return ResponseEntity.ok(buchung);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all pending booking requests for a trip creator
     * GET /api/buchungen/pending?creatorEmail=xxx
     */
    @GetMapping("/pending")
    public ResponseEntity<List<Buchung>> getPendingRequests(@RequestParam String creatorEmail) {
        List<Buchung> requests = buchungService.getPendingRequestsForCreator(creatorEmail);
        return ResponseEntity.ok(requests);
    }

    /**
     * Get all confirmed bookings for a trip creator
     * GET /api/buchungen/creator/confirmed?creatorEmail=xxx
     */
    @GetMapping("/creator/confirmed")
    public ResponseEntity<List<Buchung>> getConfirmedBookingsForCreator(@RequestParam String creatorEmail) {
        List<Buchung> requests = buchungService.getConfirmedBookingsForCreator(creatorEmail);
        return ResponseEntity.ok(requests);
    }

    /**
     * Get all bookings for a specific trip
     * GET /api/buchungen/trip/{fahrtId}
     */
    @GetMapping("/trip/{fahrtId}")
    public ResponseEntity<List<Buchung>> getBookingsForTrip(@PathVariable Long fahrtId) {
        List<Buchung> bookings = buchungService.getBookingsForTrip(fahrtId);
        return ResponseEntity.ok(bookings);
    }

    /**
     * Get all bookings made by a user (as passenger)
     * GET /api/buchungen/passenger?email=xxx
     */
    @GetMapping("/passenger")
    public ResponseEntity<List<Buchung>> getBookingsByPassenger(@RequestParam String email) {
        List<Buchung> bookings = buchungService.getBookingsByPassenger(email);
        return ResponseEntity.ok(bookings);
    }

    /**
     * Get confirmed bookings by passenger
     * GET /api/buchungen/passenger/confirmed?email=xxx
     */
    @GetMapping("/passenger/confirmed")
    public ResponseEntity<List<Buchung>> getConfirmedBookingsByPassenger(@RequestParam String email) {
        List<Buchung> bookings = buchungService.getConfirmedBookingsByPassenger(email);
        return ResponseEntity.ok(bookings);
    }

    /**
     * Get booking by ID
     * GET /api/buchungen/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable Long id) {
        try {
            Buchung buchung = buchungService.getBookingById(id);
            return ResponseEntity.ok(buchung);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Count pending requests for a trip
     * GET /api/buchungen/trip/{fahrtId}/pending-count
     */
    @GetMapping("/trip/{fahrtId}/pending-count")
    public ResponseEntity<Long> countPendingRequestsForTrip(@PathVariable Long fahrtId) {
        Long count = buchungService.countPendingRequestsForTrip(fahrtId);
        return ResponseEntity.ok(count);
    }

    /**
     * DTO for booking request
     */
    public record BookingRequestDto(
            Long fahrtId,
            String passengerEmail,
            String nachricht,
            Integer anzahlPlaetze
    ) {}
}
