import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { UserProfileService, UserProfile, UserProfileStats } from '../../services/user-profile.service';

const DEFAULT_AVATAR = 'https://i.pravatar.cc/150?img=12';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  currentUser: any = null;
  userProfile: UserProfile | null = null;
  userStats: UserProfileStats | null = null;
  earnings: number = 0;
  defaultAvatar = DEFAULT_AVATAR;
  isLoading = true;

  constructor(
    private router: Router,
    private http: HttpClient,
    private userProfileService: UserProfileService
  ) {}

  ngOnInit(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
      this.loadProfileData();
    } else {
      this.isLoading = false;
    }
  }

  loadProfileData(): void {
    if (!this.currentUser?.email) {
      this.isLoading = false;
      return;
    }

    // Load profile and stats
    this.userProfileService.getUserProfile(this.currentUser.email).subscribe({
      next: (profile) => {
        this.userProfile = profile;
        console.log('Profile loaded:', profile);
      },
      error: (err) => {
        console.error('Error loading profile:', err);
      }
    });

    this.userProfileService.getUserStats(this.currentUser.email).subscribe({
      next: (stats) => {
        this.userStats = stats;
        this.isLoading = false;
        console.log('Stats loaded:', stats);
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        this.isLoading = false;
      }
    });

    // Load earnings from payment API
    this.loadEarnings(this.currentUser.email);
  }

  loadEarnings(email: string): void {
    this.http.get<{
      totalEarnings: number;
      refundedAmount: number;
      netEarnings: number;
      completedPayments: number;
      refundedPayments: number;
    }>(`http://localhost:8080/api/payments/earnings?email=${encodeURIComponent(email)}`).subscribe({
      next: (earnings) => {
        this.earnings = Number(earnings.netEarnings.toFixed(2));
      },
      error: (error) => {
        console.error('Error loading earnings:', error);
        this.earnings = 0;
      }
    });
  }

  getUserFullName(): string {
    if (this.userProfile) {
      return `${this.userProfile.vorname} ${this.userProfile.nachname}`;
    }
    if (!this.currentUser) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return user.name || user.email?.split('@')[0] || 'Benutzer';
      }
      return 'Benutzer';
    }
    return this.currentUser.name || this.currentUser.email?.split('@')[0] || 'Benutzer';
  }

  getUserEmail(): string {
    return this.userProfile?.email || this.currentUser?.email || '';
  }

  getUserPhone(): string {
    return this.userProfile?.handynummer || 'Nicht angegeben';
  }

  getUserLocation(): string {
    if (this.userProfile?.stadt) {
      return `${this.userProfile.stadt}, Deutschland`;
    }
    return 'Nicht angegeben';
  }

  getUserLanguages(): string {
    return this.userProfile?.sprachen || 'Nicht angegeben';
  }

  getUserBio(): string {
    return this.userProfile?.bio || 'Keine Beschreibung vorhanden.';
  }

  getMemberSince(): string {
    if (this.userProfile?.registriert) {
      const date = new Date(this.userProfile.registriert);
      return date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long' });
    }
    return 'Unbekannt';
  }

  getProfileImage(): string {
    return this.userProfile?.profilbild || this.currentUser?.avatar || this.defaultAvatar;
  }

  getVerificationText(): string {
    if (!this.userProfile) return 'Keine Verifizierungen';

    const verifications = [];
    if (this.userProfile.ausweisVerifiziert) verifications.push('Ausweis verifiziert');
    if (this.userProfile.fuehrerscheinVerifiziert) verifications.push('Führerschein verifiziert');
    if (this.userProfile.telefonVerifiziert) verifications.push('Telefon verifiziert');

    return verifications.length > 0 ? verifications.join(' | ') : 'Keine Verifizierungen';
  }

  onEditProfile(): void {
    this.router.navigate(['/edit-profile']);
  }

  getStars(rating: number): string {
    return '⭐'.repeat(Math.floor(rating));
  }
}
