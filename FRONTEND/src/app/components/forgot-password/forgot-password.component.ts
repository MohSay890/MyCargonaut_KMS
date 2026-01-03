import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email: string = '';
  isLoading: boolean = false;
  message: string = '';
  error: string = '';
  resetToken: string = ''; // For demo purposes - in production this would be sent via email

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  onRequestReset(): void {
    if (!this.email) {
      this.error = 'Bitte geben Sie Ihre E-Mail Adresse ein';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.message = '';

    this.http.post<{token: string, message: string}>('http://localhost:8080/api/auth/request-password-reset', {
      email: this.email
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.message = response.message;
        this.resetToken = response.token; // Demo: Display token

        // In production, you'd just show a success message
        // and the user would click the link in their email

        // For demo: Auto-navigate to reset page after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/reset-password'], {
            queryParams: { token: this.resetToken }
          });
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = typeof err.error === 'string' ? err.error : 'Ein Fehler ist aufgetreten';
        console.error('Password reset request error:', err);
      }
    });
  }
}
