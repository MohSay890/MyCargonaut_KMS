import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar.component';

interface Review {
  id: number;
  sterne: number;
  kommentar: string;
  istSichtbar: boolean;
  bewertetVon?: {
    vorname: string;
    nachname: string;
    profilbild: string;
  };
  fahrtId: number;
  // Diese Felder beheben die Fehler in deinem Screenshot
  puenktlich: boolean;
  wohlgefuehlt: boolean;
  abmachungenEingehalten: boolean;
  frachtUnbeschadet: boolean;
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
  ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  filterRating: string = 'all';
  sortBy: string = 'newest';
  reviews: Review[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const currentUser = JSON.parse(userStr);
      this.driverName = currentUser.name || 'Benutzer';
      this.ladeDaten(currentUser.id);
    }
  }

  ladeDaten(userId: number): void {
    this.http.get<Review[]>(`http://localhost:8080/api/bewertungen/nutzer/${userId}`)
      .subscribe(data => {
        this.reviews = data;
        this.totalReviews = data.length;
        this.berechneStatistiken(data);
      });
  }

  berechneStatistiken(data: Review[]): void {
    if (data.length === 0) return;
    let sum = 0;
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach(r => {
      sum += r.sterne;
      counts[r.sterne as keyof typeof counts]++;
    });
    this.overallRating = parseFloat((sum / data.length).toFixed(1));
    this.ratingBreakdown = counts;
  }

  get filteredReviews(): Review[] {
    let filtered = [...this.reviews];
    if (this.filterRating !== 'all') {
      filtered = filtered.filter(r => r.sterne === parseInt(this.filterRating));
    }
    return filtered;
  }

  getStars(rating: number): string { return '⭐'.repeat(Math.floor(rating)); }
  getRatingBreakdown(stars: number): number { return this.ratingBreakdown[stars as keyof typeof this.ratingBreakdown]; }
}
