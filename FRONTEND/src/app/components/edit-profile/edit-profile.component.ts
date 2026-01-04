import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { UserProfileService } from '../../services/user-profile.service';

const DEFAULT_AVATAR = 'https://i.pravatar.cc/300?img=68';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ConfirmationModalComponent],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {

  // File input reference
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Success Modal
  showSuccessModal = false;
  isLoading = true;
  isSaving = false;

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
    profileImage: DEFAULT_AVATAR,
    profilePublic: true,
    phoneVisible: true,
    reviewsVisible: true,
    emailNotifications: false
  };

  constructor(
    private router: Router,
    private userProfileService: UserProfileService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      this.isLoading = false;
      return;
    }

    const currentUser = JSON.parse(userStr);
    const email = currentUser.email;

    // Load full profile from backend
    this.userProfileService.getUserProfile(email).subscribe({
      next: (profile) => {
        this.formData.firstName = profile.vorname || '';
        this.formData.lastName = profile.nachname || '';
        this.formData.email = profile.email;
        this.formData.phone = profile.handynummer || '';
        this.formData.city = profile.stadt || '';
        this.formData.zipCode = profile.plz || '';
        this.formData.languages = profile.sprachen || 'Deutsch';
        this.formData.bio = profile.bio || '';
        this.formData.profileImage = profile.profilbild || DEFAULT_AVATAR;
        
        // Set verification flags
        this.formData.emailVerified = profile.ausweisVerifiziert;
        this.formData.phoneVerified = profile.telefonVerifiziert;
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.isLoading = false;
        // Fall back to localStorage data
        this.loadFromLocalStorage(currentUser);
      }
    });
  }

  loadFromLocalStorage(currentUser: any): void {
    const nameParts = currentUser.name?.split(' ') || [];
    this.formData.firstName = nameParts[0] || '';
    this.formData.lastName = nameParts.slice(1).join(' ') || '';
    this.formData.email = currentUser.email || '';
    this.formData.profileImage = currentUser.avatar || DEFAULT_AVATAR;
    this.formData.phone = currentUser.phone || '';
    this.formData.city = currentUser.city || '';
    this.formData.zipCode = currentUser.zipCode || '';
    this.formData.languages = currentUser.languages || 'Deutsch';
    this.formData.bio = currentUser.bio || '';
  }

  onUploadImage(): void {
    // Trigger the hidden file input
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Bitte wähle eine Bilddatei aus (JPG, PNG, GIF)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Das Bild darf maximal 5MB groß sein');
        return;
      }

      // Read file as base64 data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.formData.profileImage = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onRemoveImage(): void {
    if (confirm('Möchtest du dein Profilbild wirklich löschen?')) {
      // Set to default avatar instead of empty string
      this.formData.profileImage = DEFAULT_AVATAR;
      console.log('Profile image reset to default');
    }
  }

  onBackToProfile(): void {
    this.router.navigate(['/profile']);
  }

  onSaveProfile(): void {
    if (this.isSaving) return;
    
    console.log('Save profile:', this.formData);
    this.isSaving = true;

    // Prepare update request
    const updateRequest = {
      vorname: this.formData.firstName,
      nachname: this.formData.lastName,
      handynummer: this.formData.phone,
      stadt: this.formData.city,
      plz: this.formData.zipCode,
      bio: this.formData.bio,
      profilbild: this.formData.profileImage || DEFAULT_AVATAR,
      sprachen: this.formData.languages
    };

    // Send to backend
    this.userProfileService.updateUserProfile(this.formData.email, updateRequest).subscribe({
      next: (updated) => {
        console.log('Profile updated successfully:', updated);
        
        // Update localStorage
        const fullName = `${updated.vorname} ${updated.nachname}`.trim();
        const updatedUser = {
          name: fullName,
          email: updated.email,
          avatar: updated.profilbild || DEFAULT_AVATAR,
          phone: updated.handynummer,
          city: updated.stadt,
          zipCode: updated.plz,
          languages: updated.sprachen,
          bio: updated.bio
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        this.isSaving = false;
        this.showSuccessModal = true;
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.isSaving = false;
        alert('Fehler beim Speichern des Profils. Bitte versuche es erneut.');
      }
    });
  }

  onSuccessConfirm(): void {
    this.showSuccessModal = false;
    this.router.navigate(['/profile']);
  }
}
