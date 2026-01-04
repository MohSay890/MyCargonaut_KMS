import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OfferService, TransportOffer } from '../../services/offer.service';
import { FavoritesService } from '../../services/favorites.service';
import { PaymentService, PaymentResult } from '../../services/payment.service';
import { TrackingService, TrackingSession } from '../../services/tracking.service';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { PaymentModalComponent } from '../payment-modal/payment-modal.component';

@Component({
  selector: 'app-offer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmationModalComponent, PaymentModalComponent],
  templateUrl: './offer-detail.component.html',
  styleUrls: ['./offer-detail.component.css']
})
export class OfferDetailComponent implements OnInit {

  offerId: string = '';
  offer: TransportOffer | null = null;
  isSaved: boolean = false;
  isLoading: boolean = true;
  isOwnOffer: boolean = false; // True if current user created this offer
  hasAlreadyPaid: boolean = false; // True if user already paid for this offer
  currentUserEmail: string | null = null;

  // Modal states
  showFavoriteModal: boolean = false;
  favoriteModalMessage: string = '';
  showBookingModal: boolean = false;
  showPaymentModal: boolean = false;
  showSuccessModal: boolean = false;
  paymentTransactionId: string = '';

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
    private trackingService: TrackingService
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
    console.log('Send message to driver:', this.offer?.driverName);
    this.router.navigate(['/messages']);
  }

  onBookNow(): void {
    console.log('Book offer:', this.offerId);

    // Prevent booking own offer
    if (this.isOwnOffer) {
      alert('Du kannst dein eigenes Angebot nicht buchen!');
      return;
    }

    // Prevent duplicate booking
    if (this.hasAlreadyPaid) {
      alert('Du hast bereits für diese Fahrt bezahlt!');
      return;
    }

    this.showBookingModal = true;
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

    // Reload tracking - it should be created automatically after payment
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
