import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ConfirmationModalComponent],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {

  // Success Modal
  showSuccessModal = false;

  formData = {
    firstName: '',
    lastName: '',
    email: '',
    emailVerified: true,
    phone: '',
    phoneVerified: true,
    city: '',
    zipCode: '',
    country: 'Deutschland',
    languages: '',
    bio: '',
    profileImage: 'https://i.pravatar.cc/300?img=12',
    profilePublic: true,
    phoneVisible: true,
    reviewsVisible: true,
    emailNotifications: false
  };

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Load current user data
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      // Split name into first and last name
      const nameParts = currentUser.name.split(' ');
      this.formData.firstName = nameParts[0] || '';
      this.formData.lastName = nameParts.slice(1).join(' ') || '';

      this.formData.email = currentUser.email;
      this.formData.profileImage = currentUser.profileImage || 'https://i.pravatar.cc/300?img=12';

      // Load other fields with default data
      this.formData.phone = '+49 123 456789';
      this.formData.city = 'Berlin';
      this.formData.zipCode = '10115';
      this.formData.country = 'Deutschland';
      this.formData.languages = 'Deutsch, Englisch';
      this.formData.bio = 'Hallo! Ich bin Max und fahre regelmäßig zwischen verschiedenen Städten in Deutschland. Ich biete zuverlässigen Transport für verschiedene Gegenstände an.';
    }
  }

  onUploadImage(): void {
    console.log('Upload image clicked');
    // TODO: Implement image upload
    alert('Bild hochladen - Diese Funktion wird noch implementiert');
  }

  onRemoveImage(): void {
    if (confirm('Möchtest du dein Profilbild wirklich löschen?')) {
      this.formData.profileImage = '';
      console.log('Profile image removed');
    }
  }

  onBackToProfile(): void {
    this.router.navigate(['/profile']);
  }

  onSaveProfile(): void {
    console.log('Save profile:', this.formData);

    // Combine first and last name
    const fullName = `${this.formData.firstName} ${this.formData.lastName}`.trim();

    // Update user in AuthService
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      currentUser.name = fullName;
      currentUser.email = this.formData.email;
      currentUser.profileImage = this.formData.profileImage;

      // Update in localStorage
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    // Show success modal
    this.showSuccessModal = true;
  }

  onSuccessConfirm(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/profile']);
  }
}
