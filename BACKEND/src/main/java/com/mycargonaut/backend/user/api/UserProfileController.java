package com.mycargonaut.backend.user.api;

import com.mycargonaut.backend.user.UserProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:4200")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    /**
     * GET /api/profile/{email} - Get user profile
     */
    @GetMapping("/{email}")
    public ResponseEntity<?> getUserProfile(@PathVariable String email) {
        try {
            UserProfileResponse profile = userProfileService.getUserProfile(email);
            return ResponseEntity.ok(profile);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * GET /api/profile/{email}/stats - Get user statistics
     */
    @GetMapping("/{email}/stats")
    public ResponseEntity<?> getUserStats(@PathVariable String email) {
        try {
            UserProfileStatsResponse stats = userProfileService.getUserStats(email);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * PUT /api/profile/{email} - Update user profile
     */
    @PutMapping("/{email}")
    public ResponseEntity<?> updateUserProfile(
            @PathVariable String email,
            @RequestBody UpdateProfileRequest request) {
        try {
            UserProfileResponse updated = userProfileService.updateUserProfile(email, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
