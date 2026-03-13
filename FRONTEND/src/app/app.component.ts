import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { FooterComponent } from './components/footer/footer.component';
import { UserProfileService } from './services/user-profile.service';
import { NotificationService, Notification } from './services/notification.service';
import { filter } from 'rxjs/operators';
import { Subscription, interval } from 'rxjs';

const DEFAULT_AVATAR = 'https://i.pravatar.cc/300?img=68';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'MyCargonaut';
  isAuthenticated: boolean = false;
  showUserMenu: boolean = false;
  showNotificationsMenu: boolean = false;
  currentUser: any = null;
  favoritesCount: number = 0;
  defaultAvatar = DEFAULT_AVATAR;

  notifications: Notification[] = [];
  unreadNotificationCount: number = 0;
  private notificationSub: Subscription | null = null;
  private pollSub: Subscription | null = null;

  constructor(
    private router: Router,
    private userProfileService: UserProfileService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.checkAuthentication();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.showUserMenu = false;
        this.showNotificationsMenu = false;
        // Re-check authentication on navigation
        this.checkAuthentication();
      });
  }

  ngOnDestroy(): void {
    if (this.notificationSub) this.notificationSub.unsubscribe();
    if (this.pollSub) this.pollSub.unsubscribe();
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
        this.stopNotificationPolling();
      }
      this.loadFavoritesCount();
      if (this.currentUser) {
        this.loadNotifications();
        this.startNotificationPolling();
      }
    } else {
      this.currentUser = null;
      this.favoritesCount = 0;
      this.stopNotificationPolling();
    }
  }

  loadFavoritesCount(): void {
    // TODO: Load from favorites service
    this.favoritesCount = 0; // Placeholder
  }

  loadNotifications(): void {
    if (!this.currentUser?.email) return;

    if (this.notificationSub) this.notificationSub.unsubscribe();
    this.notificationSub = this.notificationService.getUserNotifications(this.currentUser.email).subscribe({
      next: (notifications) => {
        this.notifications = notifications.slice(0, 5); // Show latest 5
        // Just for display logic, if a type is 'booking' it means actionable request
        this.unreadNotificationCount = notifications.filter(n => ['booking', 'message', 'offer', 'offer-status'].includes(n.type)).length;
      },
      error: (err) => console.error('Error fetching notifications:', err)
    });
  }

  startNotificationPolling(): void {
    if (!this.pollSub) {
      this.pollSub = interval(30000).subscribe(() => {
        this.loadNotifications();
      });
    }
  }

  stopNotificationPolling(): void {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
      this.pollSub = null;
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotificationsMenu = false;
  }

  toggleNotificationsMenu(): void {
    this.showNotificationsMenu = !this.showNotificationsMenu;
    this.showUserMenu = false;
  }

  closeMenus(): void {
    this.showUserMenu = false;
    this.showNotificationsMenu = false;
  }

  onNotificationClick(notification: Notification): void {
    this.closeMenus();
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    } else {
      this.router.navigate(['/dashboard']);
    }
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
    if (!target.closest('.user-menu') && !target.closest('.notifications-container')) {
      this.closeMenus();
    }
  }
}
