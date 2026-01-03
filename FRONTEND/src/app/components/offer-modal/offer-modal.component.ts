import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequestOfferService, RequestOffer } from '../../services/request-offer.service';
import { TransportRequest } from '../../services/request.service';

@Component({
  selector: 'app-offer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './offer-modal.component.html',
  styleUrls: ['./offer-modal.component.css']
})
export class OfferModalComponent implements OnInit {
  @Input() request!: TransportRequest;
  @Input() show: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() offerCreated = new EventEmitter<void>();

  offer: Partial<RequestOffer> = {
    angebotspreis: 0,
    nachricht: '',
    fahrzeugtyp: '',
    fahrzeugmarke: ''
  };

  currentUser: any = null;
  error: string = '';
  success: string = '';
  isSubmitting: boolean = false;

  constructor(private offerService: RequestOfferService) {}

  ngOnInit() {
    // Get current user from localStorage
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  onSubmit() {
    if (!this.currentUser) {
      this.error = 'Bitte melde dich an, um ein Angebot zu erstellen.';
      return;
    }

    // Validate form
    if (!this.offer.angebotspreis || this.offer.angebotspreis <= 0) {
      this.error = 'Bitte gib einen gültigen Angebotspreis ein.';
      return;
    }

    if (this.offer.angebotspreis > this.request.maxPreis) {
      this.error = `Dein Angebot (${this.offer.angebotspreis}€) liegt über dem Budget des Nutzers (${this.request.maxPreis}€).`;
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    // Prepare offer data
    const offerData: RequestOffer = {
      requestId: Number(this.request.id!),
      driverName: this.currentUser.vorname + ' ' + this.currentUser.nachname,
      driverEmail: this.currentUser.email,
      driverAvatar: this.currentUser.avatarUrl,
      driverRating: this.currentUser.bewertung,
      angebotspreis: this.offer.angebotspreis!,
      nachricht: this.offer.nachricht,
      fahrzeugtyp: this.offer.fahrzeugtyp,
      fahrzeugmarke: this.offer.fahrzeugmarke,
      status: 'PENDING'
    };

    this.offerService.createOffer(offerData).subscribe({
      next: (response) => {
        this.success = 'Angebot erfolgreich erstellt!';
        setTimeout(() => {
          this.offerCreated.emit();
          this.closeModal();
        }, 2000);
      },
      error: (err) => {
        this.error = 'Fehler beim Erstellen des Angebots. Bitte versuche es erneut.';
        console.error(err);
        this.isSubmitting = false;
      }
    });
  }

  closeModal() {
    this.show = false;
    this.error = '';
    this.success = '';
    this.isSubmitting = false;
    // Reset form
    this.offer = {
      angebotspreis: 0,
      nachricht: '',
      fahrzeugtyp: '',
      fahrzeugmarke: ''
    };
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }
}
