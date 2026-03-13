import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Booking {
  id: number;
  fahrt: any; // Trip details
  mitfahrer: any; // Passenger details
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  erstelltAm: string; // ISO timestamp
  bestaetigtAm?: string; // ISO timestamp
  nachricht?: string; // Message from passenger
  anzahlPlaetze: number; // Number of seats
  isPaid?: boolean; // Payment status
}

export interface BookingRequest {
  fahrtId: number;
  passengerEmail: string;
  nachricht?: string;
  anzahlPlaetze?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private readonly API_URL = 'http://localhost:8080/api/buchungen';

  constructor(private http: HttpClient) {}

  /**
   * Create a booking request (PENDING status)
   */
  createBookingRequest(request: BookingRequest): Observable<Booking> {
    return this.http.post<Booking>(`${this.API_URL}/request`, request).pipe(
      catchError(error => {
        console.error('Error creating booking request:', error);
        throw error;
      })
    );
  }

  /**
   * Confirm a booking request (trip creator approves)
   */
  confirmBooking(bookingId: number, creatorEmail: string): Observable<Booking> {
    const params = new HttpParams().set('creatorEmail', creatorEmail);
    return this.http.post<Booking>(`${this.API_URL}/${bookingId}/confirm`, null, { params }).pipe(
      catchError(error => {
        console.error('Error confirming booking:', error);
        throw error;
      })
    );
  }

  /**
   * Reject a booking request (trip creator declines)
   */
  rejectBooking(bookingId: number, creatorEmail: string): Observable<Booking> {
    const params = new HttpParams().set('creatorEmail', creatorEmail);
    return this.http.post<Booking>(`${this.API_URL}/${bookingId}/reject`, null, { params }).pipe(
      catchError(error => {
        console.error('Error rejecting booking:', error);
        throw error;
      })
    );
  }

  /**
   * Cancel a confirmed booking
   */
  cancelBooking(bookingId: number, userEmail: string): Observable<Booking> {
    const params = new HttpParams().set('userEmail', userEmail);
    return this.http.post<Booking>(`${this.API_URL}/${bookingId}/cancel`, null, { params }).pipe(
      catchError(error => {
        console.error('Error cancelling booking:', error);
        throw error;
      })
    );
  }

  /**
   * Get all pending booking requests for a trip creator
   */
  getPendingRequestsForCreator(creatorEmail: string): Observable<Booking[]> {
    const params = new HttpParams().set('creatorEmail', creatorEmail);
    return this.http.get<Booking[]>(`${this.API_URL}/pending`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching pending requests:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all confirmed bookings for a trip creator
   */
  getConfirmedBookingsForCreator(creatorEmail: string): Observable<Booking[]> {
    const params = new HttpParams().set('creatorEmail', creatorEmail);
    return this.http.get<Booking[]>(`${this.API_URL}/creator/confirmed`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching confirmed bookings:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all bookings for a specific trip
   */
  getBookingsForTrip(fahrtId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API_URL}/trip/${fahrtId}`).pipe(
      catchError(error => {
        console.error('Error fetching trip bookings:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all bookings made by a user (as passenger)
   */
  getBookingsByPassenger(email: string): Observable<Booking[]> {
    const params = new HttpParams().set('email', email);
    return this.http.get<Booking[]>(`${this.API_URL}/passenger`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching passenger bookings:', error);
        return of([]);
      })
    );
  }

  /**
   * Get confirmed bookings by passenger
   */
  getConfirmedBookingsByPassenger(email: string): Observable<Booking[]> {
    const params = new HttpParams().set('email', email);
    return this.http.get<Booking[]>(`${this.API_URL}/passenger/confirmed`, { params }).pipe(
      catchError(error => {
        console.error('Error fetching confirmed bookings:', error);
        return of([]);
      })
    );
  }

  /**
   * Get booking by ID
   */
  getBookingById(bookingId: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.API_URL}/${bookingId}`).pipe(
      catchError(error => {
        console.error('Error fetching booking:', error);
        throw error;
      })
    );
  }

  /**
   * Count pending requests for a trip
   */
  countPendingRequestsForTrip(fahrtId: number): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/trip/${fahrtId}/pending-count`).pipe(
      catchError(error => {
        console.error('Error counting pending requests:', error);
        return of(0);
      })
    );
  }

  /**
   * Helper: Format booking status for display
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'Ausstehend';
      case 'CONFIRMED': return 'Bestätigt';
      case 'REJECTED': return 'Abgelehnt';
      case 'CANCELLED': return 'Storniert';
      default: return status;
    }
  }

  /**
   * Helper: Get status badge color class
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-warning';
      case 'CONFIRMED': return 'badge-success';
      case 'REJECTED': return 'badge-danger';
      case 'CANCELLED': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }
}
