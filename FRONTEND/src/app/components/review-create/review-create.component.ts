import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { ReviewService } from '../../services/review.service';
import { OfferService } from '../../services/offer.service';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-review-create',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ConfirmationModalComponent],
  templateUrl: './review-create.component.html',
  styleUrls: ['./review-create.component.css']
})
export class ReviewCreateComponent implements OnInit {

  tripId: string = '';
  reviewedPersonName: string = 'Laden...';
  tripRoute: string = '';
  reviewerRole: 'DRIVER' | 'PASSENGER' = 'PASSENGER'; // Who is writing the review
  reviewedPersonEmail: string = ''; // Email of person being reviewed

  // Overall Rating (1-5 stars)
  overallRating: number = 0;

  // Common Questions (both driver and passenger)
  warPuenktlich: boolean | null = null;      // Was the person on time? (+/- 5 minutes)
  hiltAbmachungen: boolean | null = null;    // Did they keep to all agreements?

  // Passenger-specific questions (rating driver)
  fuehlteSichWohl: boolean | null = null;    // Did you feel comfortable during the trip?
  frachtUnbeschaedigt: boolean | null = null; // Did the cargo arrive undamaged?

  // Driver-specific question (rating passenger)
  gerneGenommen: boolean | null = null;       // Did you enjoy having the passenger?

  // Comment
  reviewComment: string = '';

  // Available Tags
  availableTags: string[] = [
    'Sehr zuverlässig',
    'Pünktlich',
    'Freundlich',
    'Professionell',
    'Gute Kommunikation',
    'Sorgfältiger Umgang',
    'Flexibel',
    'Empfehlenswert'
  ];

  selectedTags: string[] = [];

  // Modals
  showSuccessModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reviewService: ReviewService,
    private offerService: OfferService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tripId = params['id'] || '1';

      // Check if already reviewed
        const userStr = localStorage.getItem('currentUser');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        if (currentUser) {
          this.reviewService.hasUserReviewedTrip(parseInt(this.tripId), currentUser.email).subscribe(hasReview => {
            if (hasReview) {
              alert('Diese Fahrt wurde bereits bewertet!');
              this.router.navigate(['/my-trips']);
            } else {
              this.loadTripDetails();
            }
          });
        } else {
          this.loadTripDetails();
        }

      });
  }

  private loadTripDetails(): void {
    const userStr = localStorage.getItem('currentUser');
    const currentUser = userStr ? JSON.parse(userStr) : null;

    if (!currentUser) return;

    this.offerService.getOfferById(this.tripId).subscribe(offer => {
      if (offer) {
        this.tripRoute = `${offer.from} → ${offer.to}`;

        // Determine role and who to review
        if (offer.creatorEmail && offer.creatorEmail.trim().toLowerCase() === currentUser.email.trim().toLowerCase()) {
          // Current user is the DRIVER, so they should review the PASSENGER
          this.reviewerRole = 'DRIVER';

          // Need to fetch bookings to find the passenger
          this.bookingService.getBookingsForTrip(parseInt(this.tripId)).subscribe(bookings => {
            const confirmedBooking = bookings.find(b => b.status === 'CONFIRMED');
            if (confirmedBooking && confirmedBooking.mitfahrer) {
              this.reviewedPersonEmail = confirmedBooking.mitfahrer.email;
              this.reviewedPersonName = confirmedBooking.mitfahrer.vorname + ' ' + confirmedBooking.mitfahrer.nachname;
            }
          });

        } else {
          // Current user is the PASSENGER, so they review the DRIVER
          this.reviewerRole = 'PASSENGER';
          this.reviewedPersonEmail = offer.creatorEmail || '';
          this.reviewedPersonName = offer.driverName || 'Fahrer';
        }
      }
    });
  }

  // Star Rating Method (only for overall rating now)
  setOverallRating(rating: number): void {
    this.overallRating = rating;
  }

  getStars(rating: number, maxStars: number = 5): string[] {
    return Array(maxStars).fill('☆').map((_, i) => i < rating ? '★' : '☆');
  }

  // Form Validation
  isFormValid(): boolean {
    // Overall rating is required
    if (this.overallRating === 0) return false;

    // Common questions are required for both roles
    if (this.warPuenktlich === null || this.hiltAbmachungen === null) return false;

    // Role-specific validation
    if (this.reviewerRole === 'PASSENGER') {
      // Passengers must answer all 4 questions
      return this.fuehlteSichWohl !== null && this.frachtUnbeschaedigt !== null;
    } else {
      // Drivers must answer the passenger-specific question
      return this.gerneGenommen !== null;
    }
  }

  // Submit Review
  onSubmitReview(): void {
    if (!this.isFormValid()) {
      alert('Bitte beantworte alle Pflichtfragen');
      return;
    }

    const userStr = localStorage.getItem('currentUser');
    const currentUser = userStr ? JSON.parse(userStr) : null;

    if (!currentUser) {
      alert('Bitte melde dich an, um eine Bewertung abzugeben');
      return;
    }

    // Create review object for backend
    const reviewData = {
      fahrtId: parseInt(this.tripId),
      verfasserEmail: currentUser.email,
      bewertetEmail: this.reviewedPersonEmail,
      reviewerRole: this.reviewerRole,
      sterne: this.overallRating,
      kommentar: this.reviewComment,
      warPuenktlich: this.warPuenktlich,
      hiltAbmachungen: this.hiltAbmachungen,
      fuehlteSichWohl: this.reviewerRole === 'PASSENGER' ? this.fuehlteSichWohl : null,
      frachtUnbeschaedigt: this.reviewerRole === 'PASSENGER' ? this.frachtUnbeschaedigt : null,
      gerneGenommen: this.reviewerRole === 'DRIVER' ? this.gerneGenommen : null
    };

    // Save review via service
    this.reviewService.createReview(reviewData).subscribe({
      next: (response) => {
        console.log('Review successfully saved:', response);
        this.showSuccessModal = true;
      },
      error: (error) => {
        console.error('Error saving review:', error);
        alert(error.error?.error || 'Fehler beim Speichern der Bewertung');
      }
    });
  }

  onSuccessConfirm(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/my-trips']);
  }

  onCancel(): void {
    this.router.navigate(['/my-trips']);
  }
}
