import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = 'http://localhost:8080/api/notifications';

  constructor(private http: HttpClient) {}

  getNotifications(userId: string): Observable<Notification[]> {
    const userStr = localStorage.getItem('currentUser');
    const user = userStr ? JSON.parse(userStr) : null;

    // Header mit Token hinzufügen
    const headers = new HttpHeaders().set('Authorization', `Bearer ${user?.token}`);

    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}`, { headers });
  }
}
