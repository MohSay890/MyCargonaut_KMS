import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink],  // <- RouterLink hinzugefügt!
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  currentUser: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load current user
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user;
    }
  }

  onEditProfile(): void {
    this.router.navigate(['/edit-profile']);
  }

  getStars(rating: number): string {
    return '⭐'.repeat(Math.floor(rating));
  }
}
