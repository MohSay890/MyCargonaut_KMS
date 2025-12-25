import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

interface Trip {
  id: string;
  date: Date;
  route: string;
  time: string;
  vehicle: string;
  maxWeight: number;
  status: 'confirmed' | 'pending';
}

interface Notification {
  id: string;
  type: 'booking' | 'review' | 'payment';
  title: string;
  message: string;
  timestamp: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  userName: string = 'Max';

  // Stats
  stats = {
    activeOffers: 12,
    completedTrips: 45,
    averageRating: 4.8,
    totalEarnings: 1240
  };

  // Upcoming Trips
  upcomingTrips: Trip[] = [
    {
      id: '1',
      date: new Date('2024-12-15'),
      route: 'Berlin → Hamburg',
      time: '08:00 Uhr',
      vehicle: 'Transporter',
      maxWeight: 100,
      status: 'confirmed'
    },
    {
      id: '2',
      date: new Date('2024-12-18'),
      route: 'München → Stuttgart',
      time: '14:00 Uhr',
      vehicle: 'PKW',
      maxWeight: 50,
      status: 'pending'
    },
    {
      id: '3',
      date: new Date('2024-12-20'),
      route: 'Köln → Frankfurt',
      time: '10:00 Uhr',
      vehicle: 'Transporter',
      maxWeight: 150,
      status: 'confirmed'
    }
  ];

  // Notifications
  notifications: Notification[] = [
    {
      id: '1',
      type: 'booking',
      title: 'Neue Buchungsanfrage erhalten',
      message: 'Sarah K. möchte deine Fahrt Berlin → Hamburg buchen',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      id: '2',
      type: 'review',
      title: 'Neue Bewertung',
      message: 'Peter M. hat dich mit 5 Sternen bewertet',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
    },
    {
      id: '3',
      type: 'payment',
      title: 'Zahlung eingegangen',
      message: '65,00 € für die Fahrt München → Stuttgart',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('Dashboard loaded');
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
