import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { OfferManagementModalComponent } from '../offer-management-modal/offer-management-modal.component';
import { RequestService, TransportRequest } from '../../services/request.service';
import { RequestOfferService } from '../../services/request-offer.service';

interface Request {
  id: string;
  route: string;
  date: Date;
  time: string;
  itemCategory: 'Möbel' | 'Umzug' | 'Pakete' | 'Sonstiges';
  description: string;
  weight: number;
  dimensions: string;
  price: number;
  status: 'active' | 'inactive';
  responses: number;
  createdAt: Date;
  mappedFahrtId?: number;
}

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ConfirmationModalComponent, OfferManagementModalComponent],
  templateUrl: './my-requests.component.html',
  styleUrls: ['./my-requests.component.css']
})
export class MyRequestsComponent implements OnInit {

  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  categoryFilter: 'all' | 'Möbel' | 'Umzug' | 'Pakete' | 'Sonstiges' = 'all';
  sortBy: 'date' | 'price' | 'status' = 'date';
  isLoading: boolean = false;

  // Modal
  showDeleteModal: boolean = false;
  requestToDelete: Request | null = null;
  showOfferModal: boolean = false;
  selectedRequestForOffers: TransportRequest | null = null;

  // Data from backend
  requests: Request[] = [];
  backendRequests: TransportRequest[] = [];
  offerCounts: Map<string, number> = new Map();

  constructor(
    private router: Router,
    private requestService: RequestService,
    private offerService: RequestOfferService
  ) {}

  ngOnInit(): void {
    // Load user's requests from backend
    this.loadMyRequests();
  }

  loadMyRequests(): void {
    this.isLoading = true;

    // Get current user's email
    const userStr = localStorage.getItem('currentUser');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const userEmail = currentUser?.email;

    if (!userEmail) {
      console.warn('No user email found, cannot load requests');
      this.isLoading = false;
      return;
    }

    // Load requests from backend
    this.requestService.getMyRequests(userEmail).subscribe({
      next: (backendData) => {
        this.backendRequests = backendData;
        this.requests = this.mapBackendToFrontend(backendData);
        this.loadOfferCounts();
        this.isLoading = false;
        console.log('Loaded', this.requests.length, 'requests from backend');
      },
      error: (error) => {
        console.error('Error loading requests:', error);
        this.isLoading = false;
        // Fallback to empty array on error
        this.requests = [];
      }
    });
  }

  loadOfferCounts(): void {
    // Load offer counts for all requests
    this.requests.forEach(request => {
      const requestId = parseInt(request.id);
      this.offerService.getOffersByRequest(requestId).subscribe({
        next: (offers) => {
          this.offerCounts.set(request.id, offers.length);
          // Update the responses count in request object
          request.responses = offers.length;
        },
        error: (err) => {
          console.error(`Error loading offers for request ${request.id}:`, err);
        }
      });
    });
  }

  getOfferCount(requestId: string): number {
    return this.offerCounts.get(requestId) || 0;
  }

  /**
   * Map backend TransportRequest to frontend Request interface
   */
  mapBackendToFrontend(backendRequests: TransportRequest[]): Request[] {
    return backendRequests.map(req => {
      const kategorie = this.mapKategorie(req.kategorie);
      const status = req.status?.toUpperCase() === 'ACTIVE' ? 'active' : 'inactive';

      return {
        id: req.id?.toString() || '',
        route: `${req.startOrt} → ${req.zielOrt}`,
        date: req.datum ? new Date(req.datum) : new Date(),
        time: req.uhrzeit || '',
        itemCategory: kategorie,
        description: req.beschreibung || '',
        weight: req.gewicht || 0,
        dimensions: req.abmessungen || '',
        price: Number(req.maxPreis) || 0,
        status: status,
        responses: 0, // TODO: Get actual count from RequestOffer table
        createdAt: req.erstelltAm ? new Date(req.erstelltAm) : new Date(),
        mappedFahrtId: req.fahrtId
      };
    });
  }

  /**
   * Map backend kategorie to frontend categories
   */
  mapKategorie(kategorie?: string): 'Möbel' | 'Umzug' | 'Pakete' | 'Sonstiges' {
    const lowerKat = kategorie?.toLowerCase() || '';

    if (lowerKat.includes('möbel') || lowerKat.includes('mobel')) return 'Möbel';
    if (lowerKat.includes('umzug')) return 'Umzug';
    if (lowerKat.includes('paket')) return 'Pakete';

    return 'Sonstiges';
  }

