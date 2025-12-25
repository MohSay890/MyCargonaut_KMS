import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OfferService, TransportOffer } from '../../services/offer.service';
import { FavoritesService } from '../../services/favorites.service';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-offer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmationModalComponent],
  templateUrl: './offer-detail.component.html',
  styleUrls: ['./offer-detail.component.css']
})
export class OfferDetailComponent implements OnInit {

  offerId: string = '';
  offer: TransportOffer | null = null;
  isSaved: boolean = false;

  // Modal states
  showFavoriteModal: boolean = false;
  favoriteModalMessage: string = '';
  showBookingModal: boolean = false;
  showSuccessModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private offerService: OfferService,
    private favoritesService: FavoritesService
  ) {
    console.log('OfferDetailComponent constructor - favoritesService:', this.favoritesService);
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.offerId = params['id'];
      this.loadOffer();
    });
  }

  loadOffer(): void {
    const foundOffer = this.offerService.getOfferById(this.offerId);

    if (foundOffer) {
      this.offer = foundOffer;
      // Check if already saved
      this.isSaved = this.favoritesService.isFavorite(this.offerId);
      console.log('Offer loaded, isSaved:', this.isSaved);
    } else {
      console.error('Offer not found:', this.offerId);
      this.router.navigate(['/search']);
    }
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

    console.log('=== onToggleFavorite END ===');
    this.showFavoriteModal = true;
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
    this.showBookingModal = true;
  }

  onConfirmBooking(): void {
    console.log('Booking confirmed');
    this.showBookingModal = false;
    this.showSuccessModal = true;
  }

  onCancelBooking(): void {
    this.showBookingModal = false;
  }

  onSuccessConfirm(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/my-trips']);
  }

  onViewReviews(): void {
    console.log('View reviews for driver');
    this.router.navigate(['/reviews', this.offerId]);
  }
}
