import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, interval, of, throwError } from 'rxjs';
import { takeUntil, map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ========== Interfaces ==========

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
}

export interface TrackingStatus {
  code: string;
  label: string;
  icon: string;
  color: string;
}

export interface TrackingData {
  id: number;
  trackingCode: string;
  fahrtId: number;
  status: string;
  statusLabel: string;
  statusIcon: string;

  // Current location
  currentLat: number | null;
  currentLng: number | null;
  currentAddress: string | null;
  currentCity: string | null;

  // Origin & Destination
  originCity: string;
  destinationCity: string;
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;

  // Progress
  progress: number;
  totalDistance: number;
  coveredDistance: number;
  remainingDistance: number;
  estimatedMinutes: number;
  currentSpeed: number;
  heading: number;

  // Timestamps
  createdAt: string;
  startedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  lastUpdate: string;
  estimatedArrival: string | null;

  // Driver info
  driverName: string;
  driverPhone: string;
  driverVehicle: string;

  isActive: boolean;
  notes: string | null;
}

export interface TrackingSession {
  id: string;
  trackingCode: string;
  fahrtId: number;
  driverName: string;
  driverPhone: string;
  vehicleType: string;

  origin: GeoLocation;
  destination: GeoLocation;
  currentLocation: GeoLocation | null;

  status: TrackingStatus;
  progress: number;
  totalDistance: number;
  coveredDistance: number;
  remainingDistance: number;
  estimatedMinutes: number;
  currentSpeed: number;
  heading: number;

  startTime: Date | null;
  estimatedArrival: Date | null;
  lastUpdate: Date;

  isActive: boolean;
  isLive: boolean;
}

export interface TrackingNotification {
  id: string;
  type: 'status_change' | 'location_update' | 'arrival' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  icon: string;
  read: boolean;
}

export interface LocationUpdate {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  speed?: number;
  heading?: number;
}

// Status color mapping
const STATUS_COLORS: { [key: string]: string } = {
  'WAITING': '#6b7280',
  'PICKED_UP': '#3b82f6',
  'IN_TRANSIT': '#f59e0b',
  'NEAR_DESTINATION': '#8b5cf6',
  'DELIVERED': '#10b981',
  'CANCELLED': '#ef4444'
};

@Injectable({
  providedIn: 'root'
})
export class TrackingService implements OnDestroy {
  private apiUrl = `${environment.apiUrl}/tracking`;

  // State management
  private currentSessionSubject = new BehaviorSubject<TrackingSession | null>(null);
  private notificationsSubject = new BehaviorSubject<TrackingNotification[]>([]);
  private isPollingSubject = new BehaviorSubject<boolean>(false);

  // Polling control
  private stopPolling$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  // For driver simulation mode
  private simulationStop$ = new Subject<void>();
  private isSimulating = false;

