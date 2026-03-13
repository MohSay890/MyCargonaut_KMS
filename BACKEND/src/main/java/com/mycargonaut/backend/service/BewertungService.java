package com.mycargonaut.backend.service;

import com.mycargonaut.backend.model.Bewertung;
import com.mycargonaut.backend.model.Cargonaut;
import com.mycargonaut.backend.model.Fahrt;
import com.mycargonaut.backend.repository.BewertungRepository;
import com.mycargonaut.backend.repository.CargonautRepository;
import com.mycargonaut.backend.repository.FahrtRepository;
import com.mycargonaut.backend.service.PaymentService;
import com.mycargonaut.backend.model.Payment;
import com.mycargonaut.backend.model.EscrowStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class BewertungService {

    @Autowired
    private BewertungRepository bewertungRepository;
    
    @Autowired
    private FahrtRepository fahrtRepository;
    
    @Autowired
    private CargonautRepository cargonautRepository;

    @Autowired
    private PaymentService paymentService;

    /**
     * Create a new review
     * Reviews are only visible once all participants have submitted their reviews
     */
    @Transactional
    public Bewertung createReview(
            Long fahrtId,
            String verfasserEmail,
            String bewertetEmail,
            String reviewerRole,
            int sterne,
            String kommentar,
            Boolean warPuenktlich,
            Boolean hiltAbmachungen,
            Boolean fuehlteSichWohl,
            Boolean frachtUnbeschaedigt,
            Boolean gerneGenommen
    ) {
        // Get trip
        Fahrt fahrt = fahrtRepository.findById(fahrtId)
                .orElseThrow(() -> new RuntimeException("Fahrt not found"));
        
        // Check if trip is cancelled
        if ("CANCELLED".equals(fahrt.getStatus())) {
            throw new RuntimeException("Cannot review a cancelled trip");
        }
        
        // Get users
        Cargonaut verfasser = cargonautRepository.findByEmail(verfasserEmail)
                .orElseThrow(() -> new RuntimeException("Reviewer not found"));
        Cargonaut bewertet = cargonautRepository.findByEmail(bewertetEmail)
                .orElseThrow(() -> new RuntimeException("Reviewed user not found"));
        
        // Check if user already reviewed this trip
        System.out.println("Checking review duplicate for fahrt " + fahrt.getId() + " verfasser " + verfasser.getEmail());
        if (bewertungRepository.existsByFahrtAndVerfasser(fahrt, verfasser)) {
            throw new RuntimeException("You have already reviewed this trip");
        }
        
        // Create review
        Bewertung bewertung = new Bewertung();
        bewertung.setFahrt(fahrt);
        bewertung.setVerfasser(verfasser);
        bewertung.setBewertet(bewertet);
        bewertung.setReviewerRole(reviewerRole);
        bewertung.setSterne(sterne);
        bewertung.setKommentar(kommentar);
        bewertung.setWarPuenktlich(warPuenktlich);
        bewertung.setHiltAbmachungen(hiltAbmachungen);
        
        // Role-specific questions
        if ("PASSENGER".equals(reviewerRole)) {
            // Passenger rating driver
            bewertung.setFuehlteSichWohl(fuehlteSichWohl);
            bewertung.setFrachtUnbeschaedigt(frachtUnbeschaedigt);
        } else if ("DRIVER".equals(reviewerRole)) {
            // Driver rating passenger
            bewertung.setGerneGenommen(gerneGenommen);
        }
        
        // Initially not visible
        bewertung.setIstSichtbar(false);
        
        Bewertung saved = bewertungRepository.save(bewertung);
        
        // Check if all participants have now rated
        checkAndMakeReviewsVisible(fahrt);
        
        return saved;
    }

    /**
     * Check if all participants have reviewed the trip
     * If yes, make all reviews visible
     */
    @Transactional
    public void checkAndMakeReviewsVisible(Fahrt fahrt) {
        List<Bewertung> reviews = bewertungRepository.findByFahrt(fahrt);
        
        // For a trip, we need at least 2 reviews (driver <-> passenger)
        // Driver reviews passenger, passenger reviews driver
        if (reviews.size() >= 2) {
            // Check if we have both perspectives
            boolean hasDriverReview = reviews.stream()
                    .anyMatch(r -> "DRIVER".equals(r.getReviewerRole()));
            boolean hasPassengerReview = reviews.stream()
                    .anyMatch(r -> "PASSENGER".equals(r.getReviewerRole()));
            
            if (hasDriverReview && hasPassengerReview) {
                // Make all reviews visible
                reviews.forEach(review -> {
                    review.setIstSichtbar(true);
                    bewertungRepository.save(review);
                });
                
                // Update trip's average rating
                updateFahrtRating(fahrt);

                // Release Escrow payments associated with this trip
                try {
                    List<Payment> tripPayments = paymentService.getPaymentsByFahrt(fahrt.getId());
                    if (tripPayments != null) {
                        tripPayments.stream()
                            .filter(p -> p.getEscrowStatus() == EscrowStatus.HELD)
                            .forEach(p -> paymentService.releaseEscrow(p.getId()));
                    }
                } catch (Exception e) {
                    System.err.println("Failed to release escrow for trip " + fahrt.getId() + ": " + e.getMessage());
                }
            }
        }
    }

    /**
     * Update the average rating for a trip
     */
    @Transactional
    public void updateFahrtRating(Fahrt fahrt) {
        List<Bewertung> visibleReviews = bewertungRepository.findByFahrt(fahrt).stream()
                .filter(Bewertung::isIstSichtbar)
                .toList();
        
        if (!visibleReviews.isEmpty()) {
            double avgRating = visibleReviews.stream()
                    .mapToInt(Bewertung::getSterne)
                    .average()
                    .orElse(0.0);
            
            // Note: Fahrt model needs to be updated with rating field
            // For now, we calculate it on-the-fly
        }
    }

    /**
     * Get average rating for a user
     */
    public Double getAverageRatingForUser(String email) {
        Optional<Cargonaut> user = cargonautRepository.findByEmail(email);
        if (user.isEmpty()) {
            return null;
        }
        
        Double avgRating = bewertungRepository.findAverageRatingForUser(user.get());
        return avgRating != null ? avgRating : 0.0;
    }

    /**
     * Get all visible reviews for a user
     */
    public List<Bewertung> getReviewsForUser(String email) {
        Optional<Cargonaut> user = cargonautRepository.findByEmail(email);
        if (user.isEmpty()) {
            return List.of();
        }
        
        return bewertungRepository.findByBewertetAndIstSichtbar(user.get(), true);
    }

    /**
     * Get reviews for a specific trip
     */
    public List<Bewertung> getReviewsForTrip(Long fahrtId) {
        Fahrt fahrt = fahrtRepository.findById(fahrtId)
                .orElseThrow(() -> new RuntimeException("Fahrt not found"));
        
        // Only return visible reviews
        return bewertungRepository.findByFahrt(fahrt).stream()
                .filter(Bewertung::isIstSichtbar)
                .toList();
    }

    /**
     * Check if user has already reviewed a trip
     */
    public boolean hasUserReviewedTrip(Long fahrtId, String userEmail) {
        Optional<Fahrt> fahrt = fahrtRepository.findById(fahrtId);
        Optional<Cargonaut> user = cargonautRepository.findByEmail(userEmail);
        
        if (fahrt.isEmpty() || user.isEmpty()) {
            return false;
        }
        
        return bewertungRepository.existsByFahrtAndVerfasser(fahrt.get(), user.get());
    }

    /**
     * Get pending reviews for a user (trips they need to review)
     */
    public List<Fahrt> getPendingReviewsForUser(String userEmail) {
        // This would require querying trips where user is a participant
        // and hasn't reviewed yet
        // Implementation depends on your Fahrt model structure
        return List.of();
    }

    /**
     * Calculate review statistics for a user
     */
    public ReviewStats getReviewStatsForUser(String email) {
        Optional<Cargonaut> user = cargonautRepository.findByEmail(email);
        if (user.isEmpty()) {
            return new ReviewStats(0.0, 0L, 0, 0);
        }
        
        Cargonaut cargonaut = user.get();
        Double avgRating = bewertungRepository.findAverageRatingForUser(cargonaut);
        Long totalReviews = bewertungRepository.countReviewsForUser(cargonaut);
        
        List<Bewertung> driverReviews = bewertungRepository.findDriverReviews(cargonaut);
        List<Bewertung> passengerReviews = bewertungRepository.findPassengerReviews(cargonaut);
        
        return new ReviewStats(
                avgRating != null ? avgRating : 0.0,
                totalReviews,
                driverReviews.size(),
                passengerReviews.size()
        );
    }

    /**
     * Inner class for review statistics
     */
    public static class ReviewStats {
        private final Double averageRating;
        private final Long totalReviews;
        private final int reviewsAsDriver;
        private final int reviewsAsPassenger;

        public ReviewStats(Double averageRating, Long totalReviews, int reviewsAsDriver, int reviewsAsPassenger) {
            this.averageRating = averageRating;
            this.totalReviews = totalReviews;
            this.reviewsAsDriver = reviewsAsDriver;
            this.reviewsAsPassenger = reviewsAsPassenger;
        }

        public Double getAverageRating() { return averageRating; }
        public Long getTotalReviews() { return totalReviews; }
        public int getReviewsAsDriver() { return reviewsAsDriver; }
        public int getReviewsAsPassenger() { return reviewsAsPassenger; }
    }
}
