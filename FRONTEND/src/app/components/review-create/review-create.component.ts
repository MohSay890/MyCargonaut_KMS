import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-review-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent, ConfirmationModalComponent],
  templateUrl: './review-create.component.html',
  styleUrls: ['./review-create.component.css']
})
export class ReviewCreateComponent implements OnInit {

  tripId: string = '';
  driverName: string = 'Thomas M.';
  tripRoute: string = 'Berlin → Hamburg';

  // Rating Values
  overallRating: number = 0;
  punctualityRating: number = 0;
  careRating: number = 0;
  communicationRating: number = 0;
  friendlinessRating: number = 0;

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
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tripId = params['id'] || '1';

      // Check if already reviewed
      if (this.reviewService.hasReview(this.tripId)) {
        alert('Diese Fahrt wurde bereits bewertet!');
        this.router.navigate(['/my-trips']);
      }
    });
  }

  // Star Rating Methods
  setRating(category: string, rating: number): void {
    switch(category) {
      case 'overall':
        this.overallRating = rating;
        break;
      case 'punctuality':
        this.punctualityRating = rating;
        break;
      case 'care':
        this.careRating = rating;
        break;
      case 'communication':
        this.communicationRating = rating;
        break;
      case 'friendliness':
        this.friendlinessRating = rating;
        break;
    }
  }

  getStars(rating: number, maxStars: number = 5): string[] {
    return Array(maxStars).fill('☆').map((_, i) => i < rating ? '★' : '☆');
  }

  // Tag Selection
  toggleTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
    } else {
      this.selectedTags.push(tag);
    }
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  // Form Validation
  isFormValid(): boolean {
    return this.overallRating > 0 &&
      this.punctualityRating > 0 &&
      this.careRating > 0 &&
      this.communicationRating > 0 &&
      this.friendlinessRating > 0;
  }

  // Submit Review
  onSubmitReview(): void {
    if (!this.isFormValid()) {
      alert('Bitte fülle alle Pflichtfelder aus (alle Sterne-Bewertungen)');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const reviewerName = currentUser ? currentUser.name : 'Anonymer Nutzer';
    const reviewerAvatar = currentUser?.avatar || 'https://i.pravatar.cc/150?img=1';

    // Create review object
    const review = {
      tripId: this.tripId,
      reviewerName: reviewerName,
      reviewerAvatar: reviewerAvatar,
      driverName: this.driverName,
      route: this.tripRoute,
      date: new Date().toLocaleDateString('de-DE'),
      rating: this.overallRating,
      categoryRatings: {
        punctuality: this.punctualityRating,
        care: this.careRating,
        communication: this.communicationRating,
        friendliness: this.friendlinessRating
      },
      comment: this.reviewComment,
      tags: this.selectedTags
    };

    // Save review
    this.reviewService.addReview(review);

    console.log('Review successfully saved:', review);

    // Show success modal
    this.showSuccessModal = true;
  }

  onSuccessConfirm(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/my-trips']);
  }

  onCancel(): void {
    this.router.navigate(['/my-trips']);
  }
}
