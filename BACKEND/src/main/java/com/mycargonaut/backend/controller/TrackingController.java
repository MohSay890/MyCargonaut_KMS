package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.model.Tracking;
import com.mycargonaut.backend.model.TrackingHistory;
import com.mycargonaut.backend.model.TrackingStatus;
import com.mycargonaut.backend.service.TrackingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for tracking operations.
 * 
 * Driver endpoints: Create tracking, update location, update status
 * Customer endpoints: Query tracking by code
 */
@RestController
@RequestMapping("/api/tracking")
@CrossOrigin(origins = "http://localhost:4200")
public class TrackingController {
    
    private final TrackingService trackingService;
    
    public TrackingController(TrackingService trackingService) {
        this.trackingService = trackingService;
    }
    
    // ========== Customer Endpoints ==========
    
    /**
     * Query tracking status by tracking code (public endpoint)
     * GET /api/tracking/code/{trackingCode}
     */
    @GetMapping("/code/{trackingCode}")
    public ResponseEntity<TrackingResponse> getTrackingByCode(@PathVariable String trackingCode) {
        return trackingService.getTrackingByCode(trackingCode)
                .map(tracking -> ResponseEntity.ok(TrackingResponse.fromTracking(tracking)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Query tracking status by Fahrt ID
     * GET /api/tracking/fahrt/{fahrtId}
     */
    @GetMapping("/fahrt/{fahrtId}")
    public ResponseEntity<TrackingResponse> getTrackingByFahrtId(@PathVariable Long fahrtId) {
        return trackingService.getTrackingByFahrtId(fahrtId)
                .map(tracking -> ResponseEntity.ok(TrackingResponse.fromTracking(tracking)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get tracking by ID
     * GET /api/tracking/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<TrackingResponse> getTracking(@PathVariable Long id) {
        return trackingService.getTracking(id)
                .map(tracking -> ResponseEntity.ok(TrackingResponse.fromTracking(tracking)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get tracking history
     * GET /api/tracking/{id}/history
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<List<TrackingHistory>> getTrackingHistory(@PathVariable Long id) {
        return ResponseEntity.ok(trackingService.getTrackingHistory(id));
    }
    
    // ========== Driver Endpoints ==========
    
    /**
     * Create a new tracking session for a Fahrt
     * POST /api/tracking
     * Body: { "fahrtId": 1, "driverEmail": "driver@example.com" }
     */
    @PostMapping
    public ResponseEntity<TrackingResponse> createTracking(@RequestBody CreateTrackingRequest request) {
        try {
            Tracking tracking = trackingService.createTracking(request.fahrtId, request.driverEmail);
            return ResponseEntity.ok(TrackingResponse.fromTracking(tracking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Get all trackings for a driver
     * GET /api/tracking/driver?email={email}
     */
    @GetMapping("/driver")
    public ResponseEntity<List<TrackingResponse>> getDriverTrackings(@RequestParam String email) {
        List<Tracking> trackings = trackingService.getTrackingsForDriver(email);
        List<TrackingResponse> responses = trackings.stream()
                .map(TrackingResponse::fromTracking)
                .toList();
        return ResponseEntity.ok(responses);
    }
    
    /**
     * Get all active trackings
     * GET /api/tracking/active
     */
    @GetMapping("/active")
    public ResponseEntity<List<TrackingResponse>> getActiveTrackings() {
        List<Tracking> trackings = trackingService.getAllActiveTrackings();
        List<TrackingResponse> responses = trackings.stream()
                .map(TrackingResponse::fromTracking)
                .toList();
        return ResponseEntity.ok(responses);
    }
    
    /**
     * Driver starts tracking (begins journey)
     * POST /api/tracking/{id}/start
     * Body: { "lat": 52.52, "lng": 13.405, "address": "...", "city": "Berlin" }
     */
    @PostMapping("/{id}/start")
    public ResponseEntity<TrackingResponse> startTracking(
            @PathVariable Long id,
            @RequestBody LocationUpdate location) {
        try {
            Tracking tracking = trackingService.startTracking(
                id, location.lat, location.lng, location.address, location.city
            );
            return ResponseEntity.ok(TrackingResponse.fromTracking(tracking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Set destination coordinates
     * POST /api/tracking/{id}/destination
     * Body: { "lat": 53.55, "lng": 10.0, "address": "...", "city": "Hamburg" }
     */
    @PostMapping("/{id}/destination")
    public ResponseEntity<TrackingResponse> setDestination(
            @PathVariable Long id,
            @RequestBody LocationUpdate location) {
        try {
            Tracking tracking = trackingService.setDestination(
                id, location.lat, location.lng, location.address, location.city
            );
            return ResponseEntity.ok(TrackingResponse.fromTracking(tracking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Driver updates their current location
     * PUT /api/tracking/{id}/location
     * Body: { "lat": 52.8, "lng": 11.5, "address": "...", "city": "...", "speed": 80, "heading": 45 }
     */
    @PutMapping("/{id}/location")
    public ResponseEntity<TrackingResponse> updateLocation(
            @PathVariable Long id,
            @RequestBody LocationUpdate location) {
        try {
            Tracking tracking = trackingService.updateLocation(
                id, location.lat, location.lng, location.address, location.city,
                location.speed, location.heading
            );
            return ResponseEntity.ok(TrackingResponse.fromTracking(tracking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Driver updates location by tracking code
     * PUT /api/tracking/code/{trackingCode}/location
     */
    @PutMapping("/code/{trackingCode}/location")
    public ResponseEntity<TrackingResponse> updateLocationByCode(
            @PathVariable String trackingCode,
            @RequestBody LocationUpdate location) {
        try {
            Tracking tracking = trackingService.updateLocationByCode(
                trackingCode, location.lat, location.lng, location.address, location.city,
                location.speed, location.heading
            );
            return ResponseEntity.ok(TrackingResponse.fromTracking(tracking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Driver updates status
     * PUT /api/tracking/{id}/status
     * Body: { "status": "IN_TRANSIT", "note": "Optional note" }
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<TrackingResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdate statusUpdate) {
        try {
            TrackingStatus status = TrackingStatus.valueOf(statusUpdate.status.toUpperCase());
            Tracking tracking = trackingService.updateStatus(id, status, statusUpdate.note);
            return ResponseEntity.ok(TrackingResponse.fromTracking(tracking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Mark delivery as complete
     * POST /api/tracking/{id}/complete
     * Body: { "note": "Delivered to reception" }
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<TrackingResponse> completeDelivery(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String note = body != null ? body.get("note") : null;
            Tracking tracking = trackingService.completeDelivery(id, note);
            return ResponseEntity.ok(TrackingResponse.fromTracking(tracking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // ========== Request/Response DTOs ==========
    
    public static class CreateTrackingRequest {
        public Long fahrtId;
        public String driverEmail;
    }
    
    public static class LocationUpdate {
        public Double lat;
        public Double lng;
        public String address;
        public String city;
        public Double speed;
        public Double heading;
    }
    
    public static class StatusUpdate {
        public String status;
        public String note;
    }
    
    /**
     * Response DTO to hide internal details and format data for frontend
     */
    public static class TrackingResponse {
        public Long id;
        public String trackingCode;
        public Long fahrtId;
        public String status;
        public String statusLabel;
        public String statusIcon;
        
        // Current location
        public Double currentLat;
        public Double currentLng;
        public String currentAddress;
        public String currentCity;
        
        // Origin & Destination
        public String originCity;
        public String destinationCity;
        public Double originLat;
        public Double originLng;
        public Double destinationLat;
        public Double destinationLng;
        
        // Progress
        public Double progress;
        public Double totalDistance;
        public Double coveredDistance;
        public Double remainingDistance;
        public Integer estimatedMinutes;
        public Double currentSpeed;
        public Double heading;
        
        // Timestamps
        public String createdAt;
        public String startedAt;
        public String pickedUpAt;
        public String deliveredAt;
        public String lastUpdate;
        public String estimatedArrival;
        
        // Driver info
        public String driverName;
        public String driverPhone;
        public String driverVehicle;
        
        public Boolean isActive;
        public String notes;
        
        public static TrackingResponse fromTracking(Tracking t) {
            TrackingResponse r = new TrackingResponse();
            r.id = t.getId();
            r.trackingCode = t.getTrackingCode();
            r.fahrtId = t.getFahrt() != null ? t.getFahrt().getId() : null;
            r.status = t.getStatus().name();
            r.statusLabel = t.getStatus().getLabel();
            r.statusIcon = t.getStatus().getIcon();
            
            r.currentLat = t.getCurrentLat();
            r.currentLng = t.getCurrentLng();
            r.currentAddress = t.getCurrentAddress();
            r.currentCity = t.getCurrentCity();
            
            r.originCity = t.getOriginCity();
            r.destinationCity = t.getDestinationCity();
            r.originLat = t.getOriginLat();
            r.originLng = t.getOriginLng();
            r.destinationLat = t.getDestinationLat();
            r.destinationLng = t.getDestinationLng();
            
            r.progress = t.getProgress();
            r.totalDistance = t.getTotalDistance();
            r.coveredDistance = t.getCoveredDistance();
            r.remainingDistance = t.getRemainingDistance();
            r.estimatedMinutes = t.getEstimatedMinutes();
            r.currentSpeed = t.getCurrentSpeed();
            r.heading = t.getHeading();
            
            r.createdAt = t.getCreatedAt() != null ? t.getCreatedAt().toString() : null;
            r.startedAt = t.getStartedAt() != null ? t.getStartedAt().toString() : null;
            r.pickedUpAt = t.getPickedUpAt() != null ? t.getPickedUpAt().toString() : null;
            r.deliveredAt = t.getDeliveredAt() != null ? t.getDeliveredAt().toString() : null;
            r.lastUpdate = t.getLastUpdate() != null ? t.getLastUpdate().toString() : null;
            r.estimatedArrival = t.getEstimatedArrival() != null ? t.getEstimatedArrival().toString() : null;
            
            r.driverName = t.getDriverName();
            r.driverPhone = t.getDriverPhone();
            r.driverVehicle = t.getDriverVehicle();
            
            r.isActive = t.getIsActive();
            r.notes = t.getNotes();
            
            return r;
        }
    }
}
