import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TrackingService, TrackingSession, LocationUpdate } from '../../services/tracking.service';

@Component({
  selector: 'app-driver-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './driver-tracking.component.html',
  styleUrls: ['./driver-tracking.component.css']
})
export class DriverTrackingComponent implements OnInit, OnDestroy {

  // Current user (driver) - would come from auth service
  driverEmail: string = '';

  // Sessions
  trackingSessions: TrackingSession[] = [];
  activeSession: TrackingSession | null = null;

  // UI State
  isLoading: boolean = false;
  isSharing: boolean = false;
  useRealGPS: boolean = true;
  showCreateModal: boolean = false;

  // Create tracking form
  selectedFahrtId: number | null = null;
  availableFahrten: any[] = []; // Would come from FahrtService

  // Current location
  currentLocation: LocationUpdate | null = null;
  locationError: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private trackingService: TrackingService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get driver email from localStorage (would use auth service)
    const userStr = localStorage.getItem('user') || localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.driverEmail = user.email || 'fahrer@test.de';
      } catch {
        this.driverEmail = 'fahrer@test.de';
      }
    } else {
      this.driverEmail = 'fahrer@test.de';
    }

    // Load driver's tracking sessions
    this.loadDriverSessions();

    // Auto create tracking session from query parameters
    this.route.queryParams.subscribe(params => {
      if (params['fahrtId']) {
        this.selectedFahrtId = parseInt(params['fahrtId'], 10);
        this.onCreateTracking(this.selectedFahrtId);
      }
    });

    // Subscribe to current session updates
    this.trackingService.currentSession$
      .pipe(takeUntil(this.destroy$))
      .subscribe(session => {
        if (session) {
          this.activeSession = session;
        }
      });

    // Get current location
    this.getCurrentLocation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopSharing();
  }

  // ========== Load Sessions ==========

  loadDriverSessions(): void {
    this.isLoading = true;

    this.trackingService.getDriverTrackings(this.driverEmail)
      .subscribe({
        next: (sessions) => {
          this.trackingSessions = sessions;
          this.isLoading = false;

          // Set active session if any
          const active = sessions.find(s => s.isActive && s.isLive);
          if (active) {
            this.activeSession = active;
          }
        },
        error: (err) => {
          console.error('Error loading sessions:', err);
          this.isLoading = false;
        }
      });
  }

  // ========== Location Methods ==========

  getCurrentLocation(): void {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            speed: position.coords.speed ? position.coords.speed * 3.6 : 0,
            heading: position.coords.heading || 0
          };
          this.locationError = '';
        },
        (error) => {
          this.locationError = this.getLocationErrorMessage(error);
          // Use default location (Berlin)
          this.currentLocation = {
            lat: 52.52,
            lng: 13.405,
            city: 'Berlin',
            speed: 0,
            heading: 0
          };
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      this.locationError = 'Geolocation wird nicht unterstützt';
      this.currentLocation = {
        lat: 52.52,
        lng: 13.405,
        city: 'Berlin',
        speed: 0,
        heading: 0
      };
    }
  }

  private getLocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Standortzugriff verweigert. Bitte erlauben Sie den Zugriff in den Browsereinstellungen.';
      case error.POSITION_UNAVAILABLE:
        return 'Standort nicht verfügbar.';
      case error.TIMEOUT:
        return 'Standortabfrage hat zu lange gedauert.';
      default:
        return 'Unbekannter Fehler bei der Standortabfrage.';
    }
  }

  // ========== Create Tracking ==========

  onCreateTracking(fahrtId: number): void {
    if (!fahrtId) return;

    this.isLoading = true;

    this.trackingService.createTracking(fahrtId, this.driverEmail)
      .subscribe({
        next: (session) => {
          this.activeSession = session;
          this.trackingSessions.unshift(session);
          this.showCreateModal = false;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error creating tracking:', err);
          this.isLoading = false;
        }
      });
  }

  // ========== Start/Stop Sharing ==========

  startSharing(): void {
    if (!this.activeSession) return;

    // Start the journey
    if (this.currentLocation) {
      this.trackingService.startTracking(parseInt(this.activeSession.id), this.currentLocation)
        .subscribe({
          next: (session) => {
            this.activeSession = session;
            this.isSharing = true;

            // Start continuous location sharing
            this.trackingService.startDriverSimulation(parseInt(session.id), this.useRealGPS);
          },
          error: (err) => console.error('Error starting tracking:', err)
        });
    }
  }

  stopSharing(): void {
    this.trackingService.stopSimulation();
    this.isSharing = false;
  }

  toggleSharing(): void {
    if (this.isSharing) {
      this.stopSharing();
    } else {
      this.startSharing();
    }
  }

  // ========== Status Updates ==========

  updateStatus(status: string): void {
    if (!this.activeSession) return;

    this.trackingService.updateStatus(parseInt(this.activeSession.id), status)
      .subscribe({
        next: (session) => {
          this.activeSession = session;
          this.loadDriverSessions();
        },
        error: (err) => console.error('Error updating status:', err)
      });
  }

  completeDelivery(): void {
    if (!this.activeSession) return;

    this.stopSharing();

    this.trackingService.completeDelivery(parseInt(this.activeSession.id), 'Zustellung erfolgreich')
      .subscribe({
        next: (session) => {
          this.activeSession = session;
          this.loadDriverSessions();
        },
        error: (err) => console.error('Error completing delivery:', err)
      });
  }

  // ========== Select Session ==========

  selectSession(session: TrackingSession): void {
    this.activeSession = session;

    if (session.isLive && session.isActive) {
      // Resume sharing if session is active
    }
  }

  // ========== Navigation ==========

  viewAsCustomer(): void {
    if (this.activeSession) {
      this.router.navigate(['/tracking/code', this.activeSession.trackingCode]);
    }
  }

  copyTrackingCode(): void {
    if (this.activeSession) {
      navigator.clipboard.writeText(this.activeSession.trackingCode);
      // Show toast notification
    }
  }

  // ========== Helpers ==========

  getStatusClass(status: string): string {
    switch (status) {
      case 'WAITING': return 'status-waiting';
      case 'PICKED_UP': return 'status-picked-up';
      case 'IN_TRANSIT': return 'status-in-transit';
      case 'NEAR_DESTINATION': return 'status-near';
      case 'DELIVERED': return 'status-delivered';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-waiting';
    }
  }

  formatTime(date: Date | string | null): string {
    if (!date) return '--:--';
    const d = new Date(date);
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(date: Date | string | null): string {
    if (!date) return '--.--.--';
    const d = new Date(date);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  }
}
