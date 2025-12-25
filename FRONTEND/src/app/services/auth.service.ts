import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authStatusSubject = new BehaviorSubject<boolean>(this.hasToken());
  public authStatus$ = this.authStatusSubject.asObservable();

  constructor() { }

  private hasToken(): boolean {
    return !!localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  login(email: string, password: string): boolean {
    // Simple mock login
    if (email && password) {
      const mockUser = {
        id: '1',
        name: 'Max Mustermann',
        email: email,
        avatar: 'https://i.pravatar.cc/150?img=1',
        phone: '+49 123 456789',
        memberSince: 'Januar 2023',
        bio: 'Erfahrener Fahrer mit über 100 erfolgreichen Transporten.',
        rating: 4.8,
        completedTrips: 127,
        verified: {
          email: true,
          phone: true,
          id: true
        }
      };

      localStorage.setItem('authToken', 'mock-jwt-token');
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      this.authStatusSubject.next(true);
      return true;
    }
    return false;
  }

  register(userData: any): boolean {
    // Simple mock registration
    if (userData.email && userData.password) {
      const newUser = {
        id: Date.now().toString(),
        name: userData.name || 'Neuer Benutzer',
        email: userData.email,
        avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70),
        phone: userData.phone || '',
        memberSince: new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
        bio: '',
        rating: 0,
        completedTrips: 0,
        verified: {
          email: false,
          phone: false,
          id: false
        }
      };

      localStorage.setItem('authToken', 'mock-jwt-token');
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      this.authStatusSubject.next(true);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.authStatusSubject.next(false);
  }

  updateUser(userData: any): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  }
}
