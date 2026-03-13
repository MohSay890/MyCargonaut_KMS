import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OfferService, TransportOffer } from '../../services/offer.service';
import { FavoritesService } from '../../services/favorites.service';
import { PaymentService, PaymentResult } from '../../services/payment.service';
import { TrackingService, TrackingSession } from '../../services/tracking.service';
import { BookingService } from '../../services/booking.service';
import { MessageService } from '../../services/message.service';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { PaymentModalComponent } from '../payment-modal/payment-modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-offer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ConfirmationModalComponent, PaymentModalComponent],
  templateUrl: './offer-detail.component.html',
  styleUrls: ['./offer-detail.component.css']
})
export class OfferDetailComponent implements OnInit {

  offerId: string = '';
  offer: TransportOffer | null = null;
  isSaved: boolean = false;
  isLoading: boolean = true;
  isOwnOffer: boolean = false; // True if current user created this offer
  hasAlreadyPaid: boolean = false;
  isFullyBooked: boolean = false;
  hasExistingBooking: boolean = false; // True if user already has a PENDING booking request
  hasConfirmedBooking: boolean = false; // True if booking is CONFIRMED and waiting for payment
  currentUserEmail: string | null = null;
  isLoggedIn: boolean = false;

  // Modal states
  showFavoriteModal: boolean = false;
  favoriteModalMessage: string = '';
  showBookingModal: boolean = false;
  showBookingRequestModal: boolean = false; // New modal for booking request form
  showPaymentModal: boolean = false;
  showSuccessModal: boolean = false;
  paymentTransactionId: string = '';

  // Booking request form
  bookingMessage: string = '';
  bookingSeats: number = 1;
  isSubmittingBooking: boolean = false;

