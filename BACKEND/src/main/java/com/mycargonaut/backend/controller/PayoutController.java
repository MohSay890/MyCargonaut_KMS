package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.model.Payout;
import com.mycargonaut.backend.service.PayoutService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payouts")
@CrossOrigin(origins = "*")
public class PayoutController {

    @Autowired
    private PayoutService payoutService;

    /**
     * Get all payouts for a driver
     */
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<Payout>> getPayoutsByDriver(@PathVariable Long driverId) {
        List<Payout> payouts = payoutService.getPayoutsByDriver(driverId);
        return ResponseEntity.ok(payouts);
    }

    /**
     * Get single payout by ID
     */
    @GetMapping("/{payoutId}")
    public ResponseEntity<?> getPayoutById(@PathVariable Long payoutId) {
        return payoutService.getPayoutById(payoutId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Cancel a payout
     */
    @PostMapping("/{payoutId}/cancel")
    public ResponseEntity<?> cancelPayout(@PathVariable Long payoutId, @RequestParam String reason) {
        try {
            Payout cancelled = payoutService.cancelPayout(payoutId, reason);
            return ResponseEntity.ok(cancelled);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Manually trigger payout processing (admin only)
     */
    @PostMapping("/process-scheduled")
    public ResponseEntity<?> processScheduledPayouts() {
        payoutService.processScheduledPayouts();
        return ResponseEntity.ok("Payout processing initiated");
    }
}
