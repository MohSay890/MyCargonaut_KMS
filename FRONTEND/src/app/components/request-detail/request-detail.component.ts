import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RequestService, TransportRequest } from '../../services/request.service';
import { RequestOfferService, RequestOffer } from '../../services/request-offer.service';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-detail.component.html',
  styleUrls: ['./request-detail.component.css']
})
export class RequestDetailComponent implements OnInit {
  request: TransportRequest | null = null;
  offers: RequestOffer[] = [];
  loading: boolean = true;
  error: string = '';
  currentUserEmail: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requestService: RequestService,
    private offerService: RequestOfferService
  ) {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      this.currentUserEmail = user.email;
    }
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRequestDetails(id);
    } else {
      this.error = 'Keine Anfrage-ID gefunden';
      this.loading = false;
    }
  }

  loadRequestDetails(id: string): void {
    this.requestService.getRequestById(id).subscribe({
      next: (request) => {
        this.request = request;
        // Convert string ID to number for offers API
        this.loadOffers(parseInt(id, 10));
      },
      error: (err) => {
        console.error('Error loading request:', err);
        this.error = 'Fehler beim Laden der Anfrage';
        this.loading = false;
      }
    });
  }

  loadOffers(requestId: number): void {
    this.offerService.getOffersByRequest(requestId).subscribe({
      next: (offers) => {
        this.offers = offers;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading offers:', err);
        this.loading = false;
      }
    });
  }

  acceptOffer(offerId: number): void {
    if (!confirm('Möchtest du dieses Angebot wirklich annehmen?')) {
      return;
    }

    this.offerService.acceptOffer(offerId, this.currentUserEmail).subscribe({
      next: (response: any) => {
        alert('Angebot erfolgreich angenommen! Die Fahrt wurde erstellt.');
        const fahrtId = response.fahrtId || response.fahrt?.id || response.id;
        if (fahrtId) {
          this.router.navigate(['/offer-detail', fahrtId], { queryParams: { pay: 'true' } });
        } else {
          this.router.navigate(['/my-trips'], { queryParams: { tab: 'booked' } });
        }
      },
      error: (err) => {
        console.error('Error accepting offer:', err);
        alert('Fehler beim Annehmen des Angebots');
      }
    });
  }

  rejectOffer(offerId: number): void {
    if (!confirm('Möchtest du dieses Angebot wirklich ablehnen?')) {
      return;
    }

    this.offerService.rejectOffer(offerId, this.currentUserEmail).subscribe({
      next: () => {
        // Convert string ID to number for offers API
        this.loadOffers(parseInt(this.request!.id!, 10));
      },
      error: (err) => {
        console.error('Error rejecting offer:', err);
        alert('Fehler beim Ablehnen des Angebots');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/search'], { queryParams: { mode: 'requests' } });
  }

  isRequestOwner(): boolean {
    return this.request?.erstellerEmail === this.currentUserEmail;
  }
}
