package com.mycargonaut.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entity for tracking shipment/ride locations.
 * Drivers update their location, customers query the status.
 */
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tracking")
public class Tracking {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // Reference to the Fahrt (journey/ride)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fahrt_id", nullable = false)
    private Fahrt fahrt;
    
    // Reference to the driver
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "driver_id")
    private Cargonaut driver;
    
    // Tracking code for public access (customers use this to track)
    @Column(nullable = false, unique = true)
    private String trackingCode;
    
    // Current status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TrackingStatus status = TrackingStatus.WAITING;
    
    // Current location
    private Double currentLat;
    private Double currentLng;
    private String currentAddress;
    private String currentCity;
    
    // Origin location
    private Double originLat;
    private Double originLng;
    private String originAddress;
    private String originCity;
    
    // Destination location
    private Double destinationLat;
    private Double destinationLng;
    private String destinationAddress;
    private String destinationCity;
    
    // Progress and metrics
    private Double progress = 0.0;           // 0-100%
    private Double totalDistance;             // in km
    private Double coveredDistance = 0.0;     // in km
    private Double remainingDistance;         // in km
    private Integer estimatedMinutes;         // ETA in minutes
    private Double currentSpeed = 0.0;        // km/h
    private Double heading = 0.0;             // Direction in degrees
    
    // Timestamps
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime startedAt;          // When driver started the journey
    private LocalDateTime pickedUpAt;         // When cargo was picked up
    private LocalDateTime deliveredAt;        // When cargo was delivered
    
    @Column(nullable = false)
    private LocalDateTime lastUpdate;
    
    private LocalDateTime estimatedArrival;
    
    // Driver info (denormalized for quick access)
    private String driverName;
    private String driverPhone;
    private String driverVehicle;
    
    // Active tracking flag
    private Boolean isActive = true;
    
    // Notes/comments
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastUpdate = LocalDateTime.now();
        if (trackingCode == null) {
            trackingCode = generateTrackingCode();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        lastUpdate = LocalDateTime.now();
    }
    
    private String generateTrackingCode() {
        // Generate a unique tracking code like "MC-ABC123"
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder code = new StringBuilder("MC-");
        for (int i = 0; i < 6; i++) {
            code.append(chars.charAt((int) (Math.random() * chars.length())));
        }
        return code.toString();
    }
}
