package com.mycargonaut.backend.controller;

import com.mycargonaut.backend.dto.LocationUpdateMessage;
import com.mycargonaut.backend.model.Tracking;
import com.mycargonaut.backend.model.TrackingHistory;
import com.mycargonaut.backend.repository.TrackingHistoryRepository;
import com.mycargonaut.backend.repository.TrackingRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.time.LocalDateTime;

@Controller
public class LocationController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private TrackingRepository trackingRepository;

    @Autowired
    private TrackingHistoryRepository trackingHistoryRepository;

    // Use standard SRID 4326 for WGS84 coordinates
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    /**
     * Drivers send their location to /app/tracking/update
     */
    @MessageMapping("/tracking/update")
    @Transactional
    public void processLocationUpdate(@Payload LocationUpdateMessage message, Principal principal) {
        if (principal == null) {
            // Unauthenticated connection
            return;
        }

        // Ideally verify the user (principal.getName()) is the driver of message.getFahrtId()
        Tracking tracking = trackingRepository.findByFahrtId(message.getFahrtId()).orElse(null);
        
        if (tracking != null && tracking.getIsActive()) {
            
            // Generate PostGIS Point representing current location
            Point actualLocation = geometryFactory.createPoint(new Coordinate(message.getLongitude(), message.getLatitude()));

            // Update main Tracking entity
            tracking.setCurrentLocation(actualLocation);
            tracking.setCurrentLat(message.getLatitude()); // Fallback / legacy 
            tracking.setCurrentLng(message.getLongitude()); // Fallback / legacy
            tracking.setCurrentSpeed(message.getSpeed());
            tracking.setHeading(message.getHeading());
            tracking.setLastUpdate(LocalDateTime.now());
            
            trackingRepository.save(tracking);

            // Add point to history tracking
            TrackingHistory history = new TrackingHistory();
            history.setTracking(tracking);
            history.setLocation(actualLocation);
            history.setLat(message.getLatitude());
            history.setLng(message.getLongitude());
            history.setSpeed(message.getSpeed());
            history.setHeading(message.getHeading());
            history.setStatus(tracking.getStatus());
            history.setTimestamp(LocalDateTime.now());

            trackingHistoryRepository.save(history);

            // Broadcast the location update to all subscribers looking at this Fahrt/trip
            messagingTemplate.convertAndSend("/topic/trip/" + message.getFahrtId(), message);
        }
    }
}
