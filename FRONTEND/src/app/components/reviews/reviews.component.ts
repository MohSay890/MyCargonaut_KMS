import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // HttpHeaders hinzugefügt
import { SidebarComponent } from '../sidebar/sidebar.component';

interface Review {
  id: number;
  sterne: number;
  kommentar: string;
  istSichtbar: boolean;
  // Hier von 'bewertetVon' zu 'autor' ändern:
  autor?: {
    vorname: string;
    nachname: string;
    profilbild: string;
  };
  fahrt?: {
    startOrt: string;
    zielOrt: string;
    datum: string;
  };
  fahrtId: number;
  puenktlich: boolean;
  abmachungenEingehalten: boolean;
  wohlgefuehlt?: boolean;
  frachtUnbeschadet?: boolean;
  gerneMitgenommen?: boolean;
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

  // Hilfsmethode für JWT-Authentifizierung (Behebt Fehler in image_2107eb.jpg)
  private getAuthHeaders(): HttpHeaders {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return new HttpHeaders();

    const user = JSON.parse(userStr);
    const token = user?.token;

    if (token && token !== 'undefined' && token.length > 20) {
      return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }
    return new HttpHeaders();
  }

  ladeDaten(userId: number): void {
    const headers = this.getAuthHeaders();
    // Nutzt nun die Header, um den 403-Fehler aus image_1dd628.jpg zu vermeiden
    this.http.get<Review[]>(`http://localhost:8080/api/bewertungen/nutzer/${userId}`, { headers })
      .subscribe({
        next: (data) => {
          this.reviews = data;
          this.totalReviews = data.length;
          this.berechneStatistiken(data);
        },
        error: (err) => {
          console.error('Fehler beim Laden der Bewertungen:', err);
        }
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

  getStars(rating: number): string {
    return '⭐'.repeat(Math.floor(rating));
  }
  getInitials(vorname?: string, nachname?: string): string {
    if (!vorname || vorname === '.') return 'C';
    return (vorname[0] + (nachname ? nachname[0] : '')).toUpperCase();
  }

  formatName(vorname?: string, nachname?: string): string {
    if (!vorname || vorname === '.') return 'Cargonaut Nutzer';
    return `${vorname} ${nachname ? nachname.charAt(0) + '.' : ''}`;
  }
  getRelativeTime(dateString?: string): string {
    if (!dateString) return 'unbekannt';

    const reviewDate = new Date(dateString);
    const today = new Date(); // 2026-01-16
    const diffTime = Math.abs(today.getTime() - reviewDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'heute';
    if (diffDays === 1) return 'gestern';
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`;

    return reviewDate.toLocaleDateString(); // Fallback: Echtes Datum
  }
}
