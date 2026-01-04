import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class TrackingComponent implements OnInit, OnDestroy {

  // Route params
  tripId: string = '';
  trackingCode: string = '';

  // Session data
  session: TrackingSession | null = null;
  notifications: TrackingNotification[] = [];

  // UI state
  isLoading: boolean = true;
  isSimulationRunning: boolean = false;
  showNotifications: boolean = false;
  unreadCount: number = 0;
  errorMessage: string = '';
  isGPSActive: boolean = false;

  // Mode: 'customer' (query only) or 'driver' (share location)
  mode: 'customer' | 'driver' = 'customer';

  // Driver mode - tracking code input
  searchTrackingCode: string = '';

  // Demo mode (fallback when backend unavailable)
  isDemoMode: boolean = false;

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
          this.session = session;
          this.updateStatusTimeline();
        }
      });

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
          // Try demo mode
          this.loadDemoMode();
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
            // No tracking exists yet, try demo mode
            this.loadDemoMode();
          }
          this.isLoading = false;
        },
        error: () => {
          this.loadDemoMode();
          this.isLoading = false;
        }
      });
  }

  private loadDemoMode(): void {
    this.isDemoMode = true;
    this.session = this.trackingService.createDemoSession(parseInt(this.tripId) || 1);
    this.updateStatusTimeline();
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
          : 'Warten auf Start',
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

  // ========== Simulation Controls ==========

  onToggleSimulation(): void {
    if (!this.session) return;

    if (this.isSimulationRunning) {
      if (this.isDemoMode) {
        this.trackingService.stopSimulation();
      } else {
        this.trackingService.stopSimulation();
      }
      this.isSimulationRunning = false;
    } else {
      if (this.isDemoMode) {
        this.trackingService.runDemoSimulation();
      } else {
        this.trackingService.startDriverSimulation(parseInt(this.session.id), false);
      }
      this.isSimulationRunning = true;
    }
  }

  onResetSimulation(): void {
    this.trackingService.stopSimulation();
    this.isSimulationRunning = false;

    if (this.isDemoMode) {
      this.session = this.trackingService.createDemoSession(parseInt(this.tripId) || 1);
      this.updateStatusTimeline();
    }
  }

  // ========== Driver GPS Mode ==========

  onToggleDriverGPS(): void {
    if (!this.session) return;

    if (this.isGPSActive) {
      // Stop GPS sharing
      this.trackingService.stopSimulation();
      this.isGPSActive = false;
      this.isSimulationRunning = false;
      this.trackingService.addNotification({
        title: 'GPS deaktiviert',
        message: 'GPS-Standortfreigabe wurde gestoppt.',
        icon: '📍',
        type: 'status_change'
      });
    } else {
      // Start real GPS sharing
      this.mode = 'driver';
      this.trackingService.stopSimulation(); // Stop any running simulation first
      this.trackingService.startDriverSimulation(parseInt(this.session.id), true);
      this.isGPSActive = true;
      this.isSimulationRunning = false;
      this.trackingService.addNotification({
        title: 'GPS aktiviert',
        message: 'Dein Standort wird jetzt in Echtzeit geteilt.',
        icon: '📍',
        type: 'status_change'
      });
    }
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
    if (!date) return '--:--';
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
    const diffMs = now.getTime() - d.getTime();
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
