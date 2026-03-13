import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface TransportRequest {
  id: string;
  startOrt: string;
  zielOrt: string;
  datum: string;
  uhrzeit?: string;
  beschreibung?: string;
  abmessungen?: string;
  gewicht?: number;
  kategorie?: string;
  maxPreis: number;
  abholadresse?: string;
  lieferadresse?: string;
  extras?: string;
  erstellerName?: string;
  erstellerEmail?: string;
  erstellerAvatar?: string;
  entfernung?: string;
  dauer?: string;
  erstelltAm?: string;
  status?: string;
  fahrtId?: number;
}

export interface PriceBreakdown {
  basePrice: number;
  weightCost: number;
  distanceCost: number;
  subtotal: number;
  categoryMultiplier: number;
  totalPrice: number;
  category: string;
}

export interface PriceCalculationRequest {
  gewicht: number;
  entfernung: string;
  kategorie: string;
}

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  private apiUrl = 'http://localhost:8080/api/requests';

  constructor(private http: HttpClient) {}

  /**
   * Search transport requests
   */
  searchRequests(
    start: string,
    ziel: string,
    datum?: string,
    maxPreis?: number,
    kategorie?: string
  ): Observable<TransportRequest[]> {
    let params = new HttpParams()
      .set('start', start)
      .set('ziel', ziel);

    if (datum) params = params.set('datum', datum);
    if (maxPreis) params = params.set('maxPreis', maxPreis.toString());
    if (kategorie) params = params.set('kategorie', kategorie);

    return this.http.get<TransportRequest[]>(`${this.apiUrl}/suche`, { params }).pipe(
      catchError(error => {
        console.error('Error searching requests:', error);
        return of([]);
      })
    );
  }

  /**
   * Get my transport requests
   */
  getMyRequests(email: string): Observable<TransportRequest[]> {
    const params = new HttpParams().set('email', email);
    return this.http.get<TransportRequest[]>(`${this.apiUrl}/meine`, { params }).pipe(
      catchError(error => {
        console.error('Error loading my requests:', error);
        return of([]);
      })
    );
  }

  /**
   * Get request by ID
   */
  getRequestById(id: string): Observable<TransportRequest | null> {
    return this.http.get<TransportRequest>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error loading request:', error);
        return of(null);
      })
    );
  }

  /**
   * Create new transport request
   */
  createRequest(request: TransportRequest): Observable<TransportRequest> {
    return this.http.post<TransportRequest>(this.apiUrl, request);
  }

  /**
   * Update transport request
   */
  updateRequest(id: string, request: TransportRequest): Observable<TransportRequest> {
    return this.http.put<TransportRequest>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Delete transport request
   */
  deleteRequest(id: string, userEmail: string): Observable<boolean> {
    const params = new HttpParams().set('userEmail', userEmail);
    return this.http.delete(`${this.apiUrl}/${id}/authorized`, { params }).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error deleting request:', error);
        return of(false);
      })
    );
  }

  /**
   * Get all active requests
   */
  getAllRequests(): Observable<TransportRequest[]> {
    return this.http.get<TransportRequest[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error loading requests:', error);
        return of([]);
      })
    );
  }

  /**
   * Calculate price for transport request
   */
  calculatePrice(request: PriceCalculationRequest): Observable<PriceBreakdown> {
    return this.http.post<PriceBreakdown>(`${this.apiUrl}/calculate-price`, request).pipe(
      catchError(error => {
        console.error('Error calculating price:', error);
        return of({
          basePrice: 25,
          weightCost: 0,
          distanceCost: 0,
          subtotal: 25,
          categoryMultiplier: 1,
          totalPrice: 25,
          category: request.kategorie
        });
      })
    );
  }
}
