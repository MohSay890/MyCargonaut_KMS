import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { ReviewService } from '../../services/review.service';
import { OfferService, TransportOffer } from '../../services/offer.service';
import { BookingService } from '../../services/booking.service';

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
  bookingId?: number;
  bookingStatus?: string;
  isPaid?: boolean;
  isDriver?: boolean;
}

@Component({
  selector: 'app-my-trips',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ConfirmationModalComponent],
  templateUrl: './my-trips.component.html',
  styleUrls: ['./my-trips.component.css']
})
export class MyTripsComponent implements OnInit {

  activeTab: 'offers' | 'booked' | 'completed' = 'offers';
  statusFilter: string = 'all';
  sortBy: string = 'date';
  isLoading: boolean = false;
  isDeleting: boolean = false;

  // Modal
  showDeleteModal: boolean = false;
  tripToDelete: Trip | null = null;

  // Only keep mock data for booked/completed trips (demo purposes)
  // Real offers will be loaded from backend
  trips: Trip[] = [];

  constructor(
    private router: Router,
    private reviewService: ReviewService,
    private offerService: OfferService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    // Load user's own offers from OfferService
    this.loadMyOffers();
  }

  loadMyOffers(): void {
    this.isLoading = true;

    // Get current user's email to filter offers from localStorage
    const userStr = localStorage.getItem('currentUser');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const userEmail = currentUser?.email;

    if (!userEmail) {
      console.warn('No user email found, cannot load user-specific offers');
      this.isLoading = false;
      return;
    }

    // Load ONLY the current user's offers from backend
    this.offerService.getMyOffers(userEmail).subscribe({
      next: (offers) => {
        console.log('Loading MY offers from backend:', offers.length, 'for user:', userEmail);
        
        // Also load confirmed bookings to check if offers are booked
        this.bookingService.getConfirmedBookingsForCreator(userEmail).subscribe({
          next: (creatorBookings) => {
            const bookedFahrtIds = new Set(creatorBookings.map(b => b.fahrt?.id?.toString() || ''));
            
            // Convert TransportOffer to Trip format and add to trips array
            offers.forEach(offer => {
              // Check if already exists (avoid duplicates)
              const exists = this.trips.some(t => t.id === offer.id);
              if (!exists) {
                const isBookedOffer = bookedFahrtIds.has(offer.id);
                
                let tripStatus: 'active' | 'completed' | 'confirmed' | 'request' = 'active';
                let customerName: string | undefined = undefined;

                if (offer.status && offer.status.toLowerCase() === 'completed') {
                   tripStatus = 'completed';
                   if (isBookedOffer) {
                       const booking = creatorBookings.find(b => b.fahrt?.id?.toString() === offer.id);
                       if (booking && booking.mitfahrer) {
                           customerName = (booking.mitfahrer.vorname + ' ' + booking.mitfahrer.nachname).trim();
                       }
                   }
                } else if (isBookedOffer) {
                   tripStatus = 'confirmed';
                   const booking = creatorBookings.find(b => b.fahrt?.id?.toString() === offer.id);
                   if (booking && booking.mitfahrer) {
                       customerName = (booking.mitfahrer.vorname + ' ' + booking.mitfahrer.nachname).trim();
                   }
                }

                const trip: Trip = {
                  id: offer.id,
                  route: offer.route,
                  date: this.parseGermanDate(offer.date),
                  time: offer.time || '08:00 Uhr',
                  vehicle: offer.vehicleType || 'Transporter',
                  maxWeight: offer.maxWeight || 100,
                  dimensions: offer.dimensions || '200x150x120 cm',
                  price: offer.price,
                  requests: 0,
                  customer: customerName,
                  status: tripStatus as any,
                  type: isBookedOffer ? 'booked' : 'offer',
                  isDriver: true,
                  hasReview: false
                };
                // Add new offers at the beginning
                this.trips.unshift(trip);
                this.reviewService.hasUserReviewedTrip(parseInt(trip.id), userEmail).subscribe(hasReview => trip.hasReview = hasReview);
              }
            });

            // After loading offers, load the user's bookings as a passenger
            this.loadMyBookings(userEmail);
          },
          error: (error) => {
             console.error('Error loading creator bookings:', error);
             // fallback
             this.loadMyBookings(userEmail);
          }
        });
      },
      error: (error) => {
        console.error('Error loading offers:', error);
        // Try getting bookings anyway
        this.loadMyBookings(userEmail);
      }
    });
  }

