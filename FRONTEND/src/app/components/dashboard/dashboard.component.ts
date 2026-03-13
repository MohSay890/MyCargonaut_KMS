import { Component, OnInit } from '@angular/core';

import { OfferService } from '../../services/offer.service';
import { BookingService } from '../../services/booking.service';
import { forkJoin } from 'rxjs';
import { BookingRequestModalComponent } from '../booking-request-modal/booking-request-modal.component';
import { NotificationService, Notification } from '../../services/notification.service';

import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { UserProfileService } from '../../services/user-profile.service';

interface Trip {
  id: string;
  date: Date;
  route: string;
  time: string;
  vehicle: string;
  maxWeight: number;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, BookingRequestModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  userName: string = 'Benutzer';
  isLoading: boolean = true;

  // Stats
  stats = {
    activeOffers: 0,
    completedTrips: 0,
    averageRating: 0,
    totalEarnings: 0
  };

  // Upcoming Trips
  upcomingTrips: Trip[] = [];

  // Notifications
  notifications: Notification[] = [];

  currentUserEmail: string = '';
  hasBankAccount: boolean = true;
  currentUserId: number | null = null;
  // Modal properties
  showBookingRequestModal: boolean = false;
  selectedBooking: any = null;
  showCongratulationsModal: boolean = false;
  congratulationsData: any = null;


  constructor(
    private router: Router,
    private http: HttpClient,
    private userProfileService: UserProfileService,
    private notificationService: NotificationService,
    private offerService: OfferService,
    private bookingService: BookingService
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
      this.currentUserEmail = user.email;
      this.currentUserId = user.id;

      this.checkBankAccount();

      this.loadUserStats(user.email);
      // Load earnings from payment API
      this.loadEarnings(user.email);

      this.loadUpcomingTrips(user.email);
      this.loadNotifications(user.email);
    } else {
      this.isLoading = false;
    }
  }


  parseGermanDate(dateString: string): Date {
    if (!dateString) return new Date();
    const parts = dateString.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateString); // fallback
  }

  loadUpcomingTrips(email: string): void {
    forkJoin({
      offers: this.offerService.getMyOffers(email)
    }).subscribe({
      next: (res: any) => {
        let trips: Trip[] = [];

        if (res.offers && res.offers.length > 0) {
          let pendingRequests = res.offers.length;
          res.offers.forEach((offer: any) => {
            if (offer.status !== 'COMPLETED') {
              this.bookingService.getBookingsForTrip(offer.id).subscribe((bookings: any[]) => {
                const hasConfirmedBooking = bookings.some((b: any) => b.status === 'CONFIRMED' || b.isPaid);
                if (hasConfirmedBooking) {
                  trips.push({
                    id: offer.id ? offer.id.toString() : '',
                    date: this.parseGermanDate(offer.date),
                    route: offer.route || (offer.from + ' -> ' + offer.to),
                    time: offer.time || '12:00 Uhr',
                    vehicle: offer.vehicleType || 'Transporter',
                    maxWeight: offer.maxWeight || 0,
                    status: 'confirmed'
                  });
                }

                pendingRequests--;
                if (pendingRequests === 0) {
                  this.upcomingTrips = trips.sort((a,b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
                }
              });
            } else {
              pendingRequests--;
              if (pendingRequests === 0) {
                this.upcomingTrips = trips.sort((a,b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
              }
            }
          });
        } else {
          this.upcomingTrips = trips.sort((a,b) => a.date.getTime() - b.date.getTime()).slice(0, 5);
        }
      },
      error: (err: any) => console.error('Error loading trips', err)
    });
  }

  loadNotifications(email: string): void {
    this.notificationService.getUserNotifications(email).subscribe({
      next: (notifications: any[]) => {
        // Show only the 3 most recent notifications
        this.notifications = notifications.slice(0, 3);
      },
      error: (error: any) => {
        console.error('Error loading notifications:', error);
        this.notifications = [];
      }
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
      case 'offer': return '📝';
      case 'offer-status': return '✅';
      default: return '📢';
    }
  }

  // Quick actions
  onNewOffer(): void {
    console.log('New offer clicked');
    this.router.navigate(['/my-trips'], { queryParams: { tab: 'booked' } });
    // TODO: Later open create trip modal
  }

  onSearchTransport(): void {
    console.log('Search transport clicked');
    this.router.navigate(['/search']);
    // TODO: Create search page
  }

  onViewAllTrips(): void {
    console.log('View all trips clicked');
    this.router.navigate(['/my-trips'], { queryParams: { tab: 'booked' } });
  }

  onViewAllNotifications(): void {
    console.log('View all notifications clicked');
    alert('Die Seite "Alle Benachrichtigungen" befindet sich noch im Aufbau. Bitte nutzen Sie das Glocken-Symbol oben rechts.');
    // TODO: Create notifications page
  }

  onTripAction(trip: Trip): void {
    console.log('Trip action:', trip.id);
    this.router.navigate(['/my-trips'], { queryParams: { tab: 'booked' } });
    // TODO: Navigate to specific trip details
  }

  onNotificationClick(notification: Notification): void {
    if (notification.type === 'booking' && notification.relatedData) {
      this.selectedBooking = notification.relatedData;
      this.showBookingRequestModal = true;
    } else if (notification.type === 'booking-confirmed' && notification.relatedData) {
      this.congratulationsData = notification.relatedData;
      this.showCongratulationsModal = true;
    } else if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
  }

  onBookingRequestModalClose(): void {
    this.showBookingRequestModal = false;
    this.selectedBooking = null;
  }

  onBookingAccepted(booking: any): void {
    console.log('Booking accepted:', booking);
    if (this.currentUserEmail) {
      this.loadNotifications(this.currentUserEmail);
    }
    alert('Buchung erfolgreich angenommen! Der Fahrgast wurde benachrichtigt.');
  }

  onBookingRejected(booking: any): void {
    console.log('Booking rejected:', booking);
    if (this.currentUserEmail) {
      this.loadNotifications(this.currentUserEmail);
    }
    alert('Buchung abgelehnt. Der Fahrgast wurde benachrichtigt.');
  }

  onCongratulationsClose(): void {
    this.showCongratulationsModal = false;
    this.congratulationsData = null;
  }

  onGoToPayment(): void {
    if (this.congratulationsData && this.congratulationsData.fahrt && this.congratulationsData.fahrt.id) {
      this.showCongratulationsModal = false;
      this.router.navigate(['/offer', this.congratulationsData.fahrt.id]);
    }
  }


  checkBankAccount(): void {
    if (!this.currentUserId) return;

    this.http.get<any>(`http://localhost:8080/api/driver-payout-accounts/driver/${this.currentUserId}`)
      .subscribe({
        next: (account: any) => {
          this.hasBankAccount = !!account && !!account.isActive;
        },
        error: (error: any) => {
          console.error('Error fetching bank account:', error);
          this.hasBankAccount = false; // Missing or failed
        }
      });
  }
}
