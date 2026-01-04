package com.mycargonaut.backend.repository;

import com.mycargonaut.backend.model.TrackingHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TrackingHistoryRepository extends JpaRepository<TrackingHistory, Long> {
    
    // Find all history for a tracking session
    List<TrackingHistory> findByTrackingIdOrderByTimestampDesc(Long trackingId);
    
    // Find history within a time range
    @Query("SELECT h FROM TrackingHistory h WHERE h.tracking.id = :trackingId " +
           "AND h.timestamp BETWEEN :startTime AND :endTime ORDER BY h.timestamp ASC")
    List<TrackingHistory> findByTrackingIdAndTimeRange(
            @Param("trackingId") Long trackingId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
    
    // Get the last N history entries
    @Query("SELECT h FROM TrackingHistory h WHERE h.tracking.id = :trackingId ORDER BY h.timestamp DESC LIMIT :limit")
    List<TrackingHistory> findRecentByTrackingId(@Param("trackingId") Long trackingId, @Param("limit") int limit);
    
    // Delete old history (for cleanup)
    void deleteByTimestampBefore(LocalDateTime beforeTime);
}
