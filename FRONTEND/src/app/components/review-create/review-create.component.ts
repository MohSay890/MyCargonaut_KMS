import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-review-create',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ConfirmationModalComponent],
  templateUrl: './review-create.component.html',
  styleUrls: ['./review-create.component.css']
})
export class ReviewCreateComponent implements OnInit {
  tripId: string = '';
  driverName: string = 'Lädt...';
  tripRoute: string = '';
  fahrerId: number = 0;

  overallRating: number = 0;
  punctualityRating: number = 0;
  careRating: number = 0;
  communicationRating: number = 0;
  friendlinessRating: number = 0;
  reviewComment: string = '';

  // Behebt den Fehler: Property 'availableTags' does not exist
  availableTags: string[] = ['Pünktlich', 'Freundlich', 'Sorgfältig', 'Zuverlässig'];
  selectedTags: string[] = [];

  showSuccessModal: boolean = false;

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tripId = params['id'];
      this.ladeFahrtInfo(this.tripId);
    });
  }

  ladeFahrtInfo(id: string) {
    this.http.get<any>(`http://localhost:8080/api/fahrten/${id}`).subscribe(fahrt => {
      this.driverName = fahrt.fahrer?.vorname + ' ' + (fahrt.fahrer?.nachname?.charAt(0) || '') + '.';
      this.tripRoute = `${fahrt.startOrt} → ${fahrt.zielOrt}`;
      this.fahrerId = fahrt.fahrer?.id;
    });
  }

  // Behebt Fehler in review-create.component.html
  toggleTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    index > -1 ? this.selectedTags.splice(index, 1) : this.selectedTags.push(tag);
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  setRating(category: string, rating: number): void {
    if (category === 'overall') this.overallRating = rating;
    if (category === 'punctuality') this.punctualityRating = rating;
    if (category === 'care') this.careRating = rating;
    if (category === 'communication') this.communicationRating = rating;
    if (category === 'friendliness') this.friendlinessRating = rating;
  }

  getStars(rating: number): string[] { return Array(5).fill('☆').map((_, i) => i < rating ? '★' : '☆'); }

  isFormValid(): boolean { return this.overallRating > 0 && this.punctualityRating > 0; }

  onSubmitReview(): void {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const payload = {
      bewertetVon: { id: user.id },
      bewerteterNutzer: { id: this.fahrerId },
      fahrtId: parseInt(this.tripId),
      sterne: this.overallRating,
      kommentar: this.reviewComment,
      puenktlich: this.punctualityRating >= 4,
      abmachungenEingehalten: this.communicationRating >= 4,
      wohlgefuehlt: this.friendlinessRating >= 4,
      frachtUnbeschadet: this.careRating >= 4
    };

    this.http.post('http://localhost:8080/api/bewertungen', payload).subscribe(() => {
      this.showSuccessModal = true;
    });
  }

  onSuccessConfirm(): void { this.router.navigate(['/my-trips']); }
  onCancel(): void { this.router.navigate(['/my-trips']); }
}
