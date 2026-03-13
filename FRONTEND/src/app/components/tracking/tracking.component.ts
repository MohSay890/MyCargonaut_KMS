import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import {
  TrackingService,
  TrackingSession,
  TrackingNotification
} from '../../services/tracking.service';
import * as L from 'leaflet';

interface StatusTimelineItem {
  status: string;
  title: string;
  time: string;
  location: string;
  details?: string;
  icon: string;
  color: string;
  isActive: boolean;
  isCompleted: boolean;
}

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent],
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.css']
})
export class TrackingComponent implements OnInit, OnDestroy, AfterViewInit {
  [key: string]: any; // Allow dynamic properties like _timeAgoNow

  // Route params
  tripId: string = '';
  trackingCode: string = '';

  // Session data
  session: TrackingSession | null = null;
  notifications: TrackingNotification[] = [];

  // Map elements
  private map: L.Map | undefined;
  private driverMarker: L.Marker | undefined;
  private routeLine: L.Polyline | undefined;

  // UI state
  isLoading: boolean = true;
  showNotifications: boolean = false;
  unreadCount: number = 0;
  errorMessage: string = '';

  // Mode: 'customer' (query only) or 'driver' (share location)
  mode: 'customer' | 'driver' = 'customer';

  // Driver mode - tracking code input
  searchTrackingCode: string = '';

  private destroy$ = new Subject<void>();

  // Status timeline for display
  statusTimeline: StatusTimelineItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trackingService: TrackingService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tripId = params['id'] || '';
      this.trackingCode = params['code'] || '';