  get filteredRequests(): Request[] {
    let filtered = [...this.requests];

    // Filter by status
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === this.statusFilter);
    }

    // Filter by category
    if (this.categoryFilter !== 'all') {
      filtered = filtered.filter(req => req.itemCategory === this.categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'date':
          return a.date.getTime() - b.date.getTime();
        case 'price':
          return b.price - a.price;
        case 'status':
          // Active first, then inactive
          if (a.status === 'active' && b.status === 'inactive') return -1;
          if (a.status === 'inactive' && b.status === 'active') return 1;
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  }

  getActiveCount(): number {
    return this.requests.filter(r => r.status === 'active').length;
  }

  getInactiveCount(): number {
    return this.requests.filter(r => r.status === 'inactive').length;
  }

  formatDate(date: Date): { day: string; month: string } {
    const months = ['JAN', 'FEB', 'MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEZ'];
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: months[date.getMonth()]
    };
  }

  getStatusClass(status: string): string {
    return {
      'active': 'status-active',
      'inactive': 'status-inactive'
    }[status] || '';
  }

  getStatusText(status: string): string {
    return {
      'active': 'Aktiv',
      'inactive': 'Inaktiv'
    }[status] || status;
  }

  getCategoryIcon(category: string): string {
    return {
      'Möbel': '🪑',
      'Umzug': '📦',
      'Pakete': '📮',
      'Sonstiges': '📋'
    }[category] || '📋';
  }

  onCreateNewRequest(): void {
    this.router.navigate(['/create-request']);
  }

  onViewRequest(request: Request): void {
    if (request.status === 'inactive' && request.mappedFahrtId) {
      // If it's accepted and linked to a journey, view the confirmed journey instead!
      this.router.navigate(['/offer', request.mappedFahrtId]);
    } else {
      this.router.navigate(['/request', request.id]);
    }
  }

  onEdit(request: Request): void {
    // Navigate to create-request with edit mode
    // Pass the request ID as query parameter so the form can load and edit it
    this.router.navigate(['/create-request'], {
      queryParams: { editId: request.id }
    });
  }

  onDelete(request: Request): void {
    this.requestToDelete = request;
    this.showDeleteModal = true;
  }

  onConfirmDelete(): void {
    if (this.requestToDelete) {
      this.isLoading = true;

      // Get current user's email for authorization
      const userStr = localStorage.getItem('currentUser');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const userEmail = currentUser?.email || '';

      // Call backend API to delete
      this.requestService.deleteRequest(this.requestToDelete.id, userEmail).subscribe({
        next: (success) => {
          this.isLoading = false;
          if (success) {
            // Remove from both local arrays
            this.requests = this.requests.filter(r => r.id !== this.requestToDelete!.id);
            this.backendRequests = this.backendRequests.filter(r => String(r.id) !== String(this.requestToDelete!.id));
            console.log('Deleted request:', this.requestToDelete!.id);
            // Close modal after successful deletion
            this.showDeleteModal = false;
            this.requestToDelete = null;
          } else {
            alert('Fehler beim Löschen der Anfrage. Bitte versuche es erneut.');
            this.showDeleteModal = false;
            this.requestToDelete = null;
          }
        },
        error: (err) => {
          console.error('Error deleting request:', err);
          alert('Fehler beim Löschen der Anfrage. Bitte versuche es erneut.');
          this.isLoading = false;
          this.showDeleteModal = false;
          this.requestToDelete = null;
        }
      });
    } else {
      // No request to delete, just close modal
      this.showDeleteModal = false;
      this.requestToDelete = null;
    }
  }

  onCancelDelete(): void {
    this.showDeleteModal = false;
    this.requestToDelete = null;
  }

  onViewResponses(request: Request): void {
    // Find the full backend request object
    console.log('Looking for request with ID:', request.id);
    console.log('Available backend requests:', this.backendRequests.map(r => ({ id: r.id, type: typeof r.id })));

    const backendRequest = this.backendRequests.find(r => String(r.id) === String(request.id));

    if (backendRequest) {
      console.log('Found backend request:', backendRequest);
      this.selectedRequestForOffers = backendRequest;
      this.showOfferModal = true;
    } else {
      console.error('Backend request not found for ID:', request.id);
      alert('Fehler: Anfrage nicht gefunden. Bitte lade die Seite neu.');
    }
  }

  closeOfferModal(): void {
    this.showOfferModal = false;
    this.selectedRequestForOffers = null;
  }

  onOfferUpdated(): void {
    // Reload offer counts when an offer is accepted/rejected
    this.loadOfferCounts();
  }
}
