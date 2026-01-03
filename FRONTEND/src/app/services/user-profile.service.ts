import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfileStats {
  activeOffers: number;
  completedTrips: number;
  averageRating: number;
  earnings: number;
  totalReviews: number;
}

export interface UserProfile {
  id: number;
  vorname: string;
  nachname: string;
  email: string;
  handynummer: string | null;
  stadt: string | null;
  plz: string | null;
  bio: string | null;
  registriert: string | null; // ISO date string
  ausweisVerifiziert: boolean;
  fuehrerscheinVerifiziert: boolean;
  telefonVerifiziert: boolean;
  profilbild: string | null;
  sprachen: string | null;
}

export interface UpdateProfileRequest {
  vorname: string;
  nachname: string;
  handynummer?: string;
  stadt?: string;
  plz?: string;
  bio?: string;
  profilbild?: string;
  sprachen?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private baseUrl = 'http://localhost:8080/api/profile';

  constructor(private http: HttpClient) {}

  getUserProfile(email: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/${email}`);
  }

  getUserStats(email: string): Observable<UserProfileStats> {
    return this.http.get<UserProfileStats>(`${this.baseUrl}/${email}/stats`);
  }

  updateUserProfile(email: string, profile: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/${email}`, profile);
  }
}
