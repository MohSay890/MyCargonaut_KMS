import { Injectable } from '@angular/core';

export interface Review {
  id: string;
  tripId: string;
  reviewerName: string;
  reviewerAvatar: string;
  driverName: string;
  route: string;
  date: string;
  rating: number;
  categoryRatings: {
    punctuality: number;
    care: number;
    communication: number;
    friendliness: number;
  };
  comment: string;
  tags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  private reviews: Review[] = [];

  constructor() {
    // Load from localStorage if available
    const savedReviews = localStorage.getItem('mycargonaut_reviews');
    if (savedReviews) {
      this.reviews = JSON.parse(savedReviews);
    }
  }

  // Add a new review
  addReview(review: Omit<Review, 'id'>): Review {
    const newReview: Review = {
      ...review,
      id: this.generateId()
    };

    this.reviews.push(newReview);
    this.saveToStorage();

    return newReview;
  }

  // Get all reviews for a specific driver
  getReviewsByDriver(driverName: string): Review[] {
    return this.reviews.filter(r => r.driverName === driverName);
  }

  // Get review by trip ID
  getReviewByTripId(tripId: string): Review | undefined {
    return this.reviews.find(r => r.tripId === tripId);
  }

  // Check if a trip has been reviewed
  hasReview(tripId: string): boolean {
    return this.reviews.some(r => r.tripId === tripId);
  }

  // Get all reviews
  getAllReviews(): Review[] {
    return [...this.reviews];
  }

  // Save to localStorage
  private saveToStorage(): void {
    localStorage.setItem('mycargonaut_reviews', JSON.stringify(this.reviews));
  }

  // Generate unique ID
  private generateId(): string {
    return 'review_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
