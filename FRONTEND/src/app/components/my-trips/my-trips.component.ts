import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { ReviewService } from '../../services/review.service';
import { OfferService } from '../../services/offer.service';

interface Trip {
  id: string;
  route: string;
  date: Date;
  time: string;
  vehicle: string;
  maxWeight: number;
  dimensions: string;
  price: number;
  requests: number;
  customer?: string;
  status: 'active' | 'request' | 'confirmed' | 'completed';
  type: 'offer' | 'booked';
  hasReview?: boolean;
}

@Component({
  selector: 'app-my-trips',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SidebarComponent, ConfirmationModalComponent],
  templateUrl: './my-trips.component.html',
  styleUrls: ['./my-trips.component.css']
})
export class MyTripsComponent implements OnInit {

  activeTab: 'offers' | 'booked' | 'completed' = 'offers';
  statusFilter: string = 'all';
  sortBy: string = 'date';

  // Modal
  showDeleteModal: boolean = false;
  tripToDelete: Trip | null = null;

  trips: Trip[] = [
    {
      id: '1',
      route: 'Berlin → Hamburg',
      date: new Date(2026, 0, 15),
      time: '08:00 Uhr',
      vehicle: 'Transporter',
      maxWeight: 100,
      dimensions: '200x150x120 cm',
      price: 65,
      requests: 2,
      status: 'active',
      type: 'offer'
    },
    {
      id: '2',
      route: 'München → Stuttgart',
      date: new Date(2026, 0, 18),
      time: '14:00 Uhr',
      vehicle: 'PKW',
      maxWeight: 50,
      dimensions: '120x80x60 cm',
      price: 45,
      requests: 1,
      customer: 'Sarah K.',
      status: 'request',
      type: 'offer'
    },
    {
      id: '3',
      route: 'Köln → Frankfurt',
      date: new Date(2026, 0, 20),
      time: '10:00 Uhr',
      vehicle: 'Transporter',
      maxWeight: 150,
      dimensions: '250x180x150 cm',
      price: 70,
      requests: 0,
      customer: 'Michael B.',
      status: 'confirmed',
      type: 'booked'
    },
    {
      id: '4',
      route: 'Hamburg → Berlin',
      date: new Date(2026, 0, 23),
      time: '09:00 Uhr',
      vehicle: 'Transporter',
      maxWeight: 100,
      dimensions: '200x150x120 cm',
      price: 65,
      requests: 0,
      status: 'active',
      type: 'offer'
    },
    {
      id: '5',
      route: 'Dortmund → Düsseldorf',
      date: new Date(2026, 0, 25),
      time: '16:00 Uhr',
      vehicle: 'Kastenwagen',
      maxWeight: 80,
      dimensions: '180x120x100 cm',
      price: 50,
      requests: 3,
      status: 'active',
      type: 'offer'
    },
    {
      id: '6',
      route: 'Frankfurt → Berlin',
      date: new Date(2026, 0, 28),
      time: '07:00 Uhr',
      vehicle: 'Sprinter',
      maxWeight: 200,
      dimensions: '300x200x180 cm',
      price: 120,
      requests: 1,
      customer: 'Anna M.',
      status: 'request',
      type: 'offer'
    },
    {
      id: '7',
      route: 'Nürnberg → München',
      date: new Date(2026, 1, 2),
      time: '13:00 Uhr',
      vehicle: 'PKW',
      maxWeight: 40,
      dimensions: '100x80x60 cm',
      price: 35,
      requests: 0,
      status: 'active',
      type: 'offer'
    },
    {
      id: '8',
      route: 'Leipzig → Dresden',
      date: new Date(2026, 1, 5),
      time: '11:00 Uhr',
      vehicle: 'Transporter',
      maxWeight: 120,
      dimensions: '220x150x130 cm',
      price: 55,
      requests: 0,
      customer: 'Thomas L.',
      status: 'confirmed',
      type: 'booked'
    },
    {
      id: '9',
      route: 'Bremen → Hamburg',
      date: new Date(2026, 1, 8),
      time: '15:30 Uhr',
      vehicle: 'Kastenwagen',
      maxWeight: 70,
      dimensions: '160x110x90 cm',
      price: 45,
      requests: 2,
      status: 'active',
      type: 'offer'
    },
    {
      id: '10',
      route: 'Hannover → Berlin',
      date: new Date(2026, 1, 12),
      time: '09:30 Uhr',
      vehicle: 'Transporter',
      maxWeight: 150,
      dimensions: '240x160x140 cm',
      price: 85,
      requests: 0,
      customer: 'Lisa W.',
      status: 'confirmed',
      type: 'booked'
    },
    {
      id: '11',
      route: 'Stuttgart → München',
      date: new Date(2025, 11, 10),
      time: '11:00 Uhr',
      vehicle: 'PKW',
      maxWeight: 50,
      dimensions: '100x80x60 cm',
      price: 40,
      requests: 0,
      customer: 'Anna M.',
      status: 'completed',
      type: 'booked',
      hasReview: false
    },
    {
      id: '12',
      route: 'Frankfurt → Köln',
      date: new Date(2025, 11, 5),
      time: '15:00 Uhr',
      vehicle: 'Transporter',
      maxWeight: 120,
      dimensions: '180x140x100 cm',
      price: 55,
      requests: 0,
      customer: 'Peter L.',
      status: 'completed',
      type: 'offer',
      hasReview: true
    },
    {
      id: '13',
      route: 'Berlin → München',
      date: new Date(2025, 10, 28),
      time: '08:00 Uhr',
      vehicle: 'Sprinter',
      maxWeight: 250,
      dimensions: '350x220x200 cm',
      price: 180,
      requests: 0,
      customer: 'Michael S.',
      status: 'completed',
      type: 'booked',
      hasReview: false
    },
    {
      id: '14',
      route: 'Hamburg → Frankfurt',
      date: new Date(2025, 10, 20),
      time: '10:30 Uhr',
      vehicle: 'Transporter',
      maxWeight: 130,
      dimensions: '230x150x120 cm',
      price: 95,
      requests: 0,
      customer: 'Julia H.',
      status: 'completed',
      type: 'offer',
      hasReview: false
    },
    {
      id: '15',
      route: 'Köln → Berlin',
      date: new Date(2025, 10, 15),
      time: '07:30 Uhr',
      vehicle: 'Kastenwagen',
      maxWeight: 90,
      dimensions: '190x130x110 cm',
      price: 75,
      requests: 0,
      customer: 'Sebastian K.',
      status: 'completed',
      type: 'booked',
      hasReview: false
    }
  ];

