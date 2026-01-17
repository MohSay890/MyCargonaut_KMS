import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';

/**
 * BACKEND MODEL: Entspricht deiner Java-Entity / Datenbank-Struktur.
 */
export interface Fahrt {
  id: number;
  startOrt: string;
  zielOrt: string;
  datum: string;
  uhrzeit?: string;
  freiePlaetze: number;
  preis: number;
  beschreibung?: string;
  abmessungen?: string;
  ladekapazitaet?: string;
  fahrzeugTyp?: string;
  fahrzeugModell?: string;
  entfernung?: string;
  dauer?: string;
  extras?: string;
  kategorie?: string;
  abholadresse?: string;
  lieferadresse?: string;
  erstellerName?: string;
  erstellerEmail?: string;
  erstellerAvatar?: string;
  status: string;
}

/**
 * FRONTEND MODEL: Das Modell für deine UI-Komponenten.
 * Wir definieren hier alle Felder, damit die TS2339 Fehler verschwinden.
 */
export interface TransportOffer {
  id: string;
  driverName: string;

  driverAvatar: string;
  driverRating: number;
  driverTrips: number;
  route: string;
  from: string;
  to: string;
  date: string;
  time: string;
  duration: string;
  distance: string;
  vehicleType: string;
  vehicleModel: string;
  maxWeight: number;
  dimensions: string;
  capacity: string;
  price: number;
  tags: string[]; // Nicht optional, um 'possibly undefined' Fehler zu lösen
  pickupLocation: string;
  dropoffLocation: string;
  description: string;
  kategorie?: string;
  creatorEmail?: string;
  status: string;
  verified: { id: boolean; license: boolean; phone: boolean; };
  memberSince: string;
  responseTime: string;
  reviews: Review[];
}

export interface Review {
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  date: string;
  comment: string;
}

@Injectable({
  providedIn: 'root'
})
export class OfferService {
  private apiUrl = 'http://localhost:8080/api/fahrten';

  constructor(private http: HttpClient) {}

  // Holt alle Angebote (z.B. für die Suche)
  getAllOffers(): Observable<TransportOffer[]> {
    return this.http.get<Fahrt[]>(this.apiUrl).pipe(
      map(fahrten => fahrten.map(f => this.mapFahrtToOffer(f))),
      catchError(() => of([]))
    );
  }

  // src/app/services/offer.service.ts

  // src/app/services/offer.service.ts

  private getAuthHeaders(): HttpHeaders {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return new HttpHeaders();

    try {
      const user = JSON.parse(userStr);
      const token = user?.token;

      // Nur mitschicken, wenn der Token ein echter JWT ist (lang genug)
      // und nicht der String "undefined"
      if (token && token !== 'undefined' && token.length > 20) {
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
      }
    } catch (e) {
      console.error('Fehler beim Parsen des Users:', e);
    }

    // WICHTIG: Wenn kein gültiger Token da ist, KEINEN Header senden!
    // Da dein Backend 'permitAll()' für diese Route hat, funktioniert es dann.
    return new HttpHeaders();
  }
  // Für "Meine Angebote" (Anbieter-Sicht)
  getMyOffers(userEmail: string): Observable<TransportOffer[]> {
    const options = {
      params: new HttpParams().set('email', userEmail),
      headers: this.getAuthHeaders()
    };
    // WICHTIG: Pfad muss exakt wie im Backend (@GetMapping("/angebote/aktiv")) sein
    return this.http.get<Fahrt[]>(`${this.apiUrl}/angebote/aktiv`, options).pipe(
      map(fahrten => fahrten.map(f => this.mapFahrtToOffer(f))),
      catchError(() => of([]))
    );
  }

// 403-Fix für das Laden der gebuchten Fahrten
  getBookedTransports(email: string): Observable<TransportOffer[]> {
    const options = {
      params: new HttpParams().set('email', email),
      headers: this.getAuthHeaders()
    };
    // ÄNDERUNG: Hier muss '/gebucht/aktiv' stehen, damit es zum Controller passt!
    return this.http.get<Fahrt[]>(`${this.apiUrl}/gebucht/aktiv`, options).pipe(
      map((fahrten: Fahrt[]) => fahrten.map(f => this.mapFahrtToOffer(f))),
      catchError(() => of([]))
    );
  }

// 403-Fix für das Speichern einer neuen Buchung
  bookOffer(payload: { fahrtId: number, userId: number | null }): Observable<any> {
    const options = { headers: this.getAuthHeaders() };
    return this.http.post(`${this.apiUrl}/buchungen`, payload, options);
  }

