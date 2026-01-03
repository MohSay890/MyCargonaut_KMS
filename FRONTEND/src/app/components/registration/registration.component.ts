import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent {

  // Form fields
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  emailRepeat: string = '';
  password: string = '';
  passwordRepeat: string = '';
  phone: string = '';
  birthdate: string = ''; // geburtsdatum
  city: string = ''; // stadt
  postalCode: string = ''; // plz
  agbAccepted: boolean = false;
  newsletterAccepted: boolean = false;

  // Error handling
  error: string = '';
  loading: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  onSubmit(): void {
    // Clear previous errors
    this.error = '';
    this.loading = true;

    // Validation
    if (!this.firstName || !this.lastName || !this.email || !this.emailRepeat || !this.password || !this.passwordRepeat || !this.phone || !this.birthdate || !this.city || !this.postalCode) {
      this.error = 'Bitte fülle alle Pflichtfelder aus.';
      this.loading = false;
      return;
    }

    if (this.email !== this.emailRepeat) {
      this.error = 'Die E-Mail-Adressen stimmen nicht überein.';
      this.loading = false;
      return;
    }

    if (this.password !== this.passwordRepeat) {
      this.error = 'Die Passwörter stimmen nicht überein.';
      this.loading = false;
      return;
    }

    // Password requirements: min 8 chars, one uppercase, one number
    if (this.password.length < 8) {
      this.error = 'Das Passwort muss mindestens 8 Zeichen lang sein.';
      this.loading = false;
      return;
    }

    if (!/[A-Z]/.test(this.password)) {
      this.error = 'Das Passwort muss mindestens einen Großbuchstaben enthalten.';
      this.loading = false;
      return;
    }

    if (!/[0-9]/.test(this.password)) {
      this.error = 'Das Passwort muss mindestens eine Zahl enthalten.';
      this.loading = false;
      return;
    }

    if (!this.agbAccepted) {
      this.error = 'Bitte akzeptiere die Nutzungsbedingungen.';
      this.loading = false;
      return;
    }

    // Age validation: User must be 18+
    if (!this.isAtLeast18()) {
      this.error = 'Du musst mindestens 18 Jahre alt sein, um dich zu registrieren.';
      this.loading = false;
      return;
    }

    // Create user data
    const userData = {
      firstName: this.firstName,
      lastName: this.lastName,
      primaryEmail: this.email,
      secondaryEmail: null,
      password: this.password,
      dateOfBirth: this.birthdate,
      phone: this.phone,
      stadt: this.city,
      plz: this.postalCode
    };

    // Call backend API
    this.http.post('http://localhost:8080/api/auth/register', userData).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Registrierung erfolgreich:', response);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.error = typeof err.error === 'string' ? err.error : (err.message || 'Registrierung fehlgeschlagen. Bitte versuche es erneut.');
        console.error('Registrierungsfehler:', err);
      }
    });
  }

  // Helper methods for password validation
  hasUppercase(): boolean {
    return /[A-Z]/.test(this.password);
  }

  hasNumber(): boolean {
    return /[0-9]/.test(this.password);
  }

  // Helper method for age validation
  isAtLeast18(): boolean {
    if (!this.birthdate) return false;

    const today = new Date();
    const birthDate = new Date(this.birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= 18;
  }
}