  constructor(
    private router: Router,
    private reviewService: ReviewService,
    private offerService: OfferService
  ) {}

  ngOnInit(): void {
    // Load user's own offers from OfferService
    this.loadMyOffers();

    // Update hasReview status for all trips
    this.trips = this.trips.map(trip => ({
      ...trip,
      hasReview: this.reviewService.hasReview(trip.id)
    }));
  }

  loadMyOffers(): void {
    const myOffers = this.offerService.getMyOffers();
    console.log('Loading my offers:', myOffers.length);

    // Convert TransportOffer to Trip format and add to trips array
    myOffers.forEach(offer => {
      // Check if already exists (avoid duplicates)
      const exists = this.trips.some(t => t.id === offer.id);
      if (!exists) {
        const trip: Trip = {
          id: offer.id,
          route: offer.route,
          date: this.parseGermanDate(offer.date),
          time: offer.time,
          vehicle: offer.vehicleType,
          maxWeight: offer.maxWeight,
          dimensions: offer.dimensions,
          price: offer.price,
          requests: 0,
          status: 'active',
          type: 'offer',
          hasReview: false
        };
        this.trips.push(trip);
      }
    });
  }

  // Helper to parse German date format (DD.MM.YYYY)
  parseGermanDate(dateString: string): Date {
    const parts = dateString.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date();
  }

  setTab(tab: 'offers' | 'booked' | 'completed'): void {
    this.activeTab = tab;
  }

  get filteredTrips(): Trip[] {
    let filtered = [...this.trips];

    // Filter by tab
    if (this.activeTab === 'offers') {
      filtered = filtered.filter(t => t.type === 'offer' && t.status !== 'completed');
    } else if (this.activeTab === 'booked') {
      filtered = filtered.filter(t => t.type === 'booked' && t.status !== 'completed');
    } else if (this.activeTab === 'completed') {
      filtered = filtered.filter(t => t.status === 'completed');
    }

    // Filter by status
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === this.statusFilter);
    }

    // Sort
    if (this.sortBy === 'date') {
      filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
    } else if (this.sortBy === 'price') {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }

  getTabCount(tab: 'offers' | 'booked' | 'completed'): number {
    if (tab === 'offers') {
      return this.trips.filter(t => t.type === 'offer' && t.status !== 'completed').length;
    } else if (tab === 'booked') {
      return this.trips.filter(t => t.type === 'booked' && t.status !== 'completed').length;
    } else {
      return this.trips.filter(t => t.status === 'completed').length;
    }
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'active': return 'Aktiv';
      case 'request': return 'Anfrage offen';
      case 'confirmed': return 'Bestätigt';
      case 'completed': return 'Abgeschlossen';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'active': return 'status-active';
      case 'request': return 'status-request';
      case 'confirmed': return 'status-confirmed';
      case 'completed': return 'status-completed';
      default: return '';
    }
  }

  formatDate(date: Date): { day: string, month: string } {
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return { day, month: `${month} ${year}` };
  }

  onCreateNewTrip(): void {
    console.log('Navigate to create trip page');
    this.router.navigate(['/offer/create']);
  }

  onEdit(trip: Trip): void {
    console.log('Edit trip:', trip);
    alert('Bearbeiten - Diese Funktion wird noch implementiert');
  }

  onDelete(trip: Trip): void {
    console.log('Delete clicked for:', trip);
    this.tripToDelete = trip;
    this.showDeleteModal = true;
  }

  onConfirmDelete(): void {
    console.log('Confirm delete');
    if (this.tripToDelete) {
      // Delete from OfferService if it's a user's offer
      this.offerService.deleteOffer(this.tripToDelete.id);

      // Remove from trips array
      const index = this.trips.findIndex(t => t.id === this.tripToDelete!.id);
      if (index > -1) {
        this.trips.splice(index, 1);

        // Update hasReview for remaining trips
        this.trips = this.trips.map(trip => ({
          ...trip,
          hasReview: this.reviewService.hasReview(trip.id)
        }));
      }
    }
    this.showDeleteModal = false;
    this.tripToDelete = null;
  }

  onCancelDelete(): void {
    console.log('Cancel delete');
    this.showDeleteModal = false;
    this.tripToDelete = null;
  }

  onViewRequests(trip: Trip): void {
    console.log('View requests for trip:', trip);
    alert('Anfragen ansehen - Diese Funktion wird noch implementiert');
  }

  onViewDetails(trip: Trip): void {
    console.log('View details for trip:', trip);
    this.router.navigate(['/tracking', trip.id]);
  }

  onContact(trip: Trip): void {
    console.log('Contact customer:', trip.customer);
    this.router.navigate(['/messages']);
  }

  onWriteReview(trip: Trip): void {
    console.log('Write review for trip:', trip);
    this.router.navigate(['/review/create', trip.id]);
  }
}