      if (this.trackingCode) {
        this.loadByTrackingCode(this.trackingCode);
      } else if (this.tripId) {
        this.loadByFahrtId(parseInt(this.tripId));
      } else {
        this.isLoading = false;
      }
    });

    // Subscribe to session updates
    this.trackingService.currentSession$
      .pipe(takeUntil(this.destroy$))
      .subscribe(session => {
        if (session) {
          const previousLocation = this.session?.currentLocation;
          this.session = session;
          this.updateStatusTimeline();

          if (this.map && session.currentLocation) {
             this.updateMapLocation(session.currentLocation.lat, session.currentLocation.lng, session.heading);
          } else if (!this.map && session.currentLocation) {
             // Init map if it was delayed due to UI loading
             setTimeout(() => this.initMap(), 100);
          }
        }
      });

    // Subscribing to Stomp connection
    this.trackingService.connectWebSocket();

    // Subscribe to notifications
    this.trackingService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
        this.unreadCount = notifications.filter(n => !n.read).length;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.trackingService.stopPolling();
    this.trackingService.stopSimulation();
    if (this.map) {
      this.map.remove();
    }
  }

  ngAfterViewInit(): void {
    if (this.session && this.session.currentLocation) {
        this.initMap();
    }
  }

  private initMap(): void {
    if (this.map) return;

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

      // Start with current location, then origin, then fallback to Germany center
      const initLat = this.session?.currentLocation?.lat || this.session?.origin?.lat || 51.165691;
      const initLng = this.session?.currentLocation?.lng || this.session?.origin?.lng || 10.451526;

      this.map = L.map('map').setView([initLat, initLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      // Add Origin Marker
      if (this.session?.origin?.lat && this.session?.origin?.lng) {
        L.marker([this.session.origin.lat, this.session.origin.lng], {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="font-size: 24px;">📦</div>',
            iconSize: [24, 24]
          })
        }).bindPopup('Abholort: ' + (this.session.origin.city || '')).addTo(this.map);
      }

      // Add Destination Marker
      if (this.session?.destination?.lat && this.session?.destination?.lng) {
        L.marker([this.session.destination.lat, this.session.destination.lng], {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="font-size: 24px;">🏁</div>',
            iconSize: [24, 24]
          })
        }).bindPopup('Zielort: ' + (this.session.destination.city || '')).addTo(this.map);
      }

      this.createOrUpdateMarker(initLat, initLng, this.session?.heading || 0);
    }

    private createOrUpdateMarker(lat: number, lng: number, heading: number): void {
      if (!this.map) return;

      if (this.driverMarker) {
        this.driverMarker.setLatLng([lat, lng]);

      // Update heading using CSS transform on the marker icon
      const iconElement = this.driverMarker.getElement();
      if (iconElement) {
        iconElement.style.transform = `${iconElement.style.transform} rotate(${heading}deg)`;
      }
    } else {
      // Create a truck icon
      const truckIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="truck-marker-icon" style="transform: rotate(${heading}deg);">🚚</div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });

      this.driverMarker = L.marker([lat, lng], { icon: truckIcon }).addTo(this.map);
    }
  }

  private updateMapLocation(lat: number, lng: number, heading: number): void {
    if (!this.map) return;

    // Smoothly pan map to new coordinates
    this.map.panTo([lat, lng], { animate: true, duration: 1.0 });
    this.createOrUpdateMarker(lat, lng, heading);
  }

  // ========== Load Methods ==========

  private loadByTrackingCode(code: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.trackingService.getTrackingByCode(code)
      .subscribe({
        next: (session) => {
          this.session = session;
          this.updateStatusTimeline();
          this.isLoading = false;
          // Start polling for updates
          this.trackingService.startPolling(parseInt(session.id), 5000);
        },
        error: (err) => {
          this.errorMessage = 'Tracking-Code nicht gefunden. Bitte überprüfen Sie den Code.';
          this.isLoading = false;
        }
      });
  }

  private loadByFahrtId(fahrtId: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.trackingService.getTrackingByFahrtId(fahrtId)
      .subscribe({
        next: (session) => {
          if (session) {
            this.session = session;
            this.updateStatusTimeline();
            this.trackingService.startPolling(parseInt(session.id), 5000);
          } else {
            this.errorMessage = 'Noch keine Tracking-Session für diese Fahrt vorhanden.';
          }
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Fehler beim Laden der Tracking-Session.';
          this.isLoading = false;
        }
      });
  }

  // ========== Search by Tracking Code ==========

  onSearchTracking(): void {
    if (this.searchTrackingCode.trim()) {
      this.router.navigate(['/tracking/code', this.searchTrackingCode.trim().toUpperCase()]);
    }
  }

  // ========== Status Timeline ==========

  private updateStatusTimeline(): void {
    if (!this.session) return;

    const statusOrder = ['WAITING', 'PICKED_UP', 'IN_TRANSIT', 'NEAR_DESTINATION', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(this.session.status.code);

    this.statusTimeline = [
      {
        status: 'PICKED_UP',
        title: 'Abgeholt',
        time: this.session.startTime ? this.formatDateTime(this.session.startTime) : 'Ausstehend',
        location: this.session.origin.city || 'Start',
        icon: '📦',
        color: this.session.progress >= 5 ? '#10b981' : '#9ca3af',
        isActive: this.session.status.code === 'PICKED_UP',
        isCompleted: currentIndex > statusOrder.indexOf('PICKED_UP')
      },
      {
        status: 'IN_TRANSIT',
        title: 'Unterwegs',
        time: this.session.progress >= 10 ? `Aktualisiert: ${this.getTimeAgo(this.session.lastUpdate)}` : 'Ausstehend',
        location: this.session.currentLocation
          ? (this.session.currentLocation.city || 'Unterwegs')
            : (this.session.origin?.city || 'Warten auf Start'),
        details: this.session.progress >= 10
          ? `${Math.round(this.session.currentSpeed)} km/h | ${Math.round(this.session.remainingDistance)} km verbleibend`
          : undefined,
        icon: '🚚',
        color: this.session.status.code === 'IN_TRANSIT' || this.session.status.code === 'NEAR_DESTINATION'
          ? '#f59e0b'
          : currentIndex > statusOrder.indexOf('IN_TRANSIT') ? '#10b981' : '#9ca3af',
        isActive: this.session.status.code === 'IN_TRANSIT' || this.session.status.code === 'NEAR_DESTINATION',
        isCompleted: currentIndex >= statusOrder.indexOf('DELIVERED')
      },
      {
        status: 'DELIVERED',
        title: 'Zugestellt',
        time: this.session.status.code === 'DELIVERED'
          ? this.formatTime(new Date())
          : (this.session.estimatedArrival ? `ETA: ${this.formatTime(this.session.estimatedArrival)}` : 'Ausstehend'),
        location: this.session.destination.city || 'Ziel',
        icon: this.session.status.code === 'DELIVERED' ? '✅' : '📍',
        color: this.session.status.code === 'DELIVERED' ? '#10b981' : '#9ca3af',
        isActive: false,
        isCompleted: this.session.status.code === 'DELIVERED'
      }
    ];
  }

// ========== Notifications ==========

  onToggleNotifications(): void {
    this.showNotifications = !this.showNotifications;

    if (this.showNotifications) {
      this.notifications.forEach(n => {
        if (!n.read) {
          this.trackingService.markNotificationRead(n.id);
        }
      });
    }
  }

  onClearNotifications(): void {
    this.trackingService.clearNotifications();
  }

  // ========== Driver Actions ==========

  onCallDriver(): void {
    if (this.session && this.session.driverPhone) {
      window.location.href = `tel:${this.session.driverPhone}`;
    }
  }

  onSendMessage(): void {
    this.router.navigate(['/messages']);
  }

  copyTrackingCode(): void {
    if (this.session?.trackingCode) {
      navigator.clipboard.writeText(this.session.trackingCode)
        .then(() => {
          // Optionally show a toast notification
          console.log('Tracking-Code kopiert!');
        })
        .catch(err => console.error('Kopieren fehlgeschlagen:', err));
    }
  }

  // ========== Formatting Helpers ==========

  formatTime(date: Date | string | null): string {
      if (!date) {
        if (this.session && this.session.estimatedMinutes && this.session.status.code !== 'DELIVERED') {
          // If we don't have an exact arrival date but we have minutes
          const now = new Date();
          const d = new Date(now.getTime() + this.session.estimatedMinutes * 60000);
          return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr (geschätzt)';
        }
        return '--:--';
      }
      const d = new Date(date);
      return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
  }

  formatDate(date: Date | string | null): string {
    if (!date) return '--.--.----';
    const d = new Date(date);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatDateTime(date: Date | string | null): string {
    if (!date) return 'Ausstehend';
    const d = new Date(date);
    return `${this.formatDate(d)}, ${this.formatTime(d)}`;
  }

  getTimeAgo(date: Date | string | null): string {
    if (!date) return 'Nie';
    const d = new Date(date);
    const now = new Date();
    // Cache the "now" time so it doesn't change during change detection loops
    if (!this['_timeAgoNow']) {
      this['_timeAgoNow'] = now;
      setTimeout(() => this['_timeAgoNow'] = null, 1000); // Clear cache after a second
    }
    const cachedNow = this['_timeAgoNow'];

    const diffMs = cachedNow.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 10) return 'Gerade eben';
    if (diffSecs < 60) return `vor ${diffSecs} Sek.`;
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    return `vor ${diffHours} Std.`;
  }

  getProgressColor(): string {
    if (!this.session) return '#9ca3af';

    if (this.session.progress < 25) return '#f59e0b';
    if (this.session.progress < 75) return '#3b82f6';
    if (this.session.progress < 100) return '#10b981';
    return '#10b981';
  }

  getSpeedIndicator(): string {
    if (!this.session) return '🚗';

    const speed = this.session.currentSpeed || 0;
    if (speed === 0) return '🅿️';
    if (speed < 50) return '🚗';
    if (speed < 80) return '🚙';
    if (speed < 100) return '🚚';
    return '🏎️';
  }

  getHeadingDirection(heading?: number): string {
    const h = heading ?? (this.session?.heading || 0);
    return this.trackingService.getHeadingDirection(h);
  }

  getETAStatus(): { text: string; class: string } {
    if (!this.session) return { text: '', class: '' };

    if (this.session.status.code === 'DELIVERED') {
      return { text: 'Zugestellt', class: 'eta-delivered' };
    }

    const mins = this.session.estimatedMinutes || 0;

    if (mins <= 0) {
      return { text: 'Jeden Moment', class: 'eta-imminent' };
    }

    if (mins <= 15) {
      return { text: `${mins} Min.`, class: 'eta-soon' };
    }

    if (mins <= 60) {
      return { text: `${mins} Min.`, class: 'eta-normal' };
    }

    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return { text: `${hours} Std. ${minutes} Min.`, class: 'eta-normal' };
  }
}
