import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OfferService, TransportOffer } from '../../services/offer.service';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ConfirmationModalComponent],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnInit {

  // Search form
  searchFrom: string = 'Berlin';
  searchTo: string = 'Hamburg';
  searchDate: string = '2026-01-15';
  searchWeight: number = 50;
  searchDimensions: string = '150x100x80';

  // Active search (applied filters)
  activeSearchDate: string = '';
  activeSearchFrom: string = '';
  activeSearchTo: string = '';

  // Filters
  priceMin: number = 0;
  priceMax: number = 200;
  currentPriceMax: number = 200;

  sizeFilters = {
    small: false,    // bis 20kg
    medium: false,   // bis 50kg
    large: false,    // bis 100kg
    xlarge: false    // 100kg+
  };

  vehicleFilters = {
    car: false,
    van: false,
    truck: false
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

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // Message modal
  showMessageModal: boolean = false;
  selectedOffer: TransportOffer | null = null;

  constructor(
    private router: Router,
    private offerService: OfferService
  ) {}

  ngOnInit(): void {
    console.log('Search results loaded');
    this.allOffers = this.offerService.getAllOffers();
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
        if (this.vehicleFilters.truck && o.vehicleType === 'LKW') return true;
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
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredOffers.slice(startIndex, endIndex);
  }

  get resultsCount(): number {
    return this.filteredOffers.length;
  }

  get totalPages(): number {
    return Math.ceil(this.resultsCount / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  onSearch(): void {
    this.activeSearchDate = this.searchDate;
    this.activeSearchFrom = this.searchFrom;
    this.activeSearchTo = this.searchTo;

    console.log('Searching with date:', this.activeSearchDate);
    this.currentPage = 1; // Reset to first page
  }

  onApplyFilters(): void {
    console.log('Filters applied');
    this.currentPage = 1; // Reset to first page
  }

  onResetFilters(): void {
    this.currentPriceMax = 200;
    this.sizeFilters = { small: false, medium: false, large: false, xlarge: false };
    this.vehicleFilters = { car: false, van: false, truck: false };
    this.ratingFilters = { rating45: false, rating40: false, rating35: false };
    this.serviceFilters = { insurance: false, loading: false, express: false };
    this.activeSearchDate = '';
    this.activeSearchFrom = '';
    this.activeSearchTo = '';
    this.currentPage = 1; // Reset to first page
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

  onSendMessage(offer: TransportOffer): void {
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

  getStars(rating: number): string {
    return '⭐'.repeat(Math.floor(rating));
  }
}
