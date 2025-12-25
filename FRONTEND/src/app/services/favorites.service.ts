import { Injectable } from '@angular/core';

export interface FavoriteOffer {
  id: string;
  route: string;
  from: string;
  to: string;
  date: string;
  time: string;
  price: number;
  driverName: string;
  driverAvatar: string;
  driverRating: number;
  vehicle: string;
  maxWeight: number;
  distance: string;
  savedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {

  private favorites: FavoriteOffer[] = [];

  constructor() {
    console.log('FavoritesService constructor called');
    // Load from localStorage if available
    const savedFavorites = localStorage.getItem('mycargonaut_favorites');
    console.log('Loaded from localStorage:', savedFavorites);
    if (savedFavorites) {
      this.favorites = JSON.parse(savedFavorites).map((fav: any) => ({
        ...fav,
        savedAt: new Date(fav.savedAt)
      }));
    }
    console.log('Initial favorites:', this.favorites);
  }

  // Add to favorites
  addFavorite(offer: FavoriteOffer): void {
    console.log('addFavorite called with:', offer);
    // Check if already exists
    if (!this.isFavorite(offer.id)) {
      console.log('Adding new favorite...');
      this.favorites.push({
        ...offer,
        savedAt: new Date()
      });
      console.log('Favorites after push:', this.favorites);
      this.saveToStorage();
    } else {
      console.log('Favorite already exists, skipping...');
    }
  }

  // Remove from favorites
  removeFavorite(offerId: string): void {
    console.log('removeFavorite called for:', offerId);
    this.favorites = this.favorites.filter(f => f.id !== offerId);
    console.log('Favorites after remove:', this.favorites);
    this.saveToStorage();
  }

  // Check if offer is in favorites
  isFavorite(offerId: string): boolean {
    const result = this.favorites.some(f => f.id === offerId);
    console.log(`isFavorite(${offerId}):`, result);
    return result;
  }

  // Get all favorites
  getAllFavorites(): FavoriteOffer[] {
    console.log('getAllFavorites called, returning:', this.favorites.length, 'items');
    return [...this.favorites].sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
  }

  // Get favorites count
  getFavoritesCount(): number {
    return this.favorites.length;
  }

  // Clear all favorites
  clearAll(): void {
    console.log('clearAll called');
    this.favorites = [];
    this.saveToStorage();
  }

  // Save to localStorage
  private saveToStorage(): void {
    const jsonString = JSON.stringify(this.favorites);
    console.log('Saving to localStorage:', jsonString);
    localStorage.setItem('mycargonaut_favorites', jsonString);
    console.log('Saved! Verify:', localStorage.getItem('mycargonaut_favorites'));
  }
}
