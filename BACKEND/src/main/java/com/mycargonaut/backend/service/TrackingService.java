package com.mycargonaut.backend.service;

import com.mycargonaut.backend.model.*;
import com.mycargonaut.backend.repository.*;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TrackingService {
    
    private final TrackingRepository trackingRepository;
    private final TrackingHistoryRepository historyRepository;
    private final FahrtRepository fahrtRepository;
    private final CargonautRepository cargonautRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    
    public TrackingService(TrackingRepository trackingRepository,
                          TrackingHistoryRepository historyRepository,
                          FahrtRepository fahrtRepository,
                          CargonautRepository cargonautRepository,
                          PaymentRepository paymentRepository,
                          @Lazy PaymentService paymentService) {
        this.trackingRepository = trackingRepository;
        this.historyRepository = historyRepository;
        this.fahrtRepository = fahrtRepository;
        this.cargonautRepository = cargonautRepository;
        this.paymentRepository = paymentRepository;
        this.paymentService = paymentService;
    }
    
    /**
     * Create a new tracking session for a Fahrt
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Tracking createTracking(Long fahrtId, String driverEmail) {
        Fahrt fahrt = fahrtRepository.findById(fahrtId)
                .orElseThrow(() -> new RuntimeException("Fahrt not found: " + fahrtId));
        
        // Check if tracking already exists for this Fahrt
        Optional<Tracking> existing = trackingRepository.findByFahrtId(fahrtId);
        if (existing.isPresent()) {
            return existing.get();
        }
        
        Tracking tracking = new Tracking();
        tracking.setFahrt(fahrt);
        
        // Set driver if email provided
        if (driverEmail != null) {
            cargonautRepository.findByEmail(driverEmail).ifPresent(driver -> {
                tracking.setDriver(driver);
                tracking.setDriverName(driver.getVorname() + " " + driver.getNachname());
            });
        }
        
        // Set origin and destination from Fahrt
        tracking.setOriginCity(fahrt.getStartOrt());
        tracking.setDestinationCity(fahrt.getZielOrt());
        tracking.setCurrentCity(fahrt.getStartOrt());
        
        // Set approximate coordinates for simulation (geocoding would be better in production)
        setApproximateCoordinates(tracking, fahrt.getStartOrt(), fahrt.getZielOrt());
        
        // Set driver info from Fahrt creator
        if (tracking.getDriverName() == null) {
            tracking.setDriverName(fahrt.getErstellerName());
        }
        
        // Parse distance if available
        if (fahrt.getEntfernung() != null) {
            try {
                String dist = fahrt.getEntfernung().replaceAll("[^0-9.]", "");
                tracking.setTotalDistance(Double.parseDouble(dist));
                tracking.setRemainingDistance(Double.parseDouble(dist));
            } catch (NumberFormatException e) {
                tracking.setTotalDistance(100.0); // Default
                tracking.setRemainingDistance(100.0);
            }
        } else {
            tracking.setTotalDistance(100.0);
            tracking.setRemainingDistance(100.0);
        }
        
        // Parse duration for ETA
        if (fahrt.getDauer() != null) {
            try {
                String dur = fahrt.getDauer().replaceAll("[^0-9]", "");
                tracking.setEstimatedMinutes(Integer.parseInt(dur) * 60); // Hours to minutes
            } catch (NumberFormatException e) {
                tracking.setEstimatedMinutes(120); // Default 2 hours
            }
        } else {
            tracking.setEstimatedMinutes(120);
        }
        
        tracking.setStatus(TrackingStatus.WAITING);
        tracking.setProgress(0.0);
        tracking.setIsActive(true);
        
        return trackingRepository.save(tracking);
    }
    
    /**
     * Get tracking by ID
     */
    public Optional<Tracking> getTracking(Long id) {
        return trackingRepository.findById(id);
    }
    
    /**
     * Get tracking by tracking code (for customers)
     */
    public Optional<Tracking> getTrackingByCode(String trackingCode) {
        return trackingRepository.findByTrackingCode(trackingCode.toUpperCase());
    }
    
    /**
     * Get tracking by Fahrt ID
     */
    public Optional<Tracking> getTrackingByFahrtId(Long fahrtId) {
        return trackingRepository.findByFahrtId(fahrtId);
    }
    
    /**
     * Get all trackings for a driver
     */
    public List<Tracking> getTrackingsForDriver(String driverEmail) {
        return trackingRepository.findByDriverEmail(driverEmail);
    }
    
    /**
     * Get active trackings for a driver
     */
    public List<Tracking> getActiveTrackingsForDriver(Long driverId) {
        return trackingRepository.findActiveByDriverId(driverId);
    }
    
    /**
     * Driver updates their location
     */
    public Tracking updateLocation(Long trackingId, Double lat, Double lng, 
                                   String address, String city,
                                   Double speed, Double heading) {
        Tracking tracking = trackingRepository.findById(trackingId)
                .orElseThrow(() -> new RuntimeException("Tracking not found: " + trackingId));
        
        // Update current location
        tracking.setCurrentLat(lat);
        tracking.setCurrentLng(lng);
        tracking.setCurrentAddress(address);
        tracking.setCurrentCity(city);
        tracking.setCurrentSpeed(speed != null ? speed : 0.0);
        tracking.setHeading(heading != null ? heading : 0.0);
        
        // Calculate progress based on distance if we have coordinates
        if (tracking.getOriginLat() != null && tracking.getDestinationLat() != null) {
            double totalDist = haversineDistance(
                tracking.getOriginLat(), tracking.getOriginLng(),
                tracking.getDestinationLat(), tracking.getDestinationLng()
            );
            double remainingDist = haversineDistance(
                lat, lng,
                tracking.getDestinationLat(), tracking.getDestinationLng()
            );
            double progress = Math.max(0, Math.min(100, (1 - remainingDist / totalDist) * 100));
            tracking.setProgress(progress);
            tracking.setCoveredDistance(totalDist - remainingDist);
            tracking.setRemainingDistance(remainingDist);
        }
        
        // Update ETA
        if (speed != null && speed > 0 && tracking.getRemainingDistance() != null) {
            int etaMinutes = (int) (tracking.getRemainingDistance() / speed * 60);
            tracking.setEstimatedMinutes(etaMinutes);
            tracking.setEstimatedArrival(LocalDateTime.now().plusMinutes(etaMinutes));
        }
        
        // Auto-update status based on progress
        updateStatusByProgress(tracking);
        
        // Save history
        saveHistory(tracking);
        
        return trackingRepository.save(tracking);
    }
    
    /**
     * Driver updates their location by tracking code
     */
    public Tracking updateLocationByCode(String trackingCode, Double lat, Double lng,
                                         String address, String city,
                                         Double speed, Double heading) {
        Tracking tracking = trackingRepository.findByTrackingCode(trackingCode.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Tracking not found: " + trackingCode));
        return updateLocation(tracking.getId(), lat, lng, address, city, speed, heading);
    }
    
    /**
     * Driver manually updates status
     */
    public Tracking updateStatus(Long trackingId, TrackingStatus status, String note) {
        Tracking tracking = trackingRepository.findById(trackingId)
                .orElseThrow(() -> new RuntimeException("Tracking not found: " + trackingId));
        
        TrackingStatus oldStatus = tracking.getStatus();
        tracking.setStatus(status);
        tracking.setNotes(note);
        
        // Set timestamps based on status
        switch (status) {
            case PICKED_UP:
                if (tracking.getPickedUpAt() == null) {
                    tracking.setPickedUpAt(LocalDateTime.now());
                }
                if (tracking.getStartedAt() == null) {
                    tracking.setStartedAt(LocalDateTime.now());
                }
                if (tracking.getFahrt() != null && "ACTIVE".equals(tracking.getFahrt().getStatus())) {
                    tracking.getFahrt().setStatus("IN_PROGRESS");
                    fahrtRepository.save(tracking.getFahrt());
                }
                break;
            case IN_TRANSIT:
                if (tracking.getStartedAt() == null) {
                    tracking.setStartedAt(LocalDateTime.now());
                }
                if (tracking.getFahrt() != null && "ACTIVE".equals(tracking.getFahrt().getStatus())) {
                    tracking.getFahrt().setStatus("IN_PROGRESS");
                    fahrtRepository.save(tracking.getFahrt());
                }
                break;
            case DELIVERED:
                tracking.setDeliveredAt(LocalDateTime.now());
                tracking.setProgress(100.0);
                tracking.setRemainingDistance(0.0);
                tracking.setIsActive(false);

                // Update Fahrt status to COMPLETED
                if (tracking.getFahrt() != null) {
                    Fahrt fahrt = tracking.getFahrt();
                    fahrt.setStatus("COMPLETED");
                    fahrtRepository.save(fahrt);
                }

                // Note: Escrow release is handled exclusively by BewertungService (Dual-Review Phase 1)
                break;
            case CANCELLED:
                tracking.setIsActive(false);
                break;
            default:
                break;
        }
        
        // Save history entry for status change
        if (oldStatus != status) {
            saveHistory(tracking);
        }
        
        return trackingRepository.save(tracking);
    }
    
    /**
     * Start tracking (driver begins journey)
     */
    public Tracking startTracking(Long trackingId, Double lat, Double lng, String address, String city) {
        Tracking tracking = trackingRepository.findById(trackingId)
                .orElseThrow(() -> new RuntimeException("Tracking not found: " + trackingId));
        
        tracking.setStartedAt(LocalDateTime.now());
        tracking.setOriginLat(lat);
        tracking.setOriginLng(lng);
        tracking.setOriginAddress(address);
        tracking.setOriginCity(city != null ? city : tracking.getOriginCity());
        tracking.setCurrentLat(lat);
        tracking.setCurrentLng(lng);
        tracking.setCurrentAddress(address);
        tracking.setCurrentCity(city != null ? city : tracking.getCurrentCity());
        tracking.setStatus(TrackingStatus.PICKED_UP);
        tracking.setPickedUpAt(LocalDateTime.now());
        
        saveHistory(tracking);
        
        return trackingRepository.save(tracking);
    }
    
    /**
     * Set destination coordinates
     */
    public Tracking setDestination(Long trackingId, Double lat, Double lng, String address, String city) {
        Tracking tracking = trackingRepository.findById(trackingId)
                .orElseThrow(() -> new RuntimeException("Tracking not found: " + trackingId));
        
        tracking.setDestinationLat(lat);
        tracking.setDestinationLng(lng);
        tracking.setDestinationAddress(address);
        tracking.setDestinationCity(city != null ? city : tracking.getDestinationCity());
        
        // Recalculate distance if origin is set
        if (tracking.getOriginLat() != null) {
            double dist = haversineDistance(
                tracking.getOriginLat(), tracking.getOriginLng(),
                lat, lng
            );
            tracking.setTotalDistance(dist);
            tracking.setRemainingDistance(dist);
        }
        
        return trackingRepository.save(tracking);
    }
    
    /**
     * Complete delivery
     */
    public Tracking completeDelivery(Long trackingId, String note) {
        return updateStatus(trackingId, TrackingStatus.DELIVERED, note);
    }
    
    /**
     * Get tracking history
     */
    public List<TrackingHistory> getTrackingHistory(Long trackingId) {
        return historyRepository.findByTrackingIdOrderByTimestampDesc(trackingId);
    }
    
    /**
     * Get all active trackings
     */
    public List<Tracking> getAllActiveTrackings() {
        return trackingRepository.findByIsActiveTrue();
    }
    
    // Private helper methods
    
    private void updateStatusByProgress(Tracking tracking) {
        double progress = tracking.getProgress();
        TrackingStatus currentStatus = tracking.getStatus();
        
        // Don't change if delivered or cancelled
        if (currentStatus == TrackingStatus.DELIVERED || currentStatus == TrackingStatus.CANCELLED) {
            return;
        }
        
        if (progress >= 100) {
            tracking.setStatus(TrackingStatus.DELIVERED);
            tracking.setDeliveredAt(LocalDateTime.now());
            tracking.setIsActive(false);
        } else if (progress >= 90) {
            tracking.setStatus(TrackingStatus.NEAR_DESTINATION);
        } else if (progress > 5) {
            tracking.setStatus(TrackingStatus.IN_TRANSIT);
        } else if (progress > 0 || tracking.getStartedAt() != null) {
            tracking.setStatus(TrackingStatus.PICKED_UP);
        }
    }
    
    private void saveHistory(Tracking tracking) {
        TrackingHistory history = new TrackingHistory();
        history.setTracking(tracking);
        history.setLat(tracking.getCurrentLat());
        history.setLng(tracking.getCurrentLng());
        history.setAddress(tracking.getCurrentAddress());
        history.setCity(tracking.getCurrentCity());
        history.setSpeed(tracking.getCurrentSpeed());
        history.setHeading(tracking.getHeading());
        history.setProgress(tracking.getProgress());
        history.setStatus(tracking.getStatus());
        history.setTimestamp(LocalDateTime.now());
        historyRepository.save(history);
    }
    
    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    private double haversineDistance(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371; // Earth's radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    /**
     * Set approximate coordinates based on city names
     * In production, this should use a geocoding API
     */
    private void setApproximateCoordinates(Tracking tracking, String startCity, String destCity) {
        // Set origin coordinates
        double[] originCoords = getCityCoordinates(startCity);
        tracking.setOriginLat(originCoords[0]);
        tracking.setOriginLng(originCoords[1]);
        tracking.setCurrentLat(originCoords[0]);
        tracking.setCurrentLng(originCoords[1]);
        
        // Set destination coordinates
        double[] destCoords = getCityCoordinates(destCity);
        tracking.setDestinationLat(destCoords[0]);
        tracking.setDestinationLng(destCoords[1]);
    }
    
    /**
     * Get approximate coordinates for common German cities
     * Returns [latitude, longitude]
     */
    private double[] getCityCoordinates(String city) {
        if (city == null) return new double[]{50.0, 10.0}; // Center of Germany
        
        String cityLower = city.toLowerCase();
        
        // Common German cities
        if (cityLower.contains("berlin")) return new double[]{52.5200, 13.4050};
        if (cityLower.contains("hamburg")) return new double[]{53.5511, 9.9937};
        if (cityLower.contains("münchen") || cityLower.contains("munich")) return new double[]{48.1351, 11.5820};
        if (cityLower.contains("köln") || cityLower.contains("cologne")) return new double[]{50.9375, 6.9603};
        if (cityLower.contains("frankfurt")) return new double[]{50.1109, 8.6821};
        if (cityLower.contains("stuttgart")) return new double[]{48.7758, 9.1829};
        if (cityLower.contains("düsseldorf")) return new double[]{51.2277, 6.7735};
        if (cityLower.contains("dortmund")) return new double[]{51.5136, 7.4653};
        if (cityLower.contains("essen")) return new double[]{51.4556, 7.0116};
        if (cityLower.contains("leipzig")) return new double[]{51.3397, 12.3731};
        if (cityLower.contains("bremen")) return new double[]{53.0793, 8.8017};
        if (cityLower.contains("dresden")) return new double[]{51.0504, 13.7373};
        if (cityLower.contains("hannover")) return new double[]{52.3759, 9.7320};
        if (cityLower.contains("nürnberg") || cityLower.contains("nuremberg")) return new double[]{49.4521, 11.0767};
        if (cityLower.contains("duisburg")) return new double[]{51.4344, 6.7623};
        if (cityLower.contains("bochum")) return new double[]{51.4818, 7.2162};
        if (cityLower.contains("wuppertal")) return new double[]{51.2562, 7.1508};
        if (cityLower.contains("bielefeld")) return new double[]{52.0302, 8.5325};
        if (cityLower.contains("bonn")) return new double[]{50.7374, 7.0982};
        if (cityLower.contains("münster")) return new double[]{51.9607, 7.6261};
        if (cityLower.contains("karlsruhe")) return new double[]{49.0069, 8.4037};
        if (cityLower.contains("mannheim")) return new double[]{49.4875, 8.4660};
        if (cityLower.contains("augsburg")) return new double[]{48.3705, 10.8978};
        if (cityLower.contains("wiesbaden")) return new double[]{50.0826, 8.2400};
        if (cityLower.contains("gießen") || cityLower.contains("giessen")) return new double[]{50.5841, 8.6783};
        if (cityLower.contains("bad homburg") || cityLower.contains("humburg")) return new double[]{50.2269, 8.6176};
        
        // Default to center of Germany if city not found
        return new double[]{50.0, 10.0};
    }
}
