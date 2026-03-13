package com.mycargonaut.backend.user;

import com.mycargonaut.backend.model.Cargonaut;
import com.mycargonaut.backend.model.Fahrt;
import com.mycargonaut.backend.repository.CargonautRepository;
import com.mycargonaut.backend.repository.FahrtRepository;
import com.mycargonaut.backend.repository.BuchungRepository;
import com.mycargonaut.backend.repository.BewertungRepository;
import com.mycargonaut.backend.user.api.UserProfileResponse;
import com.mycargonaut.backend.user.api.UserProfileStatsResponse;
import com.mycargonaut.backend.user.api.UpdateProfileRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class UserProfileService {

    private final CargonautRepository cargonautRepository;
    private final FahrtRepository fahrtRepository;
    private final BuchungRepository buchungRepository;
    private final BewertungRepository bewertungRepository;

    public UserProfileService(
            CargonautRepository cargonautRepository,
            FahrtRepository fahrtRepository,
            BuchungRepository buchungRepository,
            BewertungRepository bewertungRepository) {
        this.cargonautRepository = cargonautRepository;
        this.fahrtRepository = fahrtRepository;
        this.buchungRepository = buchungRepository;
        this.bewertungRepository = bewertungRepository;
    }

    /**
     * Get user profile by email
     */
    public UserProfileResponse getUserProfile(String email) {
        Cargonaut user = cargonautRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));

        return new UserProfileResponse(
                user.getId(),
                user.getVorname(),
                user.getNachname(),
                user.getEmail(),
                user.getHandynummer(),
                user.getStadt(),
                user.getPlz(),
                user.getBio(),
                user.getRegistriert(),
                user.isAusweisVerifiziert(),
                user.isFuehrerscheinVerifiziert(),
                user.isTelefonVerifiziert(),
                user.getProfilbild(),
                user.getSprachen()
        );
    }

    /**
     * Get user statistics
     */
    public UserProfileStatsResponse getUserStats(String email) {
        Cargonaut user = cargonautRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));

        // Count active offers (Fahrten created by this user with future dates)
        List<Fahrt> allUserFahrten = fahrtRepository.findByErstellerEmail(email);
        int activeOffers = (int) allUserFahrten.stream()
                .filter(f -> f.getDatum() != null && !f.getDatum().isBefore(LocalDate.now()))
                .count();

        // Count completed trips (past dated Fahrten)
        int completedTrips = (int) allUserFahrten.stream()
                .filter(f -> f.getDatum() != null && f.getDatum().isBefore(LocalDate.now()))
                .count();

        // Calculate earnings (sum of prices from all user's Fahrten)
        BigDecimal earnings = allUserFahrten.stream()
                .filter(f -> f.getPreis() != null)
                .map(Fahrt::getPreis)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Get average rating for this specific user (only visible reviews)
        Double avgRating = bewertungRepository.findAverageRatingForUser(user);
        double averageRating = avgRating != null ? avgRating : 0.0;

        // Get total reviews count for this specific user
        Long reviewCount = bewertungRepository.countReviewsForUser(user);
        int totalReviews = reviewCount != null ? reviewCount.intValue() : 0;

        return new UserProfileStatsResponse(
                activeOffers,
                completedTrips,
                averageRating,
                earnings,
                totalReviews,
                0 // Assuming 0 for active bookings for now, can be expanded later if queried
        );
    }

    /**
     * Update user profile
     */
    @Transactional
    public UserProfileResponse updateUserProfile(String email, UpdateProfileRequest request) {
        Cargonaut user = cargonautRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Benutzer nicht gefunden"));

        // Update fields
        boolean nameChanged = false;
        if (request.vorname() != null) {
            user.setVorname(request.vorname());
            nameChanged = true;
        }
        if (request.nachname() != null) {
            user.setNachname(request.nachname());
            nameChanged = true;
        }
        if (request.handynummer() != null) user.setHandynummer(request.handynummer());
        if (request.stadt() != null) user.setStadt(request.stadt());
        if (request.plz() != null) user.setPlz(request.plz());
        if (request.bio() != null) user.setBio(request.bio());
        
        // Update name in all existing Fahrten if name changed
        if (nameChanged) {
            String fullName = user.getVorname() + " " + user.getNachname();
            List<Fahrt> userFahrten = fahrtRepository.findAll().stream()
                    .filter(fahrt -> email.equals(fahrt.getErstellerEmail()))
                    .toList();
            
            for (Fahrt fahrt : userFahrten) {
                fahrt.setErstellerName(fullName);
                fahrtRepository.save(fahrt);
            }
        }
        
        if (request.profilbild() != null) {
            user.setProfilbild(request.profilbild());
            
            // Update avatar in all existing Fahrten created by this user
            List<Fahrt> userFahrten = fahrtRepository.findAll().stream()
                    .filter(fahrt -> email.equals(fahrt.getErstellerEmail()))
                    .toList();
            
            for (Fahrt fahrt : userFahrten) {
                fahrt.setErstellerAvatar(request.profilbild());
                fahrtRepository.save(fahrt);
            }
        }
        if (request.sprachen() != null) user.setSprachen(request.sprachen());

        Cargonaut updated = cargonautRepository.save(user);

        return new UserProfileResponse(
                updated.getId(),
                updated.getVorname(),
                updated.getNachname(),
                updated.getEmail(),
                updated.getHandynummer(),
                updated.getStadt(),
                updated.getPlz(),
                updated.getBio(),
                updated.getRegistriert(),
                updated.isAusweisVerifiziert(),
                updated.isFuehrerscheinVerifiziert(),
                updated.isTelefonVerifiziert(),
                updated.getProfilbild(),
                updated.getSprachen()
        );
    }
}
