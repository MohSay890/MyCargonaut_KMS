import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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

export interface CreateReviewRequest {
  fahrtId: number;
  verfasserEmail: string;
  bewertetEmail: string;
  reviewerRole: 'DRIVER' | 'PASSENGER';
  sterne: number;
  kommentar: string;
  warPuenktlich: boolean | null;
  hiltAbmachungen: boolean | null;
  fuehlteSichWohl: boolean | null;
  frachtUnbeschaedigt: boolean | null;
  gerneGenommen: boolean | null;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  reviewsAsDriver: number;
  reviewsAsPassenger: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  private readonly API_URL = 'http://localhost:8080/api/bewertungen';
  private reviews: Review[] = [];

  constructor(private http: HttpClient) {
    // Load from localStorage if available (for offline fallback)
    const savedReviews = localStorage.getItem('mycargonaut_reviews');
    if (savedReviews) {
      this.reviews = JSON.parse(savedReviews);
    }
  }

  /**
   * Create a new review (via backend)
   */
  createReview(reviewData: CreateReviewRequest): Observable<any> {
    return this.http.post(`${this.API_URL}`, reviewData).pipe(
      catchError(error => {
        console.error('Error creating review:', error);
        throw error;
      })
    );
  }

  /**
   * Get all reviews for a user
   */
  getReviewsForUser(email: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/user/${email}`).pipe(
      catchError(error => {
        console.error('Error fetching reviews:', error);
        return of([]);
      })
    );
  }

  /**
   * Get average rating for a user
   */
  getAverageRating(email: string): Observable<number> {
    return this.http.get<{email: string, averageRating: number}>(`${this.API_URL}/user/${email}/average`).pipe(
      map(response => response.averageRating),
      catchError(error => {
        console.error('Error fetching average rating:', error);
        return of(0);
      })
    );
  }

  /**
   * Get review statistics for a user
   */
  getReviewStats(email: string): Observable<ReviewStats> {
    return this.http.get<ReviewStats>(`${this.API_URL}/user/${email}/stats`).pipe(
      catchError(error => {
        console.error('Error fetching review stats:', error);
        return of({ averageRating: 0, totalReviews: 0, reviewsAsDriver: 0, reviewsAsPassenger: 0 });
      })
    );
  }

  /**
   * Get all reviews for a trip
   */
  getReviewsForTrip(tripId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/trip/${tripId}`).pipe(
      catchError(error => {
        console.error('Error fetching trip reviews:', error);
        return of([]);
      })
    );
  }

  /**
   * Check if user has already reviewed a trip
   */
  hasUserReviewedTrip(tripId: number, userEmail: string): Observable<boolean> {
    const params = new HttpParams().set('userEmail', userEmail);
    return this.http.get<{hasReviewed: boolean}>(`${this.API_URL}/trip/${tripId}/has-reviewed`, { params }).pipe(
      map(response => response.hasReviewed),
      catchError(error => {
        console.error('Error checking review status:', error);
        return of(false);
      })
    );
  }

  // Legacy methods for backwards compatibility

  // Add a new review (local storage fallback)
  addReview(review: Omit<Review, 'id'>): Review {
    const newReview: Review = {
      ...review,
      id: this.generateId()
    };

    this.reviews.push(newReview);
    this.saveToStorage();

    return newReview;
  }

  // Get all reviews for a specific driver (local)
  getReviewsByDriver(driverName: string): Review[] {
    return this.reviews.filter(r => r.driverName === driverName);
  }

  // Get review by trip ID (local)
  getReviewByTripId(tripId: string): Review | undefined {
    return this.reviews.find(r => r.tripId === tripId);
  }

  // Check if a trip has been reviewed (local)
  hasReview(tripId: string): boolean {
    return this.reviews.some(r => r.tripId === tripId);
  }

  // Get all reviews (local)
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
