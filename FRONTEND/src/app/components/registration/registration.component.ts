import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

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
  password: string = '';
  passwordRepeat: string = '';
  phone: string = '';
  agbAccepted: boolean = false;
  newsletterAccepted: boolean = false;

  // Error handling
  error: string = '';
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    // Clear previous errors
    this.error = '';
    this.loading = true;

    // Validation
    if (!this.firstName || !this.lastName || !this.email || !this.password || !this.passwordRepeat) {
      this.error = 'Bitte fülle alle Pflichtfelder aus.';
      this.loading = false;
      return;
    }

    if (this.password !== this.passwordRepeat) {
      this.error = 'Die Passwörter stimmen nicht überein.';
      this.loading = false;
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Das Passwort muss mindestens 6 Zeichen lang sein.';
      this.loading = false;
      return;
    }

    if (!this.agbAccepted) {
      this.error = 'Bitte akzeptiere die Nutzungsbedingungen.';
      this.loading = false;
      return;
    }

    // Create user data
    const userData = {
      name: `${this.firstName} ${this.lastName}`,
      email: this.email,
      password: this.password,
      phone: this.phone
    };

    const success = this.authService.register(userData);

    this.loading = false;

    if (success) {
      console.log('Registrierung erfolgreich');
      this.router.navigate(['/dashboard']);
    } else {
      this.error = 'Registrierung fehlgeschlagen. Bitte versuche es erneut.';
    }
  }
}
