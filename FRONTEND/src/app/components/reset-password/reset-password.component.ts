import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
  isVerifying: boolean = true;
  message: string = '';
  error: string = '';
  tokenValid: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get token from URL query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (this.token) {
        this.verifyToken();
      } else {
        this.isVerifying = false;
        this.error = 'Kein Reset-Token gefunden. Bitte verwenden Sie den Link aus der E-Mail.';
      }
    });
  }

  verifyToken(): void {
    this.isVerifying = true;
    this.http.post('http://localhost:8080/api/auth/verify-reset-token', {
      token: this.token
    }).subscribe({
      next: () => {
        this.isVerifying = false;
        this.tokenValid = true;
      },
      error: (err) => {
        this.isVerifying = false;
        this.tokenValid = false;
        this.error = typeof err.error === 'string' ? err.error : 'Token ist ungültig oder abgelaufen';
      }
    });
  }

  onResetPassword(): void {
    // Validation
    if (!this.newPassword || !this.confirmPassword) {
      this.error = 'Bitte füllen Sie beide Passwortfelder aus';
      return;
    }

    if (this.newPassword.length < 6) {
      this.error = 'Passwort muss mindestens 6 Zeichen lang sein';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwörter stimmen nicht überein';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.message = '';

    this.http.post('http://localhost:8080/api/auth/reset-password', {
      token: this.token,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.message = 'Passwort wurde erfolgreich zurückgesetzt!';

        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error || 'Ein Fehler ist aufgetreten';
      }
    });
  }

  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }
}
