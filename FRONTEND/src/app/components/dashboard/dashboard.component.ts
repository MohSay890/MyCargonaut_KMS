import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { UserProfileService } from '../../services/user-profile.service';
import { NotificationService } from '../../services/notification.service';

interface Trip {
  id: string;
  date: Date;
  route: string;
  time: string;
  vehicle: string;
  maxWeight: number;
  status: 'confirmed' | 'pending';
}

interface UserNotification {
  id: string; // Da du sagtest id ist string
  typ: 'BOOKING' | 'REVIEW' | 'PAYMENT';
  titel: string;
  nachricht: string;
  zeitstempel: Date;
  gelesen: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  userName: string = 'Benutzer';
  isLoading: boolean = true;
  notifications: UserNotification[] = [];

  // Stats
  stats = {
    activeOffers: 0,
    completedTrips: 0,
    averageRating: 0,
    totalEarnings: 0
  };

  // Upcoming Trips
  upcomingTrips: Trip[] = [];




  constructor(
    private router: Router,
    private http: HttpClient,
    private userProfileService: UserProfileService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Get user from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // Set display name using vorname and nachname
      if (user.vorname && user.nachname) {
        this.userName = `${user.vorname} ${user.nachname}`;
      } else {
        this.userName = user.name || user.email?.split('@')[0] || 'Benutzer';
      }

      // Load real stats from backend
      this.loadUserStats(user.email);
      // Load earnings from payment API
      this.loadEarnings(user.email);
      this.loadRealNotifications(user.id);
    } else {
      this.isLoading = false;
    }
  }

  // dashboard.component.ts
  loadRealNotifications(userId: any): void {
    // Sicherstellen, dass der Service auch das neue Interface nutzt
    this.notificationService.getNotifications(String(userId)).subscribe({
      next: (data: any[]) => {
        this.notifications = data.map(n => ({
          ...n,
          id: String(n.id),
          // Umwandlung des Strings aus der DB in ein Date-Objekt
          zeitstempel: new Date(n.zeitstempel)
        }));
      },
      error: (err) => console.error('Fehler beim Laden:', err)
    });
  }

  loadUserStats(email: string): void {
    this.isLoading = true;
    this.userProfileService.getUserStats(email).subscribe({
      next: (stats) => {
        this.stats = {
          activeOffers: stats.activeOffers,
          completedTrips: stats.completedTrips,
          averageRating: Number(stats.averageRating.toFixed(1)),
          totalEarnings: this.stats.totalEarnings // Keep earnings from payment API
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user stats:', error);
        this.isLoading = false;
      }
    });
  }

  loadEarnings(email: string): void {
    this.http.get<{
      totalEarnings: number;
      refundedAmount: number;
      netEarnings: number;
      completedPayments: number;
      refundedPayments: number;
    }>(`http://localhost:8080/api/payments/earnings?email=${encodeURIComponent(email)}`).subscribe({
      next: (earnings) => {
        this.stats.totalEarnings = Number(earnings.netEarnings.toFixed(2));
      },
      error: (error) => {
        console.error('Error loading earnings:', error);
        this.stats.totalEarnings = 0;
      }
    });
  }

  // Format date for display
  formatDate(date: Date): { day: string, month: string } {
    const day = date.getDate().toString();
    const month = date.toLocaleDateString('de-DE', { month: 'short' });
    return { day, month };
  }

  // Format timestamp
  formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'vor wenigen Minuten';
    } else if (diffHours < 24) {
      return `vor ${diffHours} ${diffHours === 1 ? 'Stunde' : 'Stunden'}`;
    } else {
      return `vor ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tagen'}`;
    }
  }

  // Get notification icon
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'booking': return 'ℹ️';
      case 'review': return '⭐';
      case 'payment': return '💶';
      default: return '📢';
    }
  }

  // Quick actions
  onNewOffer(): void {
    console.log('New offer clicked');
    this.router.navigate(['/my-trips']);
    // TODO: Later open create trip modal
  }

  onSearchTransport(): void {
    console.log('Search transport clicked');
    this.router.navigate(['/search']);
    // TODO: Create search page
  }

  onViewAllTrips(): void {
    console.log('View all trips clicked');
    this.router.navigate(['/my-trips']);
  }

  onViewAllNotifications(): void {
    console.log('View all notifications clicked');
    this.router.navigate(['/notifications']);
    // TODO: Create notifications page
  }

  onTripAction(trip: Trip): void {
    console.log('Trip action:', trip.id);
    this.router.navigate(['/my-trips']);
    // TODO: Navigate to specific trip details
  }
}
