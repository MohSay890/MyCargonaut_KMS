import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { FooterComponent } from './components/footer/footer.component';
import { UserProfileService } from './services/user-profile.service';
import { filter } from 'rxjs/operators';

const DEFAULT_AVATAR = 'https://i.pravatar.cc/300?img=68';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'MyCargonaut';
  isAuthenticated: boolean = false;
  showUserMenu: boolean = false;
  currentUser: any = null;
  favoritesCount: number = 0;
  defaultAvatar = DEFAULT_AVATAR;

  constructor(
    private router: Router,
    private userProfileService: UserProfileService
  ) {}

  ngOnInit(): void {
    this.checkAuthentication();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.showUserMenu = false;
        // Re-check authentication on navigation
        this.checkAuthentication();
      });
  }

  checkAuthentication(): void {
    const token = localStorage.getItem('authToken');
    this.isAuthenticated = !!token;
    if (this.isAuthenticated) {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const storedUser = JSON.parse(userStr);
        const userEmail = storedUser.email;

        // Fetch fresh user profile from backend
        this.userProfileService.getUserProfile(userEmail).subscribe({
          next: (profile) => {
            // Build complete user object with backend data
            this.currentUser = {
              id: profile.id,
              email: profile.email,
              vorname: profile.vorname,
              nachname: profile.nachname,
              name: `${profile.vorname} ${profile.nachname}`,
              handynummer: profile.handynummer,
              stadt: profile.stadt,
              plz: profile.plz,
              avatar: profile.profilbild || this.defaultAvatar
            };

            // Update localStorage with fresh data
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
          },
          error: (error) => {
            console.error('Error fetching user profile:', error);
            // Fallback to stored data
            this.currentUser = storedUser;
            if (storedUser.vorname && storedUser.nachname) {
              this.currentUser.name = `${storedUser.vorname} ${storedUser.nachname}`;
            } else {
              this.currentUser.name = storedUser.email?.split('@')[0] || 'Benutzer';
            }
            this.currentUser.avatar = storedUser.avatar || this.defaultAvatar;
          }
        });
      } else {
        this.currentUser = null;
      }
      this.loadFavoritesCount();
    } else {
      this.currentUser = null;
      this.favoritesCount = 0;
    }
  }

  loadFavoritesCount(): void {
    // TODO: Load from favorites service
    this.favoritesCount = 0; // Placeholder
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.isAuthenticated = false;
    this.currentUser = null;
    this.showUserMenu = false;
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.showUserMenu = false;
    }
  }
}
