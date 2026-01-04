package com.mycargonaut.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entity for storing tracking location history.
 * Each time a driver updates their location, a new entry is created.
 */
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tracking_history")
public class TrackingHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tracking_id", nullable = false)
    private Tracking tracking;
    
    // Location at this point
    private Double lat;
    private Double lng;
    private String address;
    private String city;
    
    // Metrics at this point
    private Double speed;
    private Double heading;
    private Double progress;
    
    // Status at this point
    @Enumerated(EnumType.STRING)
    private TrackingStatus status;
    
    // Timestamp
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    // Optional note for this update
    private String note;
    
    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
