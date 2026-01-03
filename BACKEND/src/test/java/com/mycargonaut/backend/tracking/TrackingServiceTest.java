package com.mycargonaut.backend.tracking;

import com.mycargonaut.backend.model.*;
import com.mycargonaut.backend.repository.*;
import com.mycargonaut.backend.service.TrackingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TrackingServiceTest {

    @Mock
    private TrackingRepository trackingRepository;

    @Mock
    private TrackingHistoryRepository historyRepository;

    @Mock
    private FahrtRepository fahrtRepository;

    @Mock
    private CargonautRepository cargonautRepository;

    @InjectMocks
    private TrackingService trackingService;

    private Fahrt testFahrt;
    private Cargonaut testDriver;
    private Tracking testTracking;

    @BeforeEach
    void setUp() {
        // Setup test driver
        testDriver = new Cargonaut();
        testDriver.setId(1L);
        testDriver.setEmail("driver@test.com");
        testDriver.setVorname("John");
        testDriver.setNachname("Driver");

        // Setup test fahrt
        testFahrt = new Fahrt();
        testFahrt.setId(1L);
        testFahrt.setStartOrt("Berlin");
        testFahrt.setZielOrt("Munich");
        testFahrt.setEntfernung("584 km");
        testFahrt.setDauer("5 Std.");
        testFahrt.setErstellerName("John Driver");

        // Setup test tracking
        testTracking = new Tracking();
        testTracking.setId(1L);
        testTracking.setFahrt(testFahrt);
        testTracking.setDriver(testDriver);
        testTracking.setTrackingCode("TRK123456");
        testTracking.setStatus(TrackingStatus.WAITING);
        testTracking.setOriginCity("Berlin");
        testTracking.setDestinationCity("Munich");
        testTracking.setCurrentCity("Berlin");
        testTracking.setTotalDistance(584.0);
        testTracking.setRemainingDistance(584.0);
        testTracking.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void testCreateTracking_Success() {
        // Given
        when(fahrtRepository.findById(1L)).thenReturn(Optional.of(testFahrt));
        when(trackingRepository.findByFahrtId(1L)).thenReturn(Optional.empty());
        when(cargonautRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(testDriver));
        when(trackingRepository.save(any(Tracking.class))).thenReturn(testTracking);

        // When
        Tracking created = trackingService.createTracking(1L, "driver@test.com");

        // Then
        assertNotNull(created);
        verify(trackingRepository).save(any(Tracking.class));
    }

    @Test
    void testCreateTracking_FahrtNotFound() {
        // Given
        when(fahrtRepository.findById(999L)).thenReturn(Optional.empty());

        // When/Then
        assertThrows(RuntimeException.class, () -> {
            trackingService.createTracking(999L, "driver@test.com");
        });
    }

    @Test
    void testCreateTracking_AlreadyExists() {
        // Given
        when(fahrtRepository.findById(1L)).thenReturn(Optional.of(testFahrt));
        when(trackingRepository.findByFahrtId(1L)).thenReturn(Optional.of(testTracking));

        // When
        Tracking tracking = trackingService.createTracking(1L, "driver@test.com");

        // Then
        assertNotNull(tracking);
        assertEquals(testTracking.getId(), tracking.getId());
        verify(trackingRepository, never()).save(any(Tracking.class));
    }

    @Test
    void testUpdateStatus_Success() {
        // Given
        Long trackingId = 1L;
        when(trackingRepository.findById(trackingId)).thenReturn(Optional.of(testTracking));
        when(trackingRepository.save(any(Tracking.class))).thenReturn(testTracking);

        // When
        Tracking updated = trackingService.updateStatus(trackingId, TrackingStatus.IN_TRANSIT, "Cargo loaded");

        // Then
        assertNotNull(updated);
        verify(trackingRepository).save(any(Tracking.class));
        verify(historyRepository).save(any(TrackingHistory.class));
    }

    @Test
    void testStartTracking_Success() {
        // Given
        Long trackingId = 1L;
        when(trackingRepository.findById(trackingId)).thenReturn(Optional.of(testTracking));
        when(trackingRepository.save(any(Tracking.class))).thenReturn(testTracking);

        // When
        Tracking started = trackingService.startTracking(trackingId, 52.5200, 13.4050, "Berlin, Germany", "Deutschland");

        // Then
        assertNotNull(started);
        verify(trackingRepository).save(any(Tracking.class));
        verify(historyRepository).save(any(TrackingHistory.class));
    }

    @Test
    void testCompleteDelivery_Success() {
        // Given
        Long trackingId = 1L;
        testTracking.setStatus(TrackingStatus.IN_TRANSIT);
        when(trackingRepository.findById(trackingId)).thenReturn(Optional.of(testTracking));
        when(trackingRepository.save(any(Tracking.class))).thenReturn(testTracking);

        // When
        Tracking completed = trackingService.completeDelivery(trackingId, "Package delivered successfully");

        // Then
        assertNotNull(completed);
        verify(trackingRepository).save(any(Tracking.class));
        verify(historyRepository).save(any(TrackingHistory.class));
    }

    @Test
    void testGetTrackingByCode_Success() {
        // Given
        String trackingCode = "TRK123456";
        when(trackingRepository.findByTrackingCode(trackingCode)).thenReturn(Optional.of(testTracking));

        // When
        Optional<Tracking> found = trackingService.getTrackingByCode(trackingCode);

        // Then
        assertTrue(found.isPresent());
        assertEquals(trackingCode, found.get().getTrackingCode());
    }

    @Test
    void testGetTrackingByCode_NotFound() {
        // Given
        String trackingCode = "INVALID";
        when(trackingRepository.findByTrackingCode(trackingCode)).thenReturn(Optional.empty());

        // When
        Optional<Tracking> found = trackingService.getTrackingByCode(trackingCode);

        // Then
        assertFalse(found.isPresent());
    }

    @Test
    void testGetTrackingByFahrtId_Success() {
        // Given
        Long fahrtId = 1L;
        when(trackingRepository.findByFahrtId(fahrtId)).thenReturn(Optional.of(testTracking));

        // When
        Optional<Tracking> found = trackingService.getTrackingByFahrtId(fahrtId);

        // Then
        assertTrue(found.isPresent());
        assertEquals(fahrtId, found.get().getFahrt().getId());
    }

    @Test
    void testUpdateLocation_Success() {
        // Given
        Long trackingId = 1L;
        Double newLat = 52.5200;
        Double newLng = 13.4050;
        when(trackingRepository.findById(trackingId)).thenReturn(Optional.of(testTracking));
        when(trackingRepository.save(any(Tracking.class))).thenReturn(testTracking);

        // When
        Tracking updated = trackingService.updateLocation(trackingId, newLat, newLng, "New Address", "New City", 80.0, 45.0);

        // Then
        assertNotNull(updated);
        verify(trackingRepository).save(any(Tracking.class));
        verify(historyRepository).save(any(TrackingHistory.class));
    }
}
