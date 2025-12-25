import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

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
    private authService: AuthService,
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

    const success = this.authService.login(this.email, this.password);

    this.loading = false;

    if (success) {
      console.log('Login erfolgreich');
      this.router.navigate(['/dashboard']);
    } else {
      this.error = 'Ungültige E-Mail oder Passwort.';
    }
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
