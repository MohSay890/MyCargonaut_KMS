import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TrackingService, TrackingData, LocationUpdate } from './tracking.service';

describe('TrackingService', () => {
  let service: TrackingService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8080/api/tracking';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TrackingService]
    });
    service = TestBed.inject(TrackingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createTracking', () => {
    it('should create tracking session', () => {
      const mockResponse: TrackingData = {
        id: 1,
        trackingCode: 'MC-TEST01',
        fahrtId: 123,
        status: 'WAITING',
        statusLabel: 'Warten',
        statusIcon: '⏳',
        currentLat: null,
        currentLng: null,
        currentAddress: null,
        currentCity: null,
        originCity: 'Berlin',
        destinationCity: 'Munich',
        originLat: null,
        originLng: null,
        destinationLat: null,
        destinationLng: null,
        progress: 0,
        totalDistance: 0,
        coveredDistance: 0,
        remainingDistance: 0,
        estimatedMinutes: 0,
        currentSpeed: 0,
        heading: 0,
        createdAt: new Date().toISOString(),
        startedAt: null,
        pickedUpAt: null,
        deliveredAt: null,
        lastUpdate: new Date().toISOString(),
        estimatedArrival: null,
        driverName: 'Test Driver',
        driverPhone: '123456789',
        driverVehicle: 'Van',
        isActive: true,
        notes: null
      };

      service.createTracking(123, 'test@example.com').subscribe(session => {
        expect(session).toBeTruthy();
        expect(session.trackingCode).toBeTruthy();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('getTrackingByCode', () => {
    it('should fetch tracking by code', () => {
      const mockResponse: TrackingData = {
        id: 1,
        trackingCode: 'MC-TEST01',
        fahrtId: 123,
        status: 'IN_TRANSIT',
        statusLabel: 'Unterwegs',
        statusIcon: '🚚',
        currentLat: 50.1109,
        currentLng: 8.6821,
        currentAddress: 'Frankfurt',
        currentCity: 'Frankfurt',
        originCity: 'Berlin',
        destinationCity: 'Munich',
        originLat: 52.52,
        originLng: 13.405,
        destinationLat: 48.1351,
        destinationLng: 11.582,
        progress: 50,
        totalDistance: 500,
        coveredDistance: 250,
        remainingDistance: 250,
        estimatedMinutes: 120,
        currentSpeed: 80,
        heading: 180,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        pickedUpAt: new Date().toISOString(),
        deliveredAt: null,
        lastUpdate: new Date().toISOString(),
        estimatedArrival: new Date(Date.now() + 120 * 60000).toISOString(),
        driverName: 'Test Driver',
        driverPhone: '123456789',
        driverVehicle: 'Van',
        isActive: true,
        notes: null
      };

      service.getTrackingByCode('MC-TEST01').subscribe(session => {
        expect(session).toBeTruthy();
        expect(session.trackingCode).toBe('MC-TEST01');
      });

      const req = httpMock.expectOne(`${apiUrl}/code/MC-TEST01`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getTracking', () => {
    it('should fetch tracking by ID', () => {
      const mockResponse: TrackingData = {
        id: 1,
        trackingCode: 'MC-TEST01',
        fahrtId: 123,
        status: 'IN_TRANSIT',
        statusLabel: 'Unterwegs',
        statusIcon: '🚚',
        currentLat: 50.1109,
        currentLng: 8.6821,
        currentAddress: null,
        currentCity: null,
        originCity: 'Berlin',
        destinationCity: 'Munich',
        originLat: null,
        originLng: null,
        destinationLat: null,
        destinationLng: null,
        progress: 0,
        totalDistance: 0,
        coveredDistance: 0,
        remainingDistance: 0,
        estimatedMinutes: 0,
        currentSpeed: 0,
        heading: 0,
        createdAt: new Date().toISOString(),
        startedAt: null,
        pickedUpAt: null,
        deliveredAt: null,
        lastUpdate: new Date().toISOString(),
        estimatedArrival: null,
        driverName: 'Test Driver',
        driverPhone: '123456789',
        driverVehicle: 'Van',
        isActive: true,
        notes: null
      };

      service.getTracking(1).subscribe(session => {
        expect(session).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('updateLocation', () => {
    it('should update driver location', () => {
      const mockResponse: TrackingData = {
        id: 1,
        trackingCode: 'MC-TEST01',
        fahrtId: 123,
        status: 'IN_TRANSIT',
        statusLabel: 'Unterwegs',
        statusIcon: '🚚',
        currentLat: 50.1109,
        currentLng: 8.6821,
        currentAddress: null,
        currentCity: null,
        originCity: 'Berlin',
        destinationCity: 'Munich',
        originLat: null,
        originLng: null,
        destinationLat: null,
        destinationLng: null,
        progress: 0,
        totalDistance: 0,
        coveredDistance: 0,
        remainingDistance: 0,
        estimatedMinutes: 0,
        currentSpeed: 0,
        heading: 0,
        createdAt: new Date().toISOString(),
        startedAt: null,
        pickedUpAt: null,
        deliveredAt: null,
        lastUpdate: new Date().toISOString(),
        estimatedArrival: null,
        driverName: 'Test Driver',
        driverPhone: '123456789',
        driverVehicle: 'Van',
        isActive: true,
        notes: null
      };

      const location: LocationUpdate = {
        lat: 50.1109,
        lng: 8.6821
      };

      service.updateLocation(1, location).subscribe(session => {
        expect(session).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiUrl}/1/location`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('updateStatus', () => {
    it('should update tracking status', () => {
      const mockResponse: TrackingData = {
        id: 1,
        trackingCode: 'MC-TEST01',
        fahrtId: 123,
        status: 'PICKED_UP',
        statusLabel: 'Abgeholt',
        statusIcon: '📦',
        currentLat: null,
        currentLng: null,
        currentAddress: null,
        currentCity: null,
        originCity: 'Berlin',
        destinationCity: 'Munich',
        originLat: null,
        originLng: null,
        destinationLat: null,
        destinationLng: null,
        progress: 0,
        totalDistance: 0,
        coveredDistance: 0,
        remainingDistance: 0,
        estimatedMinutes: 0,
        currentSpeed: 0,
        heading: 0,
        createdAt: new Date().toISOString(),
        startedAt: null,
        pickedUpAt: new Date().toISOString(),
        deliveredAt: null,
        lastUpdate: new Date().toISOString(),
        estimatedArrival: null,
        driverName: 'Test Driver',
        driverPhone: '123456789',
        driverVehicle: 'Van',
        isActive: true,
        notes: null
      };

      service.updateStatus(1, 'PICKED_UP').subscribe(session => {
        expect(session).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiUrl}/1/status`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('completeDelivery', () => {
    it('should complete delivery', () => {
      const mockResponse: TrackingData = {
        id: 1,
        trackingCode: 'MC-TEST01',
        fahrtId: 123,
        status: 'DELIVERED',
        statusLabel: 'Zugestellt',
        statusIcon: '✅',
        currentLat: null,
        currentLng: null,
        currentAddress: null,
        currentCity: null,
        originCity: 'Berlin',
        destinationCity: 'Munich',
        originLat: null,
        originLng: null,
        destinationLat: null,
        destinationLng: null,
        progress: 100,
        totalDistance: 500,
        coveredDistance: 500,
        remainingDistance: 0,
        estimatedMinutes: 0,
        currentSpeed: 0,
        heading: 0,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        pickedUpAt: new Date().toISOString(),
        deliveredAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        estimatedArrival: null,
        driverName: 'Test Driver',
        driverPhone: '123456789',
        driverVehicle: 'Van',
        isActive: false,
        notes: null
      };

      service.completeDelivery(1).subscribe(session => {
        expect(session).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiUrl}/1/complete`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('Polling', () => {
    it('should stop polling', () => {
      service.startPolling(1, 1000);
      service.stopPolling();

      service.isPolling$.subscribe(isPolling => {
        expect(isPolling).toBe(false);
      });
    });
  });

  describe('Demo Mode', () => {
    it('should create demo session', () => {
      const demoSession = service.createDemoSession(1);

      expect(demoSession).toBeTruthy();
      expect(demoSession.trackingCode).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      service.getTrackingByCode('INVALID').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/code/INVALID`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });
});