  // Abgeschlossene Fahrten
  // src/app/services/offer.service.ts

  getCompletedTrips(email: string): Observable<TransportOffer[]> {
    const options = {
      params: new HttpParams().set('email', email),
      headers: this.getAuthHeaders() // WICHTIG: Den Token mitschicken!
    };

    return this.http.get<Fahrt[]>(`${this.apiUrl}/abgeschlossen`, options).pipe(
      map((fahrten: Fahrt[]) => fahrten.map(f => this.mapFahrtToOffer(f))),
      catchError((error) => {
        console.error('Fehler beim Laden abgeschlossener Fahrten:', error);
        return of([]);
      })
    );
  }

  getOfferById(id: string): Observable<TransportOffer | undefined> {
    return this.http.get<Fahrt>(`${this.apiUrl}/${id}`).pipe(
      map(fahrt => this.mapFahrtToOffer(fahrt)),
      catchError(() => of(undefined))
    );
  }

  // Suche mit Filtern
  searchOffers(start: string, ziel: string, datum?: string, maxPreis?: number, kategorie?: string, minRating?: number): Observable<TransportOffer[]> {
    let params = new HttpParams().set('start', start).set('ziel', ziel);
    if (datum) params = params.set('datum', datum);
    if (maxPreis) params = params.set('maxPreis', maxPreis.toString());
    if (kategorie) params = params.set('kategorie', kategorie);

    return this.http.get<Fahrt[]>(`${this.apiUrl}/suche`, { params }).pipe(
      map(fahrten => fahrten.map(f => this.mapFahrtToOffer(f))),
      catchError(() => of([]))
    );
  }

  createOffer(data: any, currentUser: any): Observable<TransportOffer> {
    return this.http.post<Fahrt>(this.apiUrl, data).pipe(
      map(saved => this.mapFahrtToOffer(saved))
    );
  }

  deleteOffer(offerId: string, userEmail?: string): Observable<boolean> {
    const url = userEmail ? `${this.apiUrl}/${offerId}/authorized` : `${this.apiUrl}/${offerId}`;
    const params = userEmail ? new HttpParams().set('userEmail', userEmail) : new HttpParams();
    return this.http.delete(url, { params }).pipe(map(() => true), catchError(() => of(false)));
  }

  updateOffer(id: string, data: any, currentUser?: any): Observable<TransportOffer> {
    return this.http.put<Fahrt>(`${this.apiUrl}/${id}`, data).pipe(
      map(saved => this.mapFahrtToOffer(saved))
    );
  }



  /**
   * HILFSMETHODE: Wandelt Backend (Deutsch) in Frontend (Englisch) um.
   * Das löst die "Property does not exist" Fehler in image_0fd550.jpg.
   */
  private mapFahrtToOffer(fahrt: Fahrt): TransportOffer {
    return {
      id: fahrt.id.toString(),
      driverName: fahrt.erstellerName || 'Unbekannt',
      driverAvatar: fahrt.erstellerAvatar || 'https://i.pravatar.cc/150?img=12',
      driverRating: 4.5,
      driverTrips: 0,
      route: `${fahrt.startOrt} → ${fahrt.zielOrt}`,
      from: fahrt.startOrt,
      to: fahrt.zielOrt,
      date: this.formatDateToGerman(fahrt.datum),
      time: fahrt.uhrzeit || '00:00',
      duration: fahrt.dauer || 'ca. 2 Std.',
      distance: fahrt.entfernung || 'N/A',
      vehicleType: fahrt.fahrzeugTyp || 'Transporter',
      vehicleModel: fahrt.fahrzeugModell || '',
      maxWeight: fahrt.freiePlaetze,
      dimensions: fahrt.abmessungen || '',
      capacity: fahrt.ladekapazitaet || '',
      price: fahrt.preis,
      // Sicherstellen, dass tags immer ein Array ist, um TS18048 zu lösen
      tags: fahrt.extras ? fahrt.extras.split(',').filter(t => t.trim()) : [],
      pickupLocation: fahrt.abholadresse || fahrt.startOrt,
      dropoffLocation: fahrt.lieferadresse || fahrt.zielOrt,
      description: fahrt.beschreibung || '',
      kategorie: fahrt.kategorie,
      creatorEmail: fahrt.erstellerEmail,
      status: fahrt.status || 'active',
      verified: { id: true, license: true, phone: true },
      memberSince: 'Neu',
      responseTime: 'Innerhalb 2 Stunden',
      reviews: []
    };
  }

  private formatDateToGerman(isoDate: string): string {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
}
