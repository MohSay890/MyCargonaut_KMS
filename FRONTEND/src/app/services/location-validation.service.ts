import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LocationValidationService {
  constructor(private http: HttpClient) {}

  isValidPlzAndCity(plz: string, city: string): Observable<boolean> {
    if (!/^\d{5}$/.test(plz)) {
      return of(false);
    }

    return this.http.get<any>('https://api.zippopotam.us/de/' + plz).pipe(
      map(response => {
        if (!response || !response.places) return false;

        const typedCity = city.toLowerCase().replace(/[^a-zäöüß]/g, '');
        for (const place of response.places) {
          const apiCity = place['place name'].toLowerCase().replace(/[^a-zäöüß]/g, '');
          if (apiCity === typedCity || apiCity.includes(typedCity) || typedCity.includes(apiCity)) {
            return true;
          }
        }
        return false;
      }),
      catchError(() => {
        return of(false);
      })
    );
  }

  isValidLocationString(location: string): Observable<boolean> {
    if (!location || location.trim().length < 3) return of(false);

    // Provide an email to Nominatim to comply with their AUP and prevent 429 Too Many Requests
    // Adding it back as a query parameter is technically the most reliable way since some Angular HTTP abstractions strip User-Agent natively on web browsers due to browser CORS security restrictions.
    const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(location) + '&countrycodes=de,at,ch&format=json&limit=1&email=admin@mycargonaut.com';

    const headers = new HttpHeaders({
      'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
    });

    return this.http.get<any[]>(url, { headers }).pipe(
      map(results => {
        return results && results.length > 0;
      }),
      catchError((error) => {
        console.error('Nominatim Location Validation Error:', error);
        return of(false);
      })
    );
  }
}