  // Tracking state
  trackingSession: TrackingSession | null = null;
  hasTracking: boolean = false;
  isLoadingTracking: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private offerService: OfferService,
    private favoritesService: FavoritesService,
    private paymentService: PaymentService,
    private trackingService: TrackingService,
    private bookingService: BookingService,
    private messageService: MessageService
  ) {
    console.log('OfferDetailComponent constructor - favoritesService:', this.favoritesService);
  }

  ngOnInit(): void {
    // Get current user email
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserEmail = user.email || null;
        this.isLoggedIn = !!this.currentUserEmail;
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    this.route.params.subscribe(params => {
      this.offerId = params['id'];
      this.loadOffer();
    });
  }

  loadOffer(): void {
    this.isLoading = true;

    // Use Observable-based method
    this.offerService.getOfferById(this.offerId).subscribe({
      next: (foundOffer) => {
        if (foundOffer) {
          this.offer = foundOffer;
          // Check if already saved
          this.isSaved = this.favoritesService.isFavorite(this.offerId);

          // Check if current user is the creator
          this.isOwnOffer = this.currentUserEmail !== null &&
                           foundOffer.creatorEmail !== null &&
                           this.currentUserEmail === foundOffer.creatorEmail;

          // Check if user has already paid for this offer
          this.hasAlreadyPaid = this.paymentService.hasUserPaidForOffer(this.offerId);
            this.isFullyBooked = this.paymentService.isOfferPaid(this.offerId);
          if (this.currentUserEmail) {
            this.checkExistingBooking();
          }
          this.checkIfOfferIsPaid();

          // Load tracking data if available
          this.loadTracking();

          console.log('Offer loaded - isOwnOffer:', this.isOwnOffer, 'hasAlreadyPaid:', this.hasAlreadyPaid);
        } else {
          console.error('Offer not found:', this.offerId);
          this.router.navigate(['/search']);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading offer:', error);
        this.isLoading = false;
        this.router.navigate(['/search']);
      }
    });
  }

  getStars(rating: number): string {
    return '⭐'.repeat(Math.floor(rating));
  }

  onToggleFavorite(): void {
    console.log('=== onToggleFavorite START ===');
    console.log('this.offer:', this.offer);
    console.log('this.favoritesService:', this.favoritesService);

    if (!this.offer) {
      console.log('No offer, returning');
      return;
    }

    // Prevent adding own offers to favorites
    if (this.isOwnOffer) {
      this.favoriteModalMessage = 'Du kannst dein eigenes Angebot nicht zu Favoriten hinzufügen!';
      this.showFavoriteModal = true;
      return;
    }

    this.isSaved = !this.isSaved;
    console.log('isSaved toggled to:', this.isSaved);

    if (this.isSaved) {
      console.log('BEFORE addFavorite call');

      const favoriteData = {
        id: this.offer.id,
        route: this.offer.route,
        from: this.offer.from,
        to: this.offer.to,
        date: this.offer.date,
        time: this.offer.time,
        price: this.offer.price,
        driverName: this.offer.driverName,
        driverAvatar: this.offer.driverAvatar,
        driverRating: this.offer.driverRating,
        vehicle: this.offer.vehicleType,
        maxWeight: this.offer.maxWeight,
        distance: this.offer.distance,
        savedAt: new Date()
      };

      console.log('Favorite data to add:', favoriteData);

      // Add to favorites
      this.favoritesService.addFavorite(favoriteData);

      console.log('AFTER addFavorite call');
      console.log('Check localStorage:', localStorage.getItem('mycargonaut_favorites'));

      this.favoriteModalMessage = 'Angebot wurde zu deinen Favoriten hinzugefügt! ♥';
    } else {
      console.log('Removing from favorites');
      // Remove from favorites
      this.favoritesService.removeFavorite(this.offerId);
      this.favoriteModalMessage = 'Angebot wurde aus deinen Favoriten entfernt!';
    }

    this.showFavoriteModal = true;
    console.log('=== onToggleFavorite END ===');
  }

  onFavoriteModalClose(): void {
    this.showFavoriteModal = false;
  }

  onBackToSearch(): void {
    this.router.navigate(['/search']);
  }

  onContactDriver(): void {
    console.log('Contact driver:', this.offer?.driverName);
    this.router.navigate(['/messages']);
  }

  onSendMessage(): void {
    if (!this.offer || !this.offer.creatorEmail) {
      console.error('No offer or creator email available');
      return;
    }

    console.log('Send message to driver:', this.offer.driverName, this.offer.creatorEmail);

    // Navigate to messages with recipient info in state
    this.router.navigate(['/messages'], {
      state: {
        recipientEmail: this.offer.creatorEmail,
        recipientName: this.offer.driverName,
        recipientAvatar: this.offer.driverAvatar
      }
    });
  }

  onBookNow(): void {
    console.log('Book offer:', this.offerId);

    // Prevent booking own offer
    if (this.isOwnOffer) {
      alert('Du kannst dein eigenes Angebot nicht buchen!');
      return;
    }

    // Check if user already has a booking for this trip
    if (this.hasExistingBooking) {
      alert('Du hast bereits eine Buchungsanfrage für diese Fahrt!');
      return;
    }

    // Check if user is logged in
    if (!this.currentUserEmail) {
      alert('Bitte melde dich an, um eine Buchungsanfrage zu stellen.');
      this.router.navigate(['/login']);
      return;
    }

    // Show booking request modal
    this.showBookingRequestModal = true;
  }

  onSubmitBookingRequest(): void {
    if (!this.currentUserEmail || !this.offer) {
      return;
    }

    // Validate seats
    if (this.bookingSeats < 1 || this.bookingSeats > this.offer.maxWeight) {
      alert(`Bitte wähle zwischen 1 und ${this.offer.maxWeight} Plätze(n).`);
      return;
    }

    this.isSubmittingBooking = true;

    const bookingRequest = {
      fahrtId: parseInt(this.offerId),
      passengerEmail: this.currentUserEmail,
      nachricht: this.bookingMessage || undefined,
      anzahlPlaetze: this.bookingSeats
    };

    this.bookingService.createBookingRequest(bookingRequest).subscribe({
      next: (booking) => {
        console.log('Booking request created:', booking);
        this.isSubmittingBooking = false;
        this.showBookingRequestModal = false;
        this.hasExistingBooking = true;

        // Show success message
        alert('Buchungsanfrage erfolgreich gesendet! Der Fahrer wird deine Anfrage prüfen und sich melden.');

        // Reset form
        this.bookingMessage = '';
        this.bookingSeats = 1;
      },
      error: (error) => {
        console.error('Error creating booking request:', error);
        this.isSubmittingBooking = false;

        const errorMsg = error.error?.error || 'Fehler beim Senden der Buchungsanfrage. Bitte versuche es erneut.';
        alert(errorMsg);
      }
    });
  }

  onCancelBookingRequest(): void {
    this.showBookingRequestModal = false;
    this.bookingMessage = '';
    this.bookingSeats = 1;
  }

  checkIfOfferIsPaid(): void {
    if (!this.offerId) return;
    this.bookingService.getBookingsForTrip(parseInt(this.offerId)).subscribe({
      next: (bookings) => {
        const isPaidInBackend = bookings.some(b => b.isPaid === true);
        if (isPaidInBackend) {
          this.isFullyBooked = true;
          console.log('Offer is fully booked (paid)!');
        }
      },
      error: (err) => console.error('Error checking if offer is paid:', err)
    });
  }

  checkExistingBooking(): void {
    if (!this.currentUserEmail) return;

    this.bookingService.getBookingsByPassenger(this.currentUserEmail).subscribe({
      next: (bookings) => {
        // Check if user already has a booking for this trip
        const existingBooking = bookings.find(b => b.fahrt?.id === parseInt(this.offerId));

        if (existingBooking) {
          // Only block the request button if booking is still PENDING
          this.hasExistingBooking = existingBooking.status === 'PENDING';
          // Enable payment flow if booking is CONFIRMED
          this.hasConfirmedBooking = existingBooking.status === 'CONFIRMED';

          console.log('Existing booking found:', existingBooking.status,
                     'hasExistingBooking:', this.hasExistingBooking,
                     'hasConfirmedBooking:', this.hasConfirmedBooking);
                     
          // Auto-open payment modal if ?pay=true
          if (this.hasConfirmedBooking && !this.hasAlreadyPaid) {
            this.route.queryParams.subscribe(params => {
              if (params['pay'] === 'true') {
                this.showPaymentModal = true;
              }
            });
          }
        } else {
          this.hasExistingBooking = false;
          this.hasConfirmedBooking = false;
        }
      },
      error: (error) => {
        console.error('Error checking existing booking:', error);
      }
    });
  }

  onConfirmBooking(): void {
    console.log('Booking confirmed, proceeding to payment');
    this.showBookingModal = false;
    this.showPaymentModal = true;
  }

  onCancelBooking(): void {
    this.showBookingModal = false;
  }

  onPaymentClose(): void {
    this.showPaymentModal = false;
  }

  onPaymentSuccess(result: PaymentResult): void {
    console.log('Payment successful:', result);
    this.showPaymentModal = false;
    this.paymentTransactionId = result.transactionId || '';
    this.showSuccessModal = true;
    this.hasAlreadyPaid = true; // Mark as paid to disable future booking
      this.isFullyBooked = true;
    setTimeout(() => this.loadTracking(), 2000); // Wait 2s for backend to create tracking
  }

  onPaymentError(result: PaymentResult): void {
    console.log('Payment error:', result);
    // Payment modal stays open and shows error message
  }

  onSuccessConfirm(): void {
    this.showSuccessModal = false;
    // Scroll to tracking widget after modal closes
    setTimeout(() => {
      const trackingWidget = document.querySelector('.tracking-widget');
      if (trackingWidget) {
        trackingWidget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  }

  loadTracking(): void {
    if (!this.offerId) return;

    this.isLoadingTracking = true;
    const fahrtId = parseInt(this.offerId);

    this.trackingService.getTrackingByFahrtId(fahrtId).subscribe({
      next: (session) => {
        if (session) {
          this.trackingSession = session;
          this.hasTracking = true;
          console.log('Tracking loaded:', session);
        } else {
          this.hasTracking = false;
          console.log('No tracking found for this Fahrt');
        }
        this.isLoadingTracking = false;
      },
      error: (error) => {
        console.error('Error loading tracking:', error);
        this.hasTracking = false;
        this.isLoadingTracking = false;
      }
    });
  }

  onViewTracking(): void {
    if (this.trackingSession && this.trackingSession.trackingCode) {
      // Navigate to tracking page using the tracking code
      this.router.navigate(['/tracking/code', this.trackingSession.trackingCode]);
    }
  }

  getStatusColor(statusCode: string): string {
    const colors: { [key: string]: string } = {
      'WAITING': '#9e9e9e',
      'PICKED_UP': '#2196f3',
      'IN_TRANSIT': '#4caf50',
      'NEAR_DESTINATION': '#ff9800',
      'DELIVERED': '#8bc34a',
      'DELAYED': '#f44336',
      'CANCELLED': '#607d8b'
    };
    return colors[statusCode] || '#9e9e9e';
  }

  onViewReviews(): void {
    console.log('View reviews for driver');
    this.router.navigate(['/reviews', this.offerId]);
  }
}
