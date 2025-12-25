import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { FavoritesService, FavoriteOffer } from '../../services/favorites.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SidebarComponent, ConfirmationModalComponent],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit, OnDestroy {

  favorites: FavoriteOffer[] = [];
  sortBy: string = 'newest';

  // Modal
  showDeleteModal: boolean = false;
  offerToDelete: FavoriteOffer | null = null;

  private routerSubscription?: Subscription;

  constructor(
    private favoritesService: FavoritesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFavorites();

    // Reload favorites when navigating back to this page
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.router.url === '/favorites') {
        this.loadFavorites();
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  loadFavorites(): void {
    this.favorites = this.favoritesService.getAllFavorites();
    console.log('Favorites loaded:', this.favorites.length);
  }

  get sortedFavorites(): FavoriteOffer[] {
    let sorted = [...this.favorites];

    switch(this.sortBy) {
      case 'newest':
        sorted.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => a.savedAt.getTime() - b.savedAt.getTime());
        break;
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'date':
        sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
    }

    return sorted;
  }

  onViewDetails(offer: FavoriteOffer): void {
    this.router.navigate(['/offer', offer.id]);
  }

  onRemoveFavorite(offer: FavoriteOffer): void {
    this.offerToDelete = offer;
    this.showDeleteModal = true;
  }

  onConfirmDelete(): void {
    if (this.offerToDelete) {
      this.favoritesService.removeFavorite(this.offerToDelete.id);
      this.loadFavorites();
    }
    this.showDeleteModal = false;
    this.offerToDelete = null;
  }

  onCancelDelete(): void {
    this.showDeleteModal = false;
    this.offerToDelete = null;
  }

  onClearAll(): void {
    if (confirm('Möchtest du wirklich alle Favoriten löschen?')) {
      this.favoritesService.clearAll();
      this.loadFavorites();
    }
  }

  getStars(rating: number): string {
    return '⭐'.repeat(Math.floor(rating));
  }

  formatSavedDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Heute gespeichert';
    if (days === 1) return 'Gestern gespeichert';
    if (days < 7) return `Vor ${days} Tagen gespeichert`;
    if (days < 30) return `Vor ${Math.floor(days / 7)} Wochen gespeichert`;
    return date.toLocaleDateString('de-DE');
  }
}
