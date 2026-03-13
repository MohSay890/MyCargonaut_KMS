import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ReviewService } from '../../services/review.service';

interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  date: string;
  route: string;
  comment: string;
  tags: string[];
}

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SidebarComponent],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css']
})
export class ReviewsComponent implements OnInit {

  driverName: string = '';
  overallRating: number = 0;
  totalReviews: number = 0;

  // Rating breakdown
  ratingBreakdown = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  };

  // Category ratings (calculated from yes/no questions)
  categoryRatings = {
    punctuality: 0,
    care: 0,
    communication: 0,
    friendliness: 0
  };

  // Filter & Sort
  filterRating: string = 'all';
  sortBy: string = 'newest';

  reviews: Review[] = [];
  
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    // Get current user from localStorage
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const currentUser = JSON.parse(userStr);
      this.driverName = currentUser.name || 'Unbekannter Benutzer';
      const userEmail = currentUser.email;

      if (userEmail) {
        this.loadUserReviews(userEmail);
      } else {
        this.isLoading = false;
      }
    } else {
      this.driverName = 'Unbekannter Benutzer';
      this.isLoading = false;
    }
  }

  /**
   * Load all reviews and statistics for the current user
   */
  private loadUserReviews(email: string): void {
    // Load review statistics
    this.reviewService.getReviewStats(email).subscribe({
      next: (stats) => {
        this.overallRating = Math.round(stats.averageRating * 10) / 10; // Round to 1 decimal
        this.totalReviews = stats.totalReviews;
      },
      error: (error) => {
        console.error('Error loading review stats:', error);
      }
    });

    // Load individual reviews
    this.reviewService.getReviewsForUser(email).subscribe({
      next: (backendReviews) => {
        this.reviews = backendReviews.map(br => this.mapBackendReview(br));
        this.calculateRatingBreakdown();
        this.calculateCategoryRatings(backendReviews);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Map backend review to frontend format
   */
  private mapBackendReview(backendReview: any): Review {
    // Generate tags from yes/no questions
    const tags: string[] = [];
    if (backendReview.warPuenktlich) tags.push('Pünktlich');
    if (backendReview.hiltAbmachungen) tags.push('Zuverlässig');
    if (backendReview.fuehlteSichWohl) tags.push('Angenehm');
    if (backendReview.frachtUnbeschaedigt) tags.push('Sorgfältig');
    if (backendReview.gerneGenommen) tags.push('Empfehlenswert');

    return {
      id: backendReview.id.toString(),
      reviewerName: backendReview.verfasser?.vorname + ' ' + (backendReview.verfasser?.nachname?.charAt(0) || '') + '.',
      reviewerAvatar: backendReview.verfasser?.profilbild || 'https://i.pravatar.cc/50?img=1',
      rating: backendReview.sterne,
      date: this.formatDate(backendReview.erstelltAm),
      route: this.getRouteFromFahrt(backendReview.fahrt),
      comment: backendReview.kommentar || '',
      tags: tags
    };
  }

  /**
   * Calculate rating breakdown (how many 5-star, 4-star, etc.)
   */
  private calculateRatingBreakdown(): void {
    this.ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    this.reviews.forEach(review => {
      const rating = review.rating;
      if (rating >= 1 && rating <= 5) {
        this.ratingBreakdown[rating as keyof typeof this.ratingBreakdown]++;
      }
    });
  }

  /**
   * Calculate category ratings from yes/no questions
   */
  private calculateCategoryRatings(backendReviews: any[]): void {
    if (backendReviews.length === 0) {
      this.categoryRatings = { punctuality: 0, care: 0, communication: 0, friendliness: 0 };
      return;
    }

    let punctualityScore = 0;
    let careScore = 0;
    let communicationScore = 0;
    let friendlinessScore = 0;

    backendReviews.forEach(review => {
      // Punctuality
      if (review.warPuenktlich === true) punctualityScore += 5;
      else if (review.warPuenktlich === false) punctualityScore += 1;
      
      // Care (from "hiltAbmachungen" and "frachtUnbeschaedigt")
      if (review.hiltAbmachungen === true) careScore += 2.5;
      else if (review.hiltAbmachungen === false) careScore += 0.5;
      
      if (review.frachtUnbeschaedigt === true) careScore += 2.5;
      else if (review.frachtUnbeschaedigt === false) careScore += 0.5;
      
      // Communication (from overall rating as proxy)
      communicationScore += review.sterne;
      
      // Friendliness (from "fuehlteSichWohl" and "gerneGenommen")
      if (review.fuehlteSichWohl === true) friendlinessScore += 2.5;
      else if (review.fuehlteSichWohl === false) friendlinessScore += 0.5;
      
      if (review.gerneGenommen === true) friendlinessScore += 2.5;
      else if (review.gerneGenommen === false) friendlinessScore += 0.5;
    });

    const count = backendReviews.length;
    this.categoryRatings = {
      punctuality: Math.round((punctualityScore / count) * 10) / 10,
      care: Math.round((careScore / count) * 10) / 10,
      communication: Math.round((communicationScore / count) * 10) / 10,
      friendliness: Math.round((friendlinessScore / count) * 10) / 10
    };
  }

  /**
   * Format date to relative time (e.g., "vor 2 Wochen")
   */
  private formatDate(dateString: string): string {
    if (!dateString) return 'Kürzlich';
    
    const reviewDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - reviewDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    if (diffDays < 14) return 'vor 1 Woche';
    if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`;
    if (diffDays < 60) return 'vor 1 Monat';
    if (diffDays < 365) return `vor ${Math.floor(diffDays / 30)} Monaten`;
    
    return `vor ${Math.floor(diffDays / 365)} Jahr${Math.floor(diffDays / 365) > 1 ? 'en' : ''}`;
  }

  /**
   * Get route string from Fahrt object
   */
  private getRouteFromFahrt(fahrt: any): string {
    if (!fahrt) return 'Unbekannte Route';
    return `${fahrt.startOrt} → ${fahrt.zielOrt}`;
  }

  get filteredReviews(): Review[] {
    let filtered = [...this.reviews];

    // Filter by rating
    if (this.filterRating !== 'all') {
      const rating = parseInt(this.filterRating);
      filtered = filtered.filter(r => r.rating === rating);
    }

    // Sort
    if (this.sortBy === 'newest') {
      // Already sorted by newest
    } else if (this.sortBy === 'oldest') {
      filtered.reverse();
    } else if (this.sortBy === 'highest') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (this.sortBy === 'lowest') {
      filtered.sort((a, b) => a.rating - b.rating);
    }

    return filtered;
  }

  getStars(rating: number): string {
    return '⭐'.repeat(Math.floor(rating));
  }

  getRatingBreakdown(stars: number): number {
    return this.ratingBreakdown[stars as keyof typeof this.ratingBreakdown];
  }
}
