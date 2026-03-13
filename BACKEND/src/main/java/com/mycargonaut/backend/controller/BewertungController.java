package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.model.Bewertung;
import com.mycargonaut.backend.service.BewertungService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bewertungen")
@CrossOrigin(origins = "http://localhost:4200")
public class BewertungController {

    @Autowired
    private BewertungService bewertungService;

    /**
     * POST /api/bewertungen - Create a new review
     */
    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody CreateReviewRequest request) {
        try {
            Bewertung bewertung = bewertungService.createReview(
                    request.fahrtId(),
                    request.verfasserEmail(),
                    request.bewertetEmail(),
                    request.reviewerRole(),
                    request.sterne(),
                    request.kommentar(),
                    request.warPuenktlich(),
                    request.hiltAbmachungen(),
                    request.fuehlteSichWohl(),
                    request.frachtUnbeschaedigt(),
                    request.gerneGenommen()
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(bewertung);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/bewertungen/user/{email} - Get all reviews for a user
     */
    @GetMapping("/user/{email}")
    public ResponseEntity<List<Bewertung>> getReviewsForUser(@PathVariable String email) {
        List<Bewertung> reviews = bewertungService.getReviewsForUser(email);
        return ResponseEntity.ok(reviews);
    }

    /**
     * GET /api/bewertungen/user/{email}/average - Get average rating for a user
     */
    @GetMapping("/user/{email}/average")
    public ResponseEntity<Map<String, Object>> getAverageRating(@PathVariable String email) {
        Double avgRating = bewertungService.getAverageRatingForUser(email);
        Map<String, Object> response = new HashMap<>();
        response.put("email", email);
        response.put("averageRating", avgRating != null ? avgRating : 0.0);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/bewertungen/user/{email}/stats - Get review statistics for a user
     */
    @GetMapping("/user/{email}/stats")
    public ResponseEntity<BewertungService.ReviewStats> getReviewStats(@PathVariable String email) {
        BewertungService.ReviewStats stats = bewertungService.getReviewStatsForUser(email);
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/bewertungen/trip/{fahrtId} - Get all reviews for a trip
     */
    @GetMapping("/trip/{fahrtId}")
    public ResponseEntity<List<Bewertung>> getReviewsForTrip(@PathVariable Long fahrtId) {
        try {
            List<Bewertung> reviews = bewertungService.getReviewsForTrip(fahrtId);
            return ResponseEntity.ok(reviews);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/bewertungen/trip/{fahrtId}/has-reviewed - Check if user has reviewed trip
     */
    @GetMapping("/trip/{fahrtId}/has-reviewed")
    public ResponseEntity<Map<String, Boolean>> hasUserReviewed(
            @PathVariable Long fahrtId,
            @RequestParam String userEmail) {
        boolean hasReviewed = bewertungService.hasUserReviewedTrip(fahrtId, userEmail);
        return ResponseEntity.ok(Map.of("hasReviewed", hasReviewed));
    }

    /**
     * Request DTO for creating a review
     */
    public record CreateReviewRequest(
            Long fahrtId,
            String verfasserEmail,
            String bewertetEmail,
            String reviewerRole, // "DRIVER" or "PASSENGER"
            int sterne,
            String kommentar,
            Boolean warPuenktlich,
            Boolean hiltAbmachungen,
            Boolean fuehlteSichWohl,
            Boolean frachtUnbeschaedigt,
            Boolean gerneGenommen
    ) {}
}
