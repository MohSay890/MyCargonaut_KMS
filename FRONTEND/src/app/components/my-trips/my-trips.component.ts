import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { ReviewService } from '../../services/review.service';
import { OfferService, TransportOffer } from '../../services/offer.service';

// 1. Das Interface: Hier muss 'customer' enthalten sein (Fix für image_111fa7.jpg)
interface Trip {
  id: string;
  route: string;
  date: Date;          // Wir nutzen hier ein echtes Date-Objekt
  time: string;
  vehicle: string;
  maxWeight: number;
  dimensions: string;
  price: number;
  requests: number;
  customer?: string;   // Wichtig für image_111fa7.jpg
  status: 'active' | 'confirmed' | 'completed' | 'request';
  type: 'offer' | 'booked';
  hasReview?: boolean;
}

@Component({
  selector: 'app-my-trips',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ConfirmationModalComponent],
  templateUrl: './my-trips.component.html',
  styleUrls: ['./my-trips.component.css']
})
export class MyTripsComponent implements OnInit {

  // 2. Fehlende Variablen (Fix für image_112724.jpg)
  activeTab: 'offers' | 'booked' | 'completed' = 'offers';
  statusFilter: string = 'all';
  sortBy: string = 'date';
  isLoading: boolean = false;
  isDeleting: boolean = false;
  trips: Trip[] = [];

  showDeleteModal: boolean = false;
  tripToDelete: Trip | null = null;

  constructor(
    private router: Router,
    private reviewService: ReviewService,
    private offerService: OfferService
  ) {}

  ngOnInit(): void {
    this.loadAllRealData();
  }

  // 3. Daten laden: Hier laden wir auch die gebuchten Transporte wieder!
  loadAllRealData(): void {
    this.isLoading = true;
    this.trips = [];

    const userStr = localStorage.getItem('currentUser');
    const userEmail = userStr ? JSON.parse(userStr).email : null;

    if (!userEmail) {
      this.isLoading = false;
      return;
    }

    // Eigene Angebote laden
    this.offerService.getMyOffers(userEmail).subscribe({
      next: (offers) => {
        // FEHLER-FIX: Nicht 'active' hartcodieren, sondern o.status nutzen!
        offers.forEach(o => this.addTripToList(o, 'offer', o.status || 'active'));
        this.isLoading = false;
      }
    });

    // Gebuchte Transporte laden
    this.offerService.getBookedTransports(userEmail).subscribe({
      next: (booked) => {
        // FEHLER-FIX: Nicht 'confirmed' hartcodieren, sondern o.status nutzen!
        booked.forEach(o => this.addTripToList(o, 'booked', o.status || 'confirmed'));
      }
    });

    // Abgeschlossene Fahrten laden
    this.offerService.getCompletedTrips(userEmail).subscribe({
      next: (completed) => {
        // Hier ist 'completed' als Fallback okay
        completed.forEach(o => this.addTripToList(o, 'booked', o.status || 'completed'));
        this.isLoading = false;
      }
    });
  }

  private addTripToList(offer: TransportOffer, type: 'offer' | 'booked', status: any): void {
    // 1. Hole den Namen des aktuell eingeloggten Nutzers (Mitfahrer Test)
    const userStr = localStorage.getItem('currentUser');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const currentUserName = currentUser?.name || currentUser?.username || 'Mitfahrer Test';

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

      // 2. LOGIK-FIX:
      // Wenn Typ 'booked', zeige den eigenen Namen (Mitfahrer)
      // Wenn Typ 'offer', zeige den Namen des Anbieters (Fahrer)
      customer: type === 'booked' ? currentUserName : offer.driverName,

      status: status,
      type: type,
      hasReview: this.reviewService.hasReview(offer.id)
    };

    this.trips = [...this.trips, trip];
  }

  // 4. Methoden für das HTML (Fix für image_112724.jpg)

  // Fix für den Typ-Fehler (image_1131d2.png): Erwartet jetzt Date
  formatDate(date: Date) {
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    return { day, month: `${months[date.getMonth()]} ${date.getFullYear()}` };
  }

  setTab(tab: 'offers' | 'booked' | 'completed'): void {
    this.activeTab = tab;
  }

  getTabCount(tab: string): number {
    if (tab === 'offers') return this.trips.filter(t => t.type === 'offer' && t.status !== 'completed').length;
    if (tab === 'booked') return this.trips.filter(t => t.type === 'booked' && t.status !== 'completed').length;
    return this.trips.filter(t => t.status === 'completed').length;
  }

  get filteredTrips(): Trip[] {
    let filtered = this.trips.filter(t => {
      if (this.activeTab === 'offers') return t.type === 'offer' && t.status !== 'completed';
      if (this.activeTab === 'booked') return t.type === 'booked' && t.status !== 'completed';
      return t.status === 'completed';
    });
    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  getStatusText(status: string): string {
    const texts: any = { active: 'Aktiv', confirmed: 'Bestätigt', completed: 'Abgeschlossen' };
    return texts[status] || status;
  }

  getStatusClass(status: string): string { return `status-${status}`; }

  // Aktionen
  onCreateNewTrip() { this.router.navigate(['/offer/create']); }
  onEdit(trip: Trip) { this.router.navigate(['/offer/edit', trip.id]); }
  onDelete(trip: Trip) { this.tripToDelete = trip; this.showDeleteModal = true; }
  onViewDetails(trip: Trip) { this.router.navigate(['/tracking', trip.id]); }
  onWriteReview(trip: Trip) { this.router.navigate(['/review/create', trip.id]); }
  onCancelDelete() { this.showDeleteModal = false; }

  onConfirmDelete() {
    if (this.tripToDelete) {
      this.isDeleting = true;
      const userStr = localStorage.getItem('currentUser');
      const email = userStr ? JSON.parse(userStr).email : '';
      this.offerService.deleteOffer(this.tripToDelete.id, email).subscribe(() => {
        this.trips = this.trips.filter(t => t.id !== this.tripToDelete!.id);
        this.showDeleteModal = false;
        this.isDeleting = false;
      });
    }
  }

  private parseGermanDate(dateStr: string): Date {
    const parts = dateStr.split('.');
    return parts.length === 3 ? new Date(+parts[2], +parts[1] - 1, +parts[0]) : new Date();
  }
}
