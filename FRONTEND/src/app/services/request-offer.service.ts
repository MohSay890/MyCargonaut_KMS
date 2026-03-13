import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RequestOffer {
  id?: number;
  requestId: number;
  driverName: string;
  driverEmail: string;
  driverAvatar?: string;
  driverRating?: number;
  angebotspreis: number;
  nachricht?: string;
  fahrzeugtyp?: string;
  fahrzeugmarke?: string;
  status: string;
  erstelltAm?: string;
  beantwortetAm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RequestOfferService {
  private apiUrl = 'http://localhost:8080/api/request-offers';

  constructor(private http: HttpClient) {}

  // Neues Angebot erstellen
  createOffer(offer: RequestOffer): Observable<RequestOffer> {
    return this.http.post<RequestOffer>(this.apiUrl, offer);
  }

  // Alle Angebote für eine Anfrage laden
  getOffersByRequest(requestId: number): Observable<RequestOffer[]> {
    return this.http.get<RequestOffer[]>(`${this.apiUrl}/request/${requestId}`);
  }

  // Angebote, die auf die Anfragen eines Nutzers gesendet wurden
  getOffersReceived(userEmail: string): Observable<RequestOffer[]> {
    return this.http.get<RequestOffer[]>(`${this.apiUrl}/user/${encodeURIComponent(userEmail)}/offers-received`);
  }

  // Angebote eines Fahrers laden
  getOffersByDriver(email: string): Observable<RequestOffer[]> {
    const params = new HttpParams().set('email', email);
    return this.http.get<RequestOffer[]>(`${this.apiUrl}/driver`, { params });
  }

  // Einzelnes Angebot laden
  getOfferById(id: number): Observable<RequestOffer> {
    return this.http.get<RequestOffer>(`${this.apiUrl}/${id}`);
  }

  // Angebot akzeptieren
  acceptOffer(offerId: number, userEmail: string): Observable<any> {
    const params = new HttpParams().set('userEmail', userEmail);
    return this.http.put<any>(`${this.apiUrl}/${offerId}/accept`, null, { params });
  }

  // Angebot ablehnen
  rejectOffer(offerId: number, userEmail: string): Observable<RequestOffer> {
    const params = new HttpParams().set('userEmail', userEmail);
    return this.http.put<RequestOffer>(`${this.apiUrl}/${offerId}/reject`, null, { params });
  }

  // Angebot löschen
  deleteOffer(offerId: number, driverEmail: string): Observable<any> {
    const params = new HttpParams().set('driverEmail', driverEmail);
    return this.http.delete(`${this.apiUrl}/${offerId}`, { params });
  }
}
