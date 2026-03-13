import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OfferService, TransportOffer } from '../../services/offer.service';
import { RequestService, TransportRequest } from '../../services/request.service';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { OfferModalComponent } from '../offer-modal/offer-modal.component';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmationModalComponent, OfferModalComponent, RouterLink],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnInit {

  // Authentication
  isLoggedIn: boolean = false;
  currentUserEmail: string = '';

  // Search mode toggle
  searchMode: 'offers' | 'requests' = 'offers';

  // Search form
  searchFrom: string = '';
  searchTo: string = '';
  searchDate: string = '';
  searchCategory: string = '';
  searchWeight: number = 50;
  searchDimensions: string = '150x100x80';
  showAllJourneys: boolean = true; // Show all by default

  // Active search (applied filters)
  activeSearchDate: string = '';
  activeSearchFrom: string = '';
  activeSearchTo: string = '';
  activeSearchCategory: string = '';

  // Filters
  priceMin: number = 0;
  priceMax: number = 500;
  currentPriceMax: number = 500;

  sizeFilters = {
    small: false,    // bis 20kg
    medium: false,   // bis 50kg
    large: false,    // bis 100kg
    xlarge: false    // 100kg+
  };

  vehicleFilters = {
    car: false,
    van: false,
    truck: false,
    sprinter: false,
    lkw: false
  };

  ratingFilters = {
    rating45: false,
    rating40: false,
    rating35: false
  };

  serviceFilters = {
    insurance: false,
    loading: false,
    express: false
  };

  // Sorting
  sortBy: string = 'best';

  // Results
  allOffers: TransportOffer[] = [];
  allRequests: TransportRequest[] = [];
  isLoading: boolean = true;

  // Offer Modal
  showOfferModal: boolean = false;
  selectedRequest: TransportRequest | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // Message modal
  showMessageModal: boolean = false;
  selectedOffer: TransportOffer | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private offerService: OfferService,
    private requestService: RequestService
  ) {}

  ngOnInit(): void {
    console.log('Search results loaded');

    // Check authentication status
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.isLoggedIn = true;
        this.currentUserEmail = user.email;
      } catch (e) {
        this.isLoggedIn = false;
      }
    }

    // Read query parameters from URL
    this.route.queryParams.subscribe(params => {
      const from = params['from'] || '';
      const to = params['to'] || '';
      const date = params['date'] || '';
      const category = params['category'] || '';

      // Set search fields
      this.searchFrom = from;
      this.searchTo = to;
      this.searchDate = date;
      this.searchCategory = category;

      // Set active search (applied filters)
      this.activeSearchFrom = from;
      this.activeSearchTo = to;
      this.activeSearchDate = date;
      this.activeSearchCategory = category;

      // If we have search parameters, perform search
      if (from || to || date || category) {
        this.showAllJourneys = false;
        this.isLoading = true;
        if (this.searchMode === 'offers') {
          this.offerService.searchOffers(from, to, date, undefined, category).subscribe({
            next: (offers) => {
              this.allOffers = offers;
              this.isLoading = false;
              console.log('Search results from URL params:', offers.length);
            },
            error: (error) => {
              console.error('Error searching offers:', error);
              this.isLoading = false;
              // Fallback to loading all offers
              this.loadOffers();
            }
          });
        } else {
          this.requestService.searchRequests(from, to, date, undefined, category).subscribe({
            next: (requests) => {
              this.allRequests = requests;
              this.isLoading = false;
              console.log('Search results from URL params:', requests.length);
            },
            error: (error) => {
              console.error('Error searching requests:', error);
              this.isLoading = false;
              // Fallback to loading all requests
              this.loadOffers();
            }
          });
        }
      } else {
        // No search params, load all offers
        this.loadOffers();
      }
    });
  }

  loadOffers(): void {
    this.isLoading = true;
    if (this.searchMode === 'offers') {
      this.offerService.getAllOffers().subscribe({
        next: (offers) => {
          this.allOffers = offers;
          this.isLoading = false;
          console.log('Loaded offers:', offers.length);
        },
        error: (error) => {
          console.error('Error loading offers:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.requestService.getAllRequests().subscribe({
        next: (requests) => {
          this.allRequests = requests;
          this.isLoading = false;
          console.log('Loaded requests:', requests.length);
        },
        error: (error) => {
          console.error('Error loading requests:', error);
          this.isLoading = false;
        }
      });
    }
  }

  onShowAllChange(): void {
    // When toggle changes, automatically search
    if (this.showAllJourneys) {
      // Clear search fields and load all
      this.activeSearchDate = '';
      this.activeSearchFrom = '';
      this.activeSearchTo = '';
      this.loadOffers();
    }
  }

  get filteredOffers(): TransportOffer[] {
    let offers = [...this.allOffers];

    // Filter by search date
    if (this.activeSearchDate) {
      const [year, month, day] = this.activeSearchDate.split('-');
      const searchDateFormatted = `${day}.${month}.${year}`;
      offers = offers.filter(o => o.date === searchDateFormatted);
    }

    // Filter by route (optional)
    if (this.activeSearchFrom) {
      offers = offers.filter(o => o.route.toLowerCase().includes(this.activeSearchFrom.toLowerCase()));
    }
    if (this.activeSearchTo) {
      offers = offers.filter(o => o.route.toLowerCase().includes(this.activeSearchTo.toLowerCase()));
    }

    // Filter by category
    if (this.activeSearchCategory && this.activeSearchCategory !== '') {
      offers = offers.filter(o => o.kategorie && o.kategorie.toLowerCase() === this.activeSearchCategory.toLowerCase());
    }

    // Filter by price
    offers = offers.filter(o => o.price <= this.currentPriceMax);

    // Filter by size
    const anySizeSelected = Object.values(this.sizeFilters).some(v => v);
    if (anySizeSelected) {
      offers = offers.filter(o => {
        if (this.sizeFilters.small && o.maxWeight <= 20) return true;
        if (this.sizeFilters.medium && o.maxWeight > 20 && o.maxWeight <= 50) return true;
        if (this.sizeFilters.large && o.maxWeight > 50 && o.maxWeight <= 100) return true;
        if (this.sizeFilters.xlarge && o.maxWeight > 100) return true;
        return false;
      });
    }

    // Filter by vehicle type
    const anyVehicleSelected = Object.values(this.vehicleFilters).some(v => v);
    if (anyVehicleSelected) {
      offers = offers.filter(o => {
        if (this.vehicleFilters.car && o.vehicleType === 'PKW') return true;
        if (this.vehicleFilters.van && o.vehicleType === 'Transporter') return true;
        if (this.vehicleFilters.truck && o.vehicleType === 'Kastenwagen') return true;
        if (this.vehicleFilters.sprinter && o.vehicleType === 'Sprinter') return true;
        if (this.vehicleFilters.lkw && o.vehicleType === 'LKW') return true;
        return false;
      });
    }

    // Filter by rating
    if (this.ratingFilters.rating45) {
      offers = offers.filter(o => o.driverRating >= 4.5);
    } else if (this.ratingFilters.rating40) {
      offers = offers.filter(o => o.driverRating >= 4.0);
    } else if (this.ratingFilters.rating35) {
      offers = offers.filter(o => o.driverRating >= 3.5);
    }

    // Filter by services
    if (this.serviceFilters.insurance) {
      offers = offers.filter(o => o.tags.includes('Versicherung inkl.'));
    }
    if (this.serviceFilters.loading) {
      offers = offers.filter(o => o.tags.includes('Be-/Entladehilfe'));
    }
    if (this.serviceFilters.express) {
      offers = offers.filter(o => o.tags.includes('Express'));
    }

    // Sort
    if (this.sortBy === 'price-asc') {
      offers.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-desc') {
      offers.sort((a, b) => b.price - a.price);
    } else if (this.sortBy === 'rating') {
      offers.sort((a, b) => b.driverRating - a.driverRating);
    }

    return offers;
  }

  get paginatedOffers(): TransportOffer[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredOffers.slice(start, end);
  }

  get paginatedRequests(): TransportRequest[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredRequests.slice(start, end);
  }



  get resultsCount(): number {
    return this.searchMode === 'offers' ? this.filteredOffers.length : this.filteredRequests.length;
  }

  get totalPages(): number {
    if (this.searchMode === 'offers') {
      return Math.ceil(this.filteredOffers.length / this.itemsPerPage);
    } else {
      return Math.ceil(this.filteredRequests.length / this.itemsPerPage);
    }
  }

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  onSearch(): void {
    this.isLoading = true;
    this.activeSearchDate = this.searchDate;
    this.activeSearchFrom = this.searchFrom;
    this.activeSearchTo = this.searchTo;
    this.activeSearchCategory = this.searchCategory;

    // If showAllJourneys is checked OR both from/to are empty, load all
    if (this.showAllJourneys || (!this.searchFrom.trim() && !this.searchTo.trim())) {
      if (this.searchMode === 'offers') {
        this.offerService.getAllOffers().subscribe({
          next: (offers) => {
            this.allOffers = offers;
            this.isLoading = false;
            this.currentPage = 1;
            console.log('All offers loaded:', offers.length);
          },
          error: (error) => {
            console.error('Error loading offers:', error);
            this.isLoading = false;
          }
        });
      } else {
        this.requestService.getAllRequests().subscribe({
          next: (requests) => {
            this.allRequests = requests;
            this.isLoading = false;
            this.currentPage = 1;
            console.log('All requests loaded:', requests.length);
          },
          error: (error) => {
            console.error('Error loading requests:', error);
            this.isLoading = false;
          }
        });
      }
    } else {
      // Use backend search API with filters
      if (this.searchMode === 'offers') {
        // Determine minRating from filters
        let minRating: number | undefined;
        if (this.ratingFilters.rating45) {
          minRating = 4.5;
        } else if (this.ratingFilters.rating40) {
          minRating = 4.0;
        } else if (this.ratingFilters.rating35) {
          minRating = 3.5;
        }

        this.offerService.searchOffers(
          this.searchFrom,
          this.searchTo,
          this.searchDate,
          this.currentPriceMax,
          this.searchCategory,
          minRating
        ).subscribe({
          next: (offers) => {
            this.allOffers = offers;
            this.isLoading = false;
            this.currentPage = 1;
            console.log('Search results:', offers.length);
          },
          error: (error) => {
            console.error('Error searching offers:', error);
            this.isLoading = false;
          }
        });
      } else {
        this.requestService.searchRequests(
          this.searchFrom,
          this.searchTo,
          this.searchDate,
          this.currentPriceMax,
          this.searchCategory
        ).subscribe({
          next: (requests) => {
            this.allRequests = requests;
            this.isLoading = false;
            this.currentPage = 1;
            console.log('Search results:', requests.length);
          },
          error: (error) => {
            console.error('Error searching requests:', error);
            this.isLoading = false;
          }
        });
      }
    }
  }

  onApplyFilters(): void {
    console.log('Filters applied');
    this.currentPage = 1; // Reset to first page
  }

  onSearchModeChange(mode: 'offers' | 'requests'): void {
    if (this.searchMode !== mode) {
      this.searchMode = mode;
      console.log('Search mode changed to:', mode);
      // Reset and reload data
      this.currentPage = 1;
      this.loadOffers();
    }
  }

  get filteredRequests(): TransportRequest[] {
    let requests = [...this.allRequests];

    // Filter by search date
    if (this.activeSearchDate) {
      const [year, month, day] = this.activeSearchDate.split('-');
      const searchDateFormatted = `${day}.${month}.${year}`;
      requests = requests.filter(r => r.datum === searchDateFormatted);
    }

    // Filter by route (optional)
    if (this.activeSearchFrom) {
      requests = requests.filter(r => r.startOrt.toLowerCase().includes(this.activeSearchFrom.toLowerCase()));
    }
    if (this.activeSearchTo) {
      requests = requests.filter(r => r.zielOrt.toLowerCase().includes(this.activeSearchTo.toLowerCase()));
    }

    // Filter by category
    if (this.activeSearchCategory && this.activeSearchCategory !== '') {
      requests = requests.filter(r => r.kategorie && r.kategorie.toLowerCase() === this.activeSearchCategory.toLowerCase());
    }

    // Filter by price (maxPreis is what user is willing to pay)
    requests = requests.filter(r => r.maxPreis >= this.priceMin && r.maxPreis <= this.currentPriceMax);

    // Filter by size
    const anySizeSelected = Object.values(this.sizeFilters).some(v => v);
    if (anySizeSelected) {
      requests = requests.filter(r => {
        if (!r.gewicht) return false;
        if (this.sizeFilters.small && r.gewicht <= 20) return true;
        if (this.sizeFilters.medium && r.gewicht > 20 && r.gewicht <= 50) return true;
        if (this.sizeFilters.large && r.gewicht > 50 && r.gewicht <= 100) return true;
        if (this.sizeFilters.xlarge && r.gewicht > 100) return true;
        return false;
      });
    }

    // Sort requests
    if (this.sortBy === 'price-asc') {
      requests.sort((a, b) => a.maxPreis - b.maxPreis);
    } else if (this.sortBy === 'price-desc') {
      requests.sort((a, b) => b.maxPreis - a.maxPreis);
    } else if (this.sortBy === 'date') {
      requests.sort((a, b) => {
        const dateA = this.parseDate(a.datum);
        const dateB = this.parseDate(b.datum);
        return dateA.getTime() - dateB.getTime();
      });
    }

    return requests;
  }

  onResetFilters(): void {
    this.currentPriceMax = 500;
    this.sizeFilters = { small: false, medium: false, large: false, xlarge: false };
    this.vehicleFilters = { car: false, van: false, truck: false, sprinter: false, lkw: false };
    this.ratingFilters = { rating45: false, rating40: false, rating35: false };
    this.serviceFilters = { insurance: false, loading: false, express: false };
    this.activeSearchDate = '';
    this.activeSearchFrom = '';
    this.activeSearchTo = '';
    this.activeSearchCategory = '';
    this.searchCategory = '';
    this.showAllJourneys = true;
    this.currentPage = 1; // Reset to first page

    // Reload all offers
    this.loadOffers();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onViewDetails(offer: TransportOffer): void {
    console.log('View details:', offer.id);
    this.router.navigate(['/offer', offer.id]);
  }

  onViewRequestDetails(request: TransportRequest): void {
    console.log('View request details:', request.id);
    // TODO: Navigate to request detail page when created
    this.router.navigate(['/request', request.id]);
  }

  onOfferTransport(request: TransportRequest): void {
    if (!this.isLoggedIn) {
      alert('Bitte melde dich an, um einen Transport anzubieten.');
      this.router.navigate(['/login']);
      return;
    }
    // Open offer modal
    this.selectedRequest = request;
    this.showOfferModal = true;
  }

  closeOfferModal(): void {
    this.showOfferModal = false;
    this.selectedRequest = null;
  }

  onOfferCreated(): void {
    // Offer was successfully created
    this.closeOfferModal();
    // Optionally refresh requests to show updated offer count
    this.onSearch();
  }

  onSendMessage(offer: TransportOffer): void {
    if (!this.isLoggedIn) {
      alert('Bitte melde dich an, um eine Nachricht zu senden.');
      this.router.navigate(['/login']);
      return;
    }
    this.selectedOffer = offer;
    this.showMessageModal = true;
  }

  onConfirmMessage(): void {
    this.showMessageModal = false;

    if (this.selectedOffer) {
      console.log('Opening chat with:', this.selectedOffer.driverName);
      // Navigate to messages
      this.router.navigate(['/messages']);
    }

    this.selectedOffer = null;
  }

  onCancelMessage(): void {
    this.showMessageModal = false;
    this.selectedOffer = null;
  }

  onRatingFilterChange(selectedFilter: 'rating45' | 'rating40' | 'rating35'): void {
    // Make rating filters mutually exclusive
    if (this.ratingFilters[selectedFilter]) {
      // If this filter was just checked, uncheck the others
      if (selectedFilter !== 'rating45') this.ratingFilters.rating45 = false;
      if (selectedFilter !== 'rating40') this.ratingFilters.rating40 = false;
      if (selectedFilter !== 'rating35') this.ratingFilters.rating35 = false;
    }

    // Trigger new search with updated rating filter
    this.onSearch();
  }

  getStars(rating: number): string {
    return '⭐'.repeat(Math.floor(rating));
  }

  /**
   * Get user avatar - use current profile picture if request belongs to logged-in user
   */
  getUserAvatar(request: TransportRequest): string {
    // If this request belongs to the current user, use their current avatar
    if (this.isLoggedIn && request.erstellerEmail === this.currentUserEmail) {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.avatar) {
          return user.avatar;
        }
      }
    }
    
    // Otherwise use the stored avatar or fallback
    return request.erstellerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.erstellerName || 'User')}`;
  }

  private parseDate(dateStr: string): Date {
    // Parse date string in DD.MM.YYYY format
    const [day, month, year] = dateStr.split('.');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
}