  constructor(private http: HttpClient) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopPolling();
    this.stopSimulation();
  }

  // ========== Public Observables ==========

  get currentSession$(): Observable<TrackingSession | null> {
    return this.currentSessionSubject.asObservable();
  }

  get notifications$(): Observable<TrackingNotification[]> {
    return this.notificationsSubject.asObservable();
  }

  get isPolling$(): Observable<boolean> {
    return this.isPollingSubject.asObservable();
  }

  // ========== Customer Methods (Query Status) ==========

  /**
   * Get tracking by tracking code (for customers)
   */
  getTrackingByCode(trackingCode: string): Observable<TrackingSession> {
    return this.http.get<TrackingData>(`${this.apiUrl}/code/${trackingCode}`).pipe(
      map(data => this.mapToSession(data)),
      tap(session => {
        this.currentSessionSubject.next(session);
        this.addNotification({
          type: 'status_change',
          title: 'Tracking geladen',
          message: `Status: ${session.status.label}`,
          icon: session.status.icon
        });
      }),
      catchError(err => {
        this.addNotification({
          type: 'error',
          title: 'Tracking nicht gefunden',
          message: 'Der Tracking-Code ist ungültig.',
          icon: '❌'
        });
        return throwError(() => err);
      })
    );
  }

  /**
   * Get tracking by Fahrt ID
   */
  getTrackingByFahrtId(fahrtId: number): Observable<TrackingSession> {
    return this.http.get<TrackingData>(`${this.apiUrl}/fahrt/${fahrtId}`).pipe(
      map(data => this.mapToSession(data)),
      tap(session => this.currentSessionSubject.next(session)),
      catchError(err => {
        // If not found, return null (tracking might not exist yet)
        if (err.status === 404) {
          return of(null as any);
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Get tracking by ID
   */
  getTracking(id: number): Observable<TrackingSession> {
    return this.http.get<TrackingData>(`${this.apiUrl}/${id}`).pipe(
      map(data => this.mapToSession(data)),
      tap(session => this.currentSessionSubject.next(session))
    );
  }

  /**
   * Start polling for updates (for customers watching tracking)
   */
  startPolling(trackingId: number, intervalMs: number = 5000): void {
    this.stopPolling();
    this.isPollingSubject.next(true);

    interval(intervalMs).pipe(
      takeUntil(this.stopPolling$),
      takeUntil(this.destroy$),
      switchMap(() => this.getTracking(trackingId))
    ).subscribe({
      next: (session) => {
        const prev = this.currentSessionSubject.value;
        if (prev && prev.status.code !== session.status.code) {
          this.addNotification({
            type: 'status_change',
            title: session.status.label,
            message: `Der Status hat sich geändert.`,
            icon: session.status.icon
          });
        }
      },
      error: () => this.stopPolling()
    });
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    this.stopPolling$.next();
    this.isPollingSubject.next(false);
  }

  // ========== Driver Methods (Share Location) ==========

  /**
   * Create a new tracking session for a Fahrt
   */
  createTracking(fahrtId: number, driverEmail: string): Observable<TrackingSession> {
    return this.http.post<TrackingData>(this.apiUrl, { fahrtId, driverEmail }).pipe(
      map(data => this.mapToSession(data)),
      tap(session => {
        this.currentSessionSubject.next(session);
        this.addNotification({
          type: 'status_change',
          title: 'Tracking erstellt',
          message: `Tracking-Code: ${session.trackingCode}`,
          icon: '📍'
        });
      })
    );
  }

  /**
   * Get all trackings for a driver
   */
  getDriverTrackings(email: string): Observable<TrackingSession[]> {
    return this.http.get<TrackingData[]>(`${this.apiUrl}/driver`, { params: { email } }).pipe(
      map(data => data.map(d => this.mapToSession(d)))
    );
  }

  /**
   * Start tracking (driver begins journey)
   */
  startTracking(trackingId: number, location: LocationUpdate): Observable<TrackingSession> {
    return this.http.post<TrackingData>(`${this.apiUrl}/${trackingId}/start`, location).pipe(
      map(data => this.mapToSession(data)),
      tap(session => {
        this.currentSessionSubject.next(session);
        this.addNotification({
          type: 'status_change',
          title: 'Fahrt gestartet',
          message: 'Die Sendung wurde abgeholt.',
          icon: '🚚'
        });
      })
    );
  }

  /**
   * Set destination coordinates
   */
  setDestination(trackingId: number, location: LocationUpdate): Observable<TrackingSession> {
    return this.http.post<TrackingData>(`${this.apiUrl}/${trackingId}/destination`, location).pipe(
      map(data => this.mapToSession(data)),
      tap(session => this.currentSessionSubject.next(session))
    );
  }

  /**
   * Update current location (driver shares their position)
   */
  updateLocation(trackingId: number, location: LocationUpdate): Observable<TrackingSession> {
    return this.http.put<TrackingData>(`${this.apiUrl}/${trackingId}/location`, location).pipe(
      map(data => this.mapToSession(data)),
      tap(session => this.currentSessionSubject.next(session))
    );
  }

  /**
   * Update location by tracking code
   */
  updateLocationByCode(trackingCode: string, location: LocationUpdate): Observable<TrackingSession> {
    return this.http.put<TrackingData>(`${this.apiUrl}/code/${trackingCode}/location`, location).pipe(
      map(data => this.mapToSession(data)),
      tap(session => this.currentSessionSubject.next(session))
    );
  }

  /**
   * Update status manually
   */
  updateStatus(trackingId: number, status: string, note?: string): Observable<TrackingSession> {
    return this.http.put<TrackingData>(`${this.apiUrl}/${trackingId}/status`, { status, note }).pipe(
      map(data => this.mapToSession(data)),
      tap(session => {
        this.currentSessionSubject.next(session);
        this.addNotification({
          type: 'status_change',
          title: session.status.label,
          message: note || 'Status aktualisiert',
          icon: session.status.icon
        });
      })
    );
  }

  /**
   * Complete delivery
   */
  completeDelivery(trackingId: number, note?: string): Observable<TrackingSession> {
    return this.http.post<TrackingData>(`${this.apiUrl}/${trackingId}/complete`, { note }).pipe(
      map(data => this.mapToSession(data)),
      tap(session => {
        this.currentSessionSubject.next(session);
        this.addNotification({
          type: 'arrival',
          title: 'Zugestellt! 🎉',
          message: 'Die Sendung wurde erfolgreich zugestellt.',
          icon: '✅'
        });
      })
    );
  }

  // ========== Driver Simulation (Auto-share location) ==========

  /**
   * Start automatic location sharing simulation for drivers
   * Uses browser geolocation if available, otherwise simulates movement
   */
  startDriverSimulation(trackingId: number, useRealGPS: boolean = false): void {
    if (this.isSimulating) {
      this.stopSimulation();
    }
    this.isSimulating = true;

    if (useRealGPS && 'geolocation' in navigator) {
      // Use real GPS
      this.startRealGPSTracking(trackingId);
    } else {
      // Simulate movement
      this.startSimulatedMovement(trackingId);
    }
  }

  /**
   * Stop simulation
   */
  stopSimulation(): void {
    this.simulationStop$.next();
    this.isSimulating = false;
  }

  private startRealGPSTracking(trackingId: number): void {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: LocationUpdate = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          speed: position.coords.speed ? position.coords.speed * 3.6 : 0, // m/s to km/h
          heading: position.coords.heading || 0
        };
        this.updateLocation(trackingId, location).subscribe();
      },
      (error) => {
        console.error('GPS Error:', error);
        // Fall back to simulation
        this.startSimulatedMovement(trackingId);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 30000 }
    );

    this.simulationStop$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      navigator.geolocation.clearWatch(watchId);
    });
  }

  private startSimulatedMovement(trackingId: number): void {
    const session = this.currentSessionSubject.value;
    if (!session) return;

    let progress = session.progress || 0;

    interval(3000).pipe(
      takeUntil(this.simulationStop$),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // Simulate progress
      progress = Math.min(100, progress + (1 + Math.random() * 2));

      // Interpolate position
      const origin = session.origin;
      const dest = session.destination;

      if (origin.lat && dest.lat) {
        const lat = origin.lat + (dest.lat - origin.lat) * (progress / 100);
        const lng = origin.lng + (dest.lng - origin.lng) * (progress / 100);

        const location: LocationUpdate = {
          lat,
          lng,
          speed: 60 + Math.random() * 40,
          heading: this.calculateHeading(origin, dest)
        };

        this.updateLocation(trackingId, location).subscribe({
          next: (updatedSession) => {
            if (updatedSession.status.code === 'DELIVERED') {
              this.stopSimulation();
            }
          }
        });
      }
    });
  }

  // ========== Notification Methods ==========

  addNotification(notification: Omit<TrackingNotification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: TrackingNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([newNotification, ...current].slice(0, 50));
  }

  markNotificationRead(id: string): void {
    const notifications = this.notificationsSubject.value.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(notifications);
  }

  clearNotifications(): void {
    this.notificationsSubject.next([]);
  }

  getUnreadCount(): number {
    return this.notificationsSubject.value.filter(n => !n.read).length;
  }

  // ========== Helper Methods ==========

  private mapToSession(data: TrackingData): TrackingSession {
    return {
      id: data.id.toString(),
      trackingCode: data.trackingCode,
      fahrtId: data.fahrtId,
      driverName: data.driverName || 'Fahrer',
      driverPhone: data.driverPhone || '',
      vehicleType: data.driverVehicle || 'Transporter',

      origin: {
        lat: data.originLat || 0,
        lng: data.originLng || 0,
        city: data.originCity
      },
      destination: {
        lat: data.destinationLat || 0,
        lng: data.destinationLng || 0,
        city: data.destinationCity
      },
      currentLocation: data.currentLat ? {
        lat: data.currentLat,
        lng: data.currentLng!,
        address: data.currentAddress || undefined,
        city: data.currentCity || undefined
      } : null,

      status: {
        code: data.status,
        label: data.statusLabel,
        icon: data.statusIcon,
        color: STATUS_COLORS[data.status] || '#6b7280'
      },

      progress: data.progress || 0,
      totalDistance: data.totalDistance || 0,
      coveredDistance: data.coveredDistance || 0,
      remainingDistance: data.remainingDistance || 0,
      estimatedMinutes: data.estimatedMinutes || 0,
      currentSpeed: data.currentSpeed || 0,
      heading: data.heading || 0,

      startTime: data.startedAt ? new Date(data.startedAt) : null,
      estimatedArrival: data.estimatedArrival ? new Date(data.estimatedArrival) : null,
      lastUpdate: new Date(data.lastUpdate),

      isActive: data.isActive,
      isLive: data.isActive && data.status !== 'DELIVERED' && data.status !== 'CANCELLED'
    };
  }

  private calculateHeading(from: GeoLocation, to: GeoLocation): number {
    const dLng = (to.lng - from.lng) * Math.PI / 180;
    const lat1 = from.lat * Math.PI / 180;
    const lat2 = to.lat * Math.PI / 180;

    const x = Math.sin(dLng) * Math.cos(lat2);
    const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    let heading = Math.atan2(x, y) * 180 / Math.PI;
    return (heading + 360) % 360;
  }

  /**
   * Get heading direction as string
   */
  getHeadingDirection(heading: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  }

  // ========== Demo/Fallback for when backend is not available ==========

  /**
   * Create a demo session for testing when backend is unavailable
   */
  createDemoSession(fahrtId: number): TrackingSession {
    const demoRoutes: { [key: string]: { origin: GeoLocation; dest: GeoLocation } } = {
      '1': {
        origin: { lat: 52.52, lng: 13.405, city: 'Berlin' },
        dest: { lat: 53.5511, lng: 9.9937, city: 'Hamburg' }
      },
      '2': {
        origin: { lat: 48.1351, lng: 11.582, city: 'München' },
        dest: { lat: 48.7758, lng: 9.1829, city: 'Stuttgart' }
      },
      '3': {
        origin: { lat: 50.9375, lng: 6.9603, city: 'Köln' },
        dest: { lat: 50.1109, lng: 8.6821, city: 'Frankfurt' }
      }
    };

    const route = demoRoutes[fahrtId.toString()] || demoRoutes['1'];

    const session: TrackingSession = {
      id: `demo-${fahrtId}`,
      trackingCode: `MC-DEMO${fahrtId}`,
      fahrtId: fahrtId,
      driverName: 'Demo Fahrer',
      driverPhone: '+49 123 456789',
      vehicleType: 'Mercedes Sprinter',

      origin: route.origin,
      destination: route.dest,
      currentLocation: route.origin,

      status: {
        code: 'WAITING',
        label: 'Warten auf Abholung',
        icon: '🕐',
        color: '#6b7280'
      },

      progress: 0,
      totalDistance: 290,
      coveredDistance: 0,
      remainingDistance: 290,
      estimatedMinutes: 180,
      currentSpeed: 0,
      heading: 0,

      startTime: null,
      estimatedArrival: new Date(Date.now() + 180 * 60 * 1000),
      lastUpdate: new Date(),

      isActive: true,
      isLive: true
    };

    this.currentSessionSubject.next(session);
    return session;
  }

  /**
   * Run demo simulation (client-side only)
   */
  runDemoSimulation(): void {
    this.stopSimulation();
    this.isSimulating = true;

    let session = this.currentSessionSubject.value;
    if (!session) return;

    interval(3000).pipe(
      takeUntil(this.simulationStop$),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      session = this.currentSessionSubject.value;
      if (!session) return;

      let progress = (session.progress || 0) + (1 + Math.random() * 2);
      progress = Math.min(100, progress);

      // Determine status
      let status: TrackingStatus;
      if (progress < 5) {
        status = { code: 'WAITING', label: 'Warten auf Abholung', icon: '🕐', color: '#6b7280' };
      } else if (progress < 10) {
        status = { code: 'PICKED_UP', label: 'Abgeholt', icon: '📦', color: '#3b82f6' };
      } else if (progress < 90) {
        status = { code: 'IN_TRANSIT', label: 'Unterwegs', icon: '🚚', color: '#f59e0b' };
      } else if (progress < 100) {
        status = { code: 'NEAR_DESTINATION', label: 'Fast am Ziel', icon: '📍', color: '#8b5cf6' };
      } else {
        status = { code: 'DELIVERED', label: 'Zugestellt', icon: '✅', color: '#10b981' };
        this.stopSimulation();
      }

      // Interpolate position
      const lat = session.origin.lat + (session.destination.lat - session.origin.lat) * (progress / 100);
      const lng = session.origin.lng + (session.destination.lng - session.origin.lng) * (progress / 100);

      const updatedSession: TrackingSession = {
        ...session,
        progress,
        status,
        currentLocation: { lat, lng },
        currentSpeed: 60 + Math.random() * 40,
        coveredDistance: session.totalDistance * (progress / 100),
        remainingDistance: session.totalDistance * (1 - progress / 100),
        estimatedMinutes: Math.round(session.totalDistance * (1 - progress / 100) / 80 * 60),
        lastUpdate: new Date(),
        isLive: progress < 100
      };

      this.currentSessionSubject.next(updatedSession);

      // Add notification on status change
      if (session.status.code !== status.code) {
        this.addNotification({
          type: 'status_change',
          title: status.label,
          message: `Der Status hat sich geändert.`,
          icon: status.icon
        });
      }
    });
  }
}
