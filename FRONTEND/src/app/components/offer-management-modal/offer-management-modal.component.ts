import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RequestOfferService, RequestOffer } from '../../services/request-offer.service';
import { TransportRequest } from '../../services/request.service';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-offer-management-modal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './offer-management-modal.component.html',
  styleUrls: ['./offer-management-modal.component.css']
})
export class OfferManagementModalComponent implements OnInit {
  @Input() request!: TransportRequest;
  @Output() close = new EventEmitter<void>();
  @Output() offerUpdated = new EventEmitter<void>();

  offers: RequestOffer[] = [];
  loading = true;
  error: string | null = null;
  processingOfferId: number | null = null;

  constructor(private offerService: RequestOfferService, private router: Router) {}

  ngOnInit() {
    this.loadOffers();
  }

  loadOffers() {
    this.loading = true;
    this.error = null;

    const requestId = parseInt(this.request.id);
    this.offerService.getOffersByRequest(requestId).subscribe({
      next: (offers) => {
        this.offers = offers;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Fehler beim Laden der Angebote';
        this.loading = false;
        console.error('Error loading offers:', err);
      }
    });
  }

  acceptOffer(offer: RequestOffer) {
    if (!confirm(`Möchten Sie das Angebot von ${offer.driverName} für €${offer.angebotspreis} annehmen?\n\nAlle anderen Angebote werden automatisch abgelehnt.`)) {
      return;
    }

    this.processingOfferId = offer.id!;
    const userEmail = this.getUserEmail();

    this.offerService.acceptOffer(offer.id!, userEmail).subscribe({
      next: (response: any) => {
        this.processingOfferId = null;
        this.offerUpdated.emit();
        if (response && response.fahrtId) {
          this.closeModal();
          this.router.navigate(['/offer', response.fahrtId]);
        } else {
          this.loadOffers();
        }
      },
      error: (err) => {
        this.processingOfferId = null;
        this.error = 'Fehler beim Akzeptieren des Angebots';
        console.error('Error accepting offer:', err);
      }
    });
  }

  rejectOffer(offer: RequestOffer) {
    if (!confirm(`Möchten Sie das Angebot von ${offer.driverName} ablehnen?`)) {
      return;
    }

    this.processingOfferId = offer.id!;
    const userEmail = this.getUserEmail();

    this.offerService.rejectOffer(offer.id!, userEmail).subscribe({
      next: () => {
        this.processingOfferId = null;
        this.offerUpdated.emit();
        this.loadOffers();
      },
      error: (err) => {
        this.processingOfferId = null;
        this.error = 'Fehler beim Ablehnen des Angebots';
        console.error('Error rejecting offer:', err);
      }
    });
  }

  closeModal() {
    this.close.emit();
  }

  getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'ACCEPTED': return 'badge-accepted';
      case 'REJECTED': return 'badge-rejected';
      case 'PENDING': return 'badge-pending';
      default: return 'badge-pending';
    }
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'ACCEPTED': return 'Akzeptiert';
      case 'REJECTED': return 'Abgelehnt';
      case 'PENDING': return 'Ausstehend';
      default: return status;
    }
  }

  getVehicleIcon(fahrzeugtyp?: string): string {
    if (!fahrzeugtyp) return '🚗';
    switch(fahrzeugtyp.toLowerCase()) {
      case 'pkw': return '🚗';
      case 'kombi': return '🚙';
      case 'transporter': return '🚚';
      case 'lkw': return '🚛';
      default: return '🚗';
    }
  }

  getRatingStars(rating?: number): string {
    if (!rating) return '☆☆☆☆☆';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
  }

  getPendingOffers(): RequestOffer[] {
    return this.offers.filter(o => o.status === 'PENDING');
  }

  getAcceptedOffers(): RequestOffer[] {
    return this.offers.filter(o => o.status === 'ACCEPTED');
  }

  getRejectedOffers(): RequestOffer[] {
    return this.offers.filter(o => o.status === 'REJECTED');
  }

  private getUserEmail(): string {
    const user = localStorage.getItem('currentUser');
    if (user) {
      const userData = JSON.parse(user);
      return userData.email || '';
    }
    return '';
  }
}
