import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';

// Backend Fahrt model (matches Java entity)
export interface Fahrt {
  id: number;
  startOrt: string;
  zielOrt: string;
  datum: string; // LocalDate comes as "2026-01-15"
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
  extras?: string; // Comma-separated tags (e.g., "Versicherung inkl.,Be-/Entladehilfe")
  kategorie?: string; // Category (e.g., "möbel", "pakete", "umzug")
  abholadresse?: string; // Detailed pickup address (e.g., "Frankfurt am Main Hauptbahnhof")
  lieferadresse?: string; // Detailed delivery address (e.g., "Giessen Bahnhof")
  erstellerName?: string;
  erstellerEmail?: string;
  erstellerAvatar?: string;
  fahrer?: any;
  fahrzeug?: any;
}

// Frontend display model (for UI)
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
  tags: string[];
  pickupLocation: string;
  dropoffLocation: string;
  description: string;
  kategorie?: string; // Category (e.g., "möbel", "pakete", "umzug")
  creatorEmail?: string; // Email of the user who created this offer
  verified: {
    id: boolean;
    license: boolean;
    phone: boolean;
  };
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

  // Fallback mock data (used when backend is not available)
  private mockOffers: TransportOffer[] = [
    {
      id: '1',
      driverName: 'Thomas M.',
      driverAvatar: 'https://i.pravatar.cc/150?img=11',
      driverRating: 4.9,
      driverTrips: 67,
      route: 'Berlin → Hamburg',
      from: 'Berlin',
      to: 'Hamburg',
      date: '15.01.2026',
      time: '08:00',
      duration: 'ca. 3 Std.',
      distance: '290 km',
      vehicleType: 'Transporter',
      vehicleModel: 'Mercedes Sprinter',
      maxWeight: 100,
      dimensions: '200 x 150 x 120 cm',
      capacity: '12 m³',
      price: 65,
      tags: ['Versicherung inkl.', 'Be-/Entladehilfe'],
      pickupLocation: 'Berlin Mitte, 10115',
      dropoffLocation: 'Hamburg Altona, 22765',
      description: 'Zuverlässiger Transport zwischen Berlin und Hamburg.',
      verified: { id: true, license: true, phone: true },
      memberSince: 'Januar 2023',
      responseTime: 'Innerhalb 2 Stunden',
      reviews: []
    },
    {
      id: '2',
      driverName: 'Sarah K.',
      driverAvatar: 'https://i.pravatar.cc/150?img=5',
      driverRating: 5.0,
      driverTrips: 143,
      route: 'München → Stuttgart',
      from: 'München',
      to: 'Stuttgart',
      date: '22.01.2026',
      time: '14:00',
      duration: 'ca. 2 Std.',
      distance: '230 km',
      vehicleType: 'PKW',
      vehicleModel: 'VW Passat Kombi',
      maxWeight: 50,
      dimensions: '120 x 80 x 60 cm',
      capacity: '1.8 m³',
      price: 45,
      tags: ['Express', 'Versicherung inkl.'],
      pickupLocation: 'München Zentrum, 80331',
      dropoffLocation: 'Stuttgart Mitte, 70173',
      description: 'Express-Service zwischen München und Stuttgart.',
      verified: { id: true, license: true, phone: true },
      memberSince: 'März 2022',
      responseTime: 'Innerhalb 1 Stunde',
      reviews: []
    }
  ];

  constructor(private http: HttpClient) {}

  // GET all offers from backend
  getAllOffers(): Observable<TransportOffer[]> {
    return this.http.get<Fahrt[]>(this.apiUrl).pipe(
      map(fahrten => fahrten.map(f => this.mapFahrtToOffer(f))),
      catchError(error => {
        console.warn('Backend not available, using mock data:', error);
        return of(this.mockOffers);
      })
    );
  }

  // GET offers by current user's email (for "Meine Fahrten")
  getMyOffers(userEmail: string): Observable<TransportOffer[]> {
    return this.http.get<Fahrt[]>(`${this.apiUrl}/meine`, {
      params: new HttpParams().set('email', userEmail)
    }).pipe(
      map(fahrten => fahrten.map(f => this.mapFahrtToOffer(f))),
      catchError(error => {
        console.warn('Backend not available, returning empty:', error);
        return of([]);
      })
    );
  }

  // GET all offers (synchronous - for components that need immediate data)
  getAllOffersSync(): TransportOffer[] {
    return this.mockOffers;
  }

  // GET single offer by ID
  getOfferById(id: string): Observable<TransportOffer | undefined> {
    return this.http.get<Fahrt>(`${this.apiUrl}/${id}`).pipe(
      map(fahrt => this.mapFahrtToOffer(fahrt)),
      catchError(error => {
        console.warn('Backend not available, using mock data:', error);
        return of(this.mockOffers.find(o => o.id === id));
      })
    );
  }

  // GET offer by ID (synchronous)
  getOfferByIdSync(id: string): TransportOffer | undefined {
    return this.mockOffers.find(offer => offer.id === id);
  }

  // Search offers with filters
  searchOffers(start: string, ziel: string, datum?: string, maxPreis?: number, kategorie?: string, minRating?: number): Observable<TransportOffer[]> {
    let params = new HttpParams()
      .set('start', start)
      .set('ziel', ziel);

    if (datum) {
      params = params.set('datum', datum); // Format: "2026-01-15"
    }
    if (maxPreis) {
      params = params.set('maxPreis', maxPreis.toString());
    }
    if (kategorie) {
      params = params.set('kategorie', kategorie);
    }
    if (minRating) {
      params = params.set('minRating', minRating.toString());
    }

    return this.http.get<Fahrt[]>(`${this.apiUrl}/suche`, { params }).pipe(
      map(fahrten => fahrten.map(f => this.mapFahrtToOffer(f))),
      catchError(error => {
        console.warn('Backend not available, filtering mock data:', error);
        return of(this.filterMockOffers(start, ziel, maxPreis));
      })
    );
  }

  // CREATE new offer
  createOffer(data: any, currentUser: any): Observable<TransportOffer> {
    const fahrt: Partial<Fahrt> = {
      startOrt: data.from,
      zielOrt: data.to,
      datum: data.date, // Format: "2026-01-15"
      uhrzeit: data.time,
      freiePlaetze: data.maxWeight || 1,
      preis: data.price,
      beschreibung: data.description,
      abmessungen: data.dimensions,
      ladekapazitaet: data.capacity,
      fahrzeugTyp: data.vehicleType,
      fahrzeugModell: data.vehicleModel,
      entfernung: data.distance,
      dauer: data.duration,
      kategorie: data.category,
      abholadresse: data.pickupLocation,
      lieferadresse: data.dropoffLocation,
      // Store tags/extras as comma-separated string
      extras: data.tags ? data.tags.join(',') : '',
      // Store creator info
      erstellerName: currentUser?.name || 'Unbekannt',
      erstellerEmail: currentUser?.email || '',
      erstellerAvatar: currentUser?.avatar || ''
    };

    return this.http.post<Fahrt>(this.apiUrl, fahrt).pipe(
      map(savedFahrt => this.mapFahrtToOffer(savedFahrt, data, currentUser)),
      catchError(error => {
        console.warn('Backend not available, saving to mock:', error);
        const newOffer = this.createMockOffer(data, currentUser);
        this.mockOffers.push(newOffer);
        return of(newOffer);
      })
    );
  }

  // DELETE offer (with authorization)
  deleteOffer(offerId: string, userEmail?: string): Observable<boolean> {
    // Use authorized endpoint if userEmail is provided
    if (userEmail) {
      const url = `${this.apiUrl}/${offerId}/authorized`;
      const params = new HttpParams().set('userEmail', userEmail);

      return this.http.delete(url, { params }).pipe(
        map(() => true),
        catchError(error => {
          if (error.status === 403) {
            console.error('Unauthorized: You can only delete your own offers');
            return of(false);
          }
          console.warn('Backend not available, deleting from mock:', error);
          const index = this.mockOffers.findIndex(o => o.id === offerId);
          if (index > -1) {
            this.mockOffers.splice(index, 1);
            return of(true);
          }
          return of(false);
        })
      );
    } else {
      // Delete without authorization (for backward compatibility)
      const url = `${this.apiUrl}/${offerId}`;
      return this.http.delete(url).pipe(
        map(() => true),
        catchError(error => {
          console.warn('Backend not available, deleting from mock:', error);
          const index = this.mockOffers.findIndex(o => o.id === offerId);
          if (index > -1) {
            this.mockOffers.splice(index, 1);
            return of(true);
          }
          return of(false);
        })
      );
    }
  }

  // UPDATE offer (with authorization)
  updateOffer(id: string, data: any, currentUser?: any): Observable<TransportOffer> {
    const fahrt: Partial<Fahrt> = {
      startOrt: data.from,
      zielOrt: data.to,
      datum: data.date,
      uhrzeit: data.time,
      freiePlaetze: data.maxWeight || 1,
      preis: data.price,
      beschreibung: data.description,
      abmessungen: data.dimensions,
      ladekapazitaet: data.capacity,
      fahrzeugTyp: data.vehicleType,
      fahrzeugModell: data.vehicleModel,
      entfernung: data.distance,
      dauer: data.duration,
      kategorie: data.category,
      abholadresse: data.pickupLocation,
      lieferadresse: data.dropoffLocation,
      // Store tags/extras as comma-separated string
      extras: data.tags ? data.tags.join(',') : '',
      erstellerName: currentUser?.name,
      erstellerEmail: currentUser?.email,
      erstellerAvatar: currentUser?.avatar
    };

    // Use authorized endpoint with userEmail
    const userEmail = currentUser?.email || '';
    const url = userEmail
      ? `${this.apiUrl}/${id}/authorized?userEmail=${encodeURIComponent(userEmail)}`
      : `${this.apiUrl}/${id}`;

    return this.http.put<Fahrt>(url, fahrt).pipe(
      map(savedFahrt => this.mapFahrtToOffer(savedFahrt, data, currentUser)),
      catchError(error => {
        if (error.status === 403) {
          console.error('Unauthorized: You can only edit your own offers');
          throw new Error('Sie können nur Ihre eigenen Angebote bearbeiten.');
        }
        console.warn('Backend not available:', error);
        // Update mock data if backend is not available
        const index = this.mockOffers.findIndex(o => o.id === id);
        if (index > -1) {
          this.mockOffers[index] = {
            ...this.mockOffers[index],
            from: data.from,
            to: data.to,
            route: `${data.from} → ${data.to}`,
            date: this.formatDateToGerman(data.date),
            time: data.time,
            price: data.price,
            description: data.description,
            tags: data.tags || [],
            vehicleType: data.vehicleType,
            vehicleModel: data.vehicleModel,
            maxWeight: data.maxWeight,
            dimensions: data.dimensions
          };
          return of(this.mockOffers[index]);
        }
        return of(this.mockOffers.find(o => o.id === id)!);
      })
    );
  }

  // Helper: Map backend Fahrt to frontend TransportOffer
  private mapFahrtToOffer(fahrt: Fahrt, extraData?: any, user?: any): TransportOffer {
    return {
      id: fahrt.id.toString(),
      // Use stored creator info from backend, fallback to passed user, then to defaults
      driverName: fahrt.erstellerName || fahrt.fahrer?.vorname || user?.name || 'Unbekannt',
      driverAvatar: fahrt.erstellerAvatar || user?.avatar || 'https://i.pravatar.cc/150?img=12',
      driverRating: user?.rating || 4.5,
      driverTrips: user?.trips || 0,
      route: `${fahrt.startOrt} → ${fahrt.zielOrt}`,
      from: fahrt.startOrt,
      to: fahrt.zielOrt,
      date: this.formatDateToGerman(fahrt.datum),
      // Use stored fields from backend, fallback to extraData
      time: fahrt.uhrzeit || extraData?.time || '08:00',
      duration: fahrt.dauer || extraData?.duration || 'ca. 2-3 Std.',
      distance: fahrt.entfernung || extraData?.distance || '',
      vehicleType: fahrt.fahrzeugTyp || fahrt.fahrzeug?.typ || extraData?.vehicleType || 'PKW',
      vehicleModel: fahrt.fahrzeugModell || fahrt.fahrzeug?.modell || extraData?.vehicleModel || '',
      maxWeight: fahrt.freiePlaetze,
      dimensions: fahrt.abmessungen || extraData?.dimensions || '',
      capacity: fahrt.ladekapazitaet || extraData?.capacity || '',
      price: fahrt.preis,
      // Parse extras from backend (comma-separated string) or use extraData tags
      tags: fahrt.extras ? fahrt.extras.split(',').filter(t => t.trim()) : (extraData?.tags || []),
      pickupLocation: fahrt.abholadresse || extraData?.pickupLocation || fahrt.startOrt,
      dropoffLocation: fahrt.lieferadresse || extraData?.dropoffLocation || fahrt.zielOrt,
      description: fahrt.beschreibung || extraData?.description || '',
      kategorie: fahrt.kategorie || extraData?.category,
      creatorEmail: fahrt.erstellerEmail,
      verified: user?.verified || { id: true, license: true, phone: true },
      memberSince: this.formatMemberSince(user?.registriert),
      responseTime: 'Innerhalb 2 Stunden',
      reviews: []
    };
  }

  // Helper: Format ISO date to German format
  private formatDateToGerman(isoDate: string): string {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  // Helper: Filter mock offers
  private filterMockOffers(start: string, ziel: string, maxPreis?: number): TransportOffer[] {
    return this.mockOffers.filter(offer => {
      const matchStart = offer.from.toLowerCase().includes(start.toLowerCase());
      const matchZiel = offer.to.toLowerCase().includes(ziel.toLowerCase());
      const matchPreis = !maxPreis || offer.price <= maxPreis;
      return matchStart && matchZiel && matchPreis;
    });
  }

  // Helper: Create mock offer
  private createMockOffer(data: any, currentUser: any): TransportOffer {
    return {
      id: 'mock_' + Date.now(),
      driverName: currentUser?.name || 'Max Mustermann',
      driverAvatar: currentUser?.avatar || 'https://i.pravatar.cc/150?img=1',
      driverRating: currentUser?.rating || 5.0,
      driverTrips: currentUser?.trips || 0,
      route: `${data.from} → ${data.to}`,
      from: data.from,
      to: data.to,
      date: this.formatDateToGerman(data.date),
      time: data.time,
      duration: data.duration,
      distance: data.distance,
      vehicleType: data.vehicleType,
      vehicleModel: data.vehicleModel,
      maxWeight: data.maxWeight,
      dimensions: data.dimensions,
      capacity: data.capacity,
      price: data.price,
      tags: data.tags || [],
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      description: data.description,
      verified: currentUser?.verified || { id: true, license: true, phone: true },
      memberSince: this.formatMemberSince(currentUser?.registriert),
      responseTime: 'Innerhalb 2 Stunden',
      reviews: []
    };
  }

  // Helper: Format registriert date to German month + year (e.g., "Januar 2024")
  private formatMemberSince(registriertDate?: string): string {
    if (!registriertDate) return 'Neu';
    try {
      const date = new Date(registriertDate);
      const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch (e) {
      return 'Neu';
    }
  }
}
