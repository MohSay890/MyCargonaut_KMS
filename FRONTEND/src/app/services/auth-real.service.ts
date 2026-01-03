import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

interface LoginResponse {
  token: string;
}

interface UserProfile {
  id: number;
  vorname: string;
  nachname: string;
  email: string;
  stadt?: string;
  plz?: string;
  handynummer?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthRealService {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  private readonly TOKEN_KEY = 'authToken';
  
  private authStatusSubject = new BehaviorSubject<boolean>(this.hasToken());
  public authStatus$ = this.authStatusSubject.asObservable();

  private userSubject = new BehaviorSubject<UserProfile | null>(this.loadUserFromStorage());
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load user profile if token exists
    if (this.hasToken()) {
      this.loadUserProfile();
    }
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  private loadUserFromStorage(): UserProfile | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  private loadUserProfile(): void {
    // TODO: Add backend endpoint to get current user profile
    // For now, we'll parse from token or store during login
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, {
      primaryEmail: email,
      password: password
    }).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        this.authStatusSubject.next(true);
        // Store basic user info
        const user: UserProfile = {
          id: 0, // Will be updated when we fetch profile
          vorname: '',
          nachname: '',
          email: email
        };
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.userSubject.next(user);
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, userData);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('currentUser');
    this.authStatusSubject.next(false);
    this.userSubject.next(null);
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): UserProfile | null {
    return this.userSubject.value;
  }

  updateUserProfile(user: UserProfile): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.userSubject.next(user);
  }
}
