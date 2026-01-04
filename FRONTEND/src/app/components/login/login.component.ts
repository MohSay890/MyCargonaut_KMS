import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  error: string = '';
  loading: boolean = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  onLogin(): void {
    this.error = '';
    this.loading = true;

    if (!this.email || !this.password) {
      this.error = 'Bitte fülle alle Felder aus.';
      this.loading = false;
      return;
    }

    // Call backend API
    this.http.post<{
      token: string;
      id: number;
      email: string;
      vorname: string;
      nachname: string;
      handynummer?: string;
      stadt?: string;
      plz?: string;
      registriert?: string;
    }>('http://localhost:8080/api/auth/login', {
      primaryEmail: this.email,
      password: this.password
    }).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Login erfolgreich:', response);
        // Store token
        localStorage.setItem('authToken', response.token);
        // Store full user data from backend
        localStorage.setItem('currentUser', JSON.stringify({
          id: response.id,
          email: response.email,
          vorname: response.vorname,
          nachname: response.nachname,
          handynummer: response.handynummer,
          stadt: response.stadt,
          plz: response.plz,
          registriert: response.registriert
        }));
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = typeof err.error === 'string' ? err.error : (err.message || 'Login fehlgeschlagen.');
        console.error('Login error:', err);
      }
    });
  }

  onForgotPassword(): void {
    console.log('Passwort vergessen');
    alert('Passwort-Reset Funktion wird bald verfügbar sein!');
  }

  onGoogleLogin(): void {
    console.log('Google Login');
    alert('Google Login wird bald verfügbar sein!');
  }

  onFacebookLogin(): void {
    console.log('Facebook Login');
    alert('Facebook Login wird bald verfügbar sein!');
  }
}
