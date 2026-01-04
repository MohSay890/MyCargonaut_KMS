package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.Tracking;
import com.mycargonaut.backend.model.TrackingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrackingRepository extends JpaRepository<Tracking, Long> {
    
    // Find by tracking code (for customer queries)
    Optional<Tracking> findByTrackingCode(String trackingCode);
    
    // Find by Fahrt ID
    Optional<Tracking> findByFahrtId(Long fahrtId);
    
    // Find all trackings for a driver
    @Query("SELECT t FROM Tracking t WHERE t.driver.id = :driverId ORDER BY t.lastUpdate DESC")
    List<Tracking> findByDriverId(@Param("driverId") Long driverId);
    
    // Find all trackings by driver email
    @Query("SELECT t FROM Tracking t WHERE t.driver.email = :email ORDER BY t.lastUpdate DESC")
    List<Tracking> findByDriverEmail(@Param("email") String email);
    
    // Find active trackings for a driver
    @Query("SELECT t FROM Tracking t WHERE t.driver.id = :driverId AND t.isActive = true ORDER BY t.lastUpdate DESC")
    List<Tracking> findActiveByDriverId(@Param("driverId") Long driverId);
    
    // Find trackings by status
    List<Tracking> findByStatus(TrackingStatus status);
    
    // Find active trackings
    List<Tracking> findByIsActiveTrue();
    
    // Check if tracking code exists
    boolean existsByTrackingCode(String trackingCode);
    
    // Find trackings for a specific journey by Fahrt
    @Query("SELECT t FROM Tracking t WHERE t.fahrt.erstellerEmail = :email ORDER BY t.lastUpdate DESC")
    List<Tracking> findByFahrtCreatorEmail(@Param("email") String email);
}
