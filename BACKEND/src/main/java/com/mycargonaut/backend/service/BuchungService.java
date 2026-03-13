package com.mycargonaut.backend.service;

import com.mycargonaut.backend.model.Buchung;
import com.mycargonaut.backend.model.Cargonaut;
import com.mycargonaut.backend.model.Fahrt;
import com.mycargonaut.backend.repository.BuchungRepository;
import com.mycargonaut.backend.repository.CargonautRepository;
import com.mycargonaut.backend.repository.FahrtRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BuchungService {

    private final BuchungRepository buchungRepository;
    private final FahrtRepository fahrtRepository;
    private final CargonautRepository cargonautRepository;
    private final NachrichtService nachrichtService;

    public BuchungService(
            BuchungRepository buchungRepository,
            FahrtRepository fahrtRepository,
            CargonautRepository cargonautRepository,
            NachrichtService nachrichtService) {
        this.buchungRepository = buchungRepository;
        this.fahrtRepository = fahrtRepository;
        this.cargonautRepository = cargonautRepository;
        this.nachrichtService = nachrichtService;
    }

    /**
     * Create a booking request (status: PENDING)
     */
    @Transactional
    public Buchung createBookingRequest(Long fahrtId, String passengerEmail, String nachricht, Integer anzahlPlaetze) {
        // Validate trip exists
        Fahrt fahrt = fahrtRepository.findById(fahrtId)
                .orElseThrow(() -> new RuntimeException("Fahrt nicht gefunden"));

        // Validate passenger exists
        Cargonaut passenger = cargonautRepository.findByEmail(passengerEmail)
                .orElseThrow(() -> new RuntimeException("Mitfahrer nicht gefunden"));

        // Check if passenger is not the trip creator
        if (fahrt.getErstellerEmail().equals(passengerEmail)) {
            throw new RuntimeException("Sie können Ihre eigene Fahrt nicht buchen");
        }

        // Check if user already has a booking for this trip
        if (buchungRepository.existsByFahrtAndMitfahrer(fahrt, passenger)) {
            throw new RuntimeException("Sie haben bereits eine Buchungsanfrage für diese Fahrt");
        }

        // Check if trip has enough free seats
        if (fahrt.getFreiePlaetze() < anzahlPlaetze) {
            throw new RuntimeException("Nicht genug freie Plätze verfügbar");
        }

        // Create booking with PENDING status
        Buchung buchung = new Buchung();
        buchung.setFahrt(fahrt);
        buchung.setMitfahrer(passenger);
        buchung.setStatus("PENDING");
        buchung.setNachricht(nachricht);
        buchung.setAnzahlPlaetze(anzahlPlaetze);

        Buchung savedBuchung = buchungRepository.save(buchung);

        // Auto-create message to trip creator about new booking request
        try {
            nachrichtService.createBookingRequestMessage(savedBuchung);
        } catch (Exception e) {
            // Log error but don't fail booking creation
            System.err.println("Failed to create booking request message: " + e.getMessage());
        }

        return savedBuchung;
    }

    /**
     * Confirm a booking request (trip creator approves)
     */
    @Transactional
    public Buchung confirmBooking(Long buchungId, String creatorEmail) {
        Buchung buchung = buchungRepository.findById(buchungId)
                .orElseThrow(() -> new RuntimeException("Buchung nicht gefunden"));

        // Verify the requester is the trip creator
        if (!buchung.getFahrt().getErstellerEmail().equals(creatorEmail)) {
            throw new RuntimeException("Nur der Ersteller der Fahrt kann Buchungen bestätigen");
        }

        // Check if booking is still pending
        if (!"PENDING".equals(buchung.getStatus())) {
            throw new RuntimeException("Diese Buchung wurde bereits bearbeitet");
        }

        // Check if trip still has enough free seats
        Fahrt fahrt = buchung.getFahrt();
        if (fahrt.getFreiePlaetze() < buchung.getAnzahlPlaetze()) {
            throw new RuntimeException("Nicht mehr genug freie Plätze verfügbar");
        }

        // Update booking status
        buchung.setStatus("CONFIRMED");
        buchung.setBestaetigtAm(LocalDateTime.now());

        // Reduce free seats in trip
        fahrt.setFreiePlaetze(fahrt.getFreiePlaetze() - buchung.getAnzahlPlaetze());
        fahrtRepository.save(fahrt);

        Buchung savedBuchung = buchungRepository.save(buchung);

        // Auto-create message to passenger about booking confirmation
        try {
            nachrichtService.createBookingConfirmedMessage(savedBuchung);
        } catch (Exception e) {
            System.err.println("Failed to create booking confirmed message: " + e.getMessage());
        }

        return savedBuchung;
    }

    /**
     * Reject a booking request (trip creator declines)
     */
    @Transactional
    public Buchung rejectBooking(Long buchungId, String creatorEmail) {
        Buchung buchung = buchungRepository.findById(buchungId)
                .orElseThrow(() -> new RuntimeException("Buchung nicht gefunden"));

        // Verify the requester is the trip creator
        if (!buchung.getFahrt().getErstellerEmail().equals(creatorEmail)) {
            throw new RuntimeException("Nur der Ersteller der Fahrt kann Buchungen ablehnen");
        }

        // Check if booking is still pending
        if (!"PENDING".equals(buchung.getStatus())) {
            throw new RuntimeException("Diese Buchung wurde bereits bearbeitet");
        }

        buchung.setStatus("REJECTED");
        Buchung savedBuchung = buchungRepository.save(buchung);

        // Auto-create message to passenger about booking rejection
        try {
            nachrichtService.createBookingRejectedMessage(savedBuchung);
        } catch (Exception e) {
            System.err.println("Failed to create booking rejected message: " + e.getMessage());
        }

        return savedBuchung;
    }

    /**
     * Cancel a confirmed booking (passenger or creator can cancel)
     */
    @Transactional
    public Buchung cancelBooking(Long buchungId, String userEmail) {
        Buchung buchung = buchungRepository.findById(buchungId)
                .orElseThrow(() -> new RuntimeException("Buchung nicht gefunden"));

        // Verify the requester is either the passenger or trip creator
        boolean isPassenger = buchung.getMitfahrer().getEmail().equals(userEmail);
        boolean isCreator = buchung.getFahrt().getErstellerEmail().equals(userEmail);

        if (!isPassenger && !isCreator) {
            throw new RuntimeException("Sie sind nicht berechtigt, diese Buchung zu stornieren");
        }

        // Can only cancel confirmed bookings
        if (!"CONFIRMED".equals(buchung.getStatus())) {
            throw new RuntimeException("Nur bestätigte Buchungen können storniert werden");
        }

        // Return seats to trip
        Fahrt fahrt = buchung.getFahrt();
        fahrt.setFreiePlaetze(fahrt.getFreiePlaetze() + buchung.getAnzahlPlaetze());
        fahrtRepository.save(fahrt);

        buchung.setStatus("CANCELLED");
        return buchungRepository.save(buchung);
    }

    /**
     * Get all pending booking requests for a trip creator
     */
    public List<Buchung> getPendingRequestsForCreator(String creatorEmail) {
        return buchungRepository.findPendingBookingRequestsForCreator(creatorEmail);
    }

    /**
     * Get all confirmed bookings for a trip creator
     */
    public List<Buchung> getConfirmedBookingsForCreator(String creatorEmail) {
        return buchungRepository.findConfirmedBookingsForCreator(creatorEmail);
    }

    /**
     * Get all bookings for a trip (for trip creator to see)
     */
    public List<Buchung> getBookingsForTrip(Long fahrtId) {
        Fahrt fahrt = fahrtRepository.findById(fahrtId)
                .orElseThrow(() -> new RuntimeException("Fahrt nicht gefunden"));
        return buchungRepository.findByFahrt(fahrt);
    }

    /**
     * Get all bookings made by a user (as passenger)
     */
    public List<Buchung> getBookingsByPassenger(String passengerEmail) {
        Cargonaut passenger = cargonautRepository.findByEmail(passengerEmail)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        return buchungRepository.findByMitfahrer(passenger);
    }

    /**
     * Get confirmed bookings by passenger
     */
    public List<Buchung> getConfirmedBookingsByPassenger(String passengerEmail) {
        Cargonaut passenger = cargonautRepository.findByEmail(passengerEmail)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));
        return buchungRepository.findByMitfahrerAndStatus(passenger, "CONFIRMED");
    }

    /**
     * Get booking by ID
     */
    public Buchung getBookingById(Long buchungId) {
        return buchungRepository.findById(buchungId)
                .orElseThrow(() -> new RuntimeException("Buchung nicht gefunden"));
    }

    /**
     * Count pending requests for a trip
     */
    public Long countPendingRequestsForTrip(Long fahrtId) {
        Fahrt fahrt = fahrtRepository.findById(fahrtId)
                .orElseThrow(() -> new RuntimeException("Fahrt nicht gefunden"));
        return buchungRepository.countPendingRequestsForTrip(fahrt);
    }
}
