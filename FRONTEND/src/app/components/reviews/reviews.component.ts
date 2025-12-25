import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';

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
  overallRating: number = 4.8;
  totalReviews: number = 67;

  // Rating breakdown
  ratingBreakdown = {
    5: 45,
    4: 18,
    3: 3,
    2: 1,
    1: 0
  };

  // Category ratings
  categoryRatings = {
    punctuality: 4.9,
    care: 4.8,
    communication: 4.7,
    friendliness: 4.9
  };

  // Filter & Sort
  filterRating: string = 'all';
  sortBy: string = 'newest';

  reviews: Review[] = [
    {
      id: '1',
      reviewerName: 'Anna K.',
      reviewerAvatar: 'https://i.pravatar.cc/50?img=5',
      rating: 5,
      date: 'vor 2 Wochen',
      route: 'Hamburg → Berlin',
      comment: 'Sehr zuverlässig und pünktlich! Hat beim Tragen geholfen und war sehr freundlich. Gerne wieder!',
      tags: ['Pünktlich', 'Freundlich', 'Hilfsbereit']
    },
    {
      id: '2',
      reviewerName: 'Peter M.',
      reviewerAvatar: 'https://i.pravatar.cc/50?img=12',
      rating: 5,
      date: 'vor 1 Monat',
      route: 'München → Stuttgart',
      comment: 'Perfekter Transport! Alles ist heil angekommen. Kann ich nur weiterempfehlen. Sehr professionell und sorgfältig.',
      tags: ['Sorgfältig', 'Professionell', 'Fahrzeug sauber']
    },
    {
      id: '3',
      reviewerName: 'Lisa S.',
      reviewerAvatar: 'https://i.pravatar.cc/50?img=9',
      rating: 4,
      date: 'vor 2 Monaten',
      route: 'Köln → Frankfurt',
      comment: 'Alles gut gelaufen. Kleine Verspätung aber vorher Bescheid gegeben. Sonst top!',
      tags: ['Gute Kommunikation', 'Sorgfältig']
    },
    {
      id: '4',
      reviewerName: 'Michael B.',
      reviewerAvatar: 'https://i.pravatar.cc/50?img=13',
      rating: 5,
      date: 'vor 3 Monaten',
      route: 'Berlin → Hamburg',
      comment: 'Super Erfahrung! Sehr flexibel und hat sich gut an meine Zeitpläne angepasst. Würde wieder buchen.',
      tags: ['Flexibel', 'Pünktlich', 'Freundlich']
    },
    {
      id: '5',
      reviewerName: 'Sandra H.',
      reviewerAvatar: 'https://i.pravatar.cc/50?img=16',
      rating: 5,
      date: 'vor 3 Monaten',
      route: 'Hannover → Bremen',
      comment: 'Sehr empfehlenswert! Transport war schnell und sicher. Sehr netter Fahrer.',
      tags: ['Schnell', 'Sicher', 'Freundlich']
    },
    {
      id: '6',
      reviewerName: 'Tom K.',
      reviewerAvatar: 'https://i.pravatar.cc/50?img=11',
      rating: 5,
      date: 'vor 4 Monaten',
      route: 'Dortmund → Düsseldorf',
      comment: 'Perfekt! Pünktlich abgeholt und geliefert. Sehr zu empfehlen.',
      tags: ['Pünktlich', 'Zuverlässig']
    },
    {
      id: '7',
      reviewerName: 'Julia W.',
      reviewerAvatar: 'https://i.pravatar.cc/50?img=10',
      rating: 4,
      date: 'vor 4 Monaten',
      route: 'Leipzig → Dresden',
      comment: 'Guter Service. Ein bisschen unorganisiert beim Beladen aber am Ende alles gut.',
      tags: ['Freundlich']
    },
    {
      id: '8',
      reviewerName: 'Markus T.',
      reviewerAvatar: 'https://i.pravatar.cc/50?img=33',
      rating: 5,
      date: 'vor 5 Monaten',
      route: 'Stuttgart → München',
      comment: 'Top Fahrer! Sehr sorgfältig mit meinen Sachen umgegangen. Danke!',
      tags: ['Sorgfältig', 'Professionell']
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get current user name from AuthService
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.driverName = currentUser.name;
    } else {
      this.driverName = 'Unbekannter Benutzer';
    }
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