  loadMyBookings(userEmail: string): void {
    this.bookingService.getBookingsByPassenger(userEmail).subscribe({
      next: (bookings) => {
         bookings.forEach(b => {
            const f = b.fahrt;
            if(!f) return;
            
            // Map booking to Trip
            const route = f.startOrt && f.zielOrt ? `${f.startOrt} → ${f.zielOrt}` : 'Unbekannte Route';
            
            // Parse fahrt date properly - it might be an array [YYYY, MM, DD] or string
            let dateObj = new Date();
            if (Array.isArray(f.datum) && f.datum.length >= 3) {
               dateObj = new Date(f.datum[0], f.datum[1] - 1, f.datum[2]);
            } else if (f.datum) {
               dateObj = new Date(f.datum);
            }
            
            let statusMapped: 'active' | 'request' | 'confirmed' | 'completed' = 'confirmed';
            if (f.status && f.status.toString().toLowerCase() === 'completed') {
               statusMapped = 'completed';
            } else if (b.status === 'PENDING') {
               statusMapped = 'request';
            }
            
            const trip: Trip = {
               id: f.id ? f.id.toString() : `booking_${b.id}`,
               route: route,
               date: dateObj,
               time: f.uhrzeit || '12:00 Uhr',
               vehicle: f.fahrzeugModell || f.fahrzeugTyp || 'Transporter',
               maxWeight: f.freiePlaetze || 100,
               dimensions: f.abmessungen || '200x150x120 cm',
               price: f.preis || 0,
               requests: 0,
               customer: f.erstellerName || 'Unbekannt',
               status: statusMapped,
               type: 'booked',
               bookingId: b.id,
               bookingStatus: b.status,
               isPaid: b.isPaid || false,
               hasReview: false
            };
            
            this.trips.push(trip);
              if(!isNaN(parseInt(trip.id))) {
                 this.reviewService.hasUserReviewedTrip(parseInt(trip.id), userEmail).subscribe(hasReview => trip.hasReview = hasReview);
              }
         });
         
         // Sort finally
         this.trips.sort((a, b) => b.date.getTime() - a.date.getTime());
         
         this.isLoading = false;
      },
      error: (err) => {
         console.error('Error loading bookings', err);
         this.isLoading = false;
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
    // Only allow editing real backend trips (not mock data)
    if (trip.id.startsWith('mock_')) {
      alert('Demo-Daten können nicht bearbeitet werden.');
      return;
    }
    // Navigate to edit page with trip ID
    this.router.navigate(['/offer/edit', trip.id]);
  }

  onDelete(trip: Trip): void {
    console.log('Delete clicked for:', trip);
    this.tripToDelete = trip;
    this.showDeleteModal = true;
  }

  onConfirmDelete(): void {
    console.log('Confirm delete');
    if (this.tripToDelete) {
      this.isDeleting = true;

      // Check if this is mock data (starts with 'mock_')
      if (this.tripToDelete.id.startsWith('mock_')) {
        // For mock data, just remove from local array (no backend call)
        const index = this.trips.findIndex(t => t.id === this.tripToDelete!.id);
        if (index > -1) {
          this.trips.splice(index, 1);
        }
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.tripToDelete = null;
        return;
      }

      // Get current user email for authorization from localStorage
      const userStr = localStorage.getItem('currentUser');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const userEmail = currentUser?.email;

      console.log('DELETE TRIP - Current user:', currentUser);
      console.log('DELETE TRIP - User email to send:', userEmail);
      console.log('DELETE TRIP - Trip to delete:', this.tripToDelete);

      // Delete from backend via OfferService (real data only, with authorization)
      this.offerService.deleteOffer(this.tripToDelete.id, userEmail).subscribe({
        next: (success) => {
          if (success) {
            // Remove from trips array
            const index = this.trips.findIndex(t => t.id === this.tripToDelete!.id);
            if (index > -1) {
              this.trips.splice(index, 1);
            }
          } else {
            alert('Sie können nur Ihre eigenen Angebote löschen.');
          }
          this.isDeleting = false;
          this.showDeleteModal = false;
          this.tripToDelete = null;
        },
        error: (error) => {
          console.error('Error deleting offer:', error);
          this.isDeleting = false;
          this.showDeleteModal = false;
          this.tripToDelete = null;
          alert('Fehler beim Löschen. Bitte versuche es erneut.');
        }
      });
    }
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

  onStartTracking(trip: Trip): void {
    // Navigate driver to tracking page to create tracking
    this.router.navigate(['/tracking/driver'], { queryParams: { fahrtId: trip.id }});
  }

  onViewDetails(trip: Trip): void {
    console.log('View details for trip:', trip);
    if (trip.type === 'booked' && !trip.isPaid && trip.status === 'confirmed') {
      this.router.navigate(['/offer-detail', trip.id]);
    } else {
      this.router.navigate(['/offer-detail', trip.id]);
    }
  }

  onPayNow(trip: Trip): void {
    console.log('Directing to payment for trip:', trip);
    this.router.navigate(['/offer-detail', trip.id], { queryParams: { pay: 'true' } });
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
