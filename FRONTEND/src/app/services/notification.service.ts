import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BookingService, Booking } from './booking.service';
import { ReviewService } from './review.service';
import { MessageService } from './message.service';
import { RequestOfferService } from './request-offer.service';
import { HttpClient } from '@angular/common/http';

export interface Notification {
  id: string;
  type: 'booking' | 'booking-confirmed' | 'review' | 'payment' | 'message' | 'offer' | 'offer-status';
  title: string;
  message: string;
  timestamp: Date;
  actionUrl?: string;
  actionLabel?: string;
  relatedData?: any; // For booking requests, stores the Booking object
  isRead?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private readonly API_URL = 'http://localhost:8080/api';

  constructor(
    private bookingService: BookingService,
    private reviewService: ReviewService,
    private messageService: MessageService,
    private requestOfferService: RequestOfferService,
    private http: HttpClient
  ) {}

  /**
   * Get all notifications for a user
   * Combines pending booking requests, new reviews, and payment notifications
   */
  getUserNotifications(userEmail: string): Observable<Notification[]> {
    return forkJoin({
      bookingRequests: this.getBookingRequestNotifications(userEmail),
      bookingStatus: this.getBookingStatusNotifications(userEmail),
      messages: this.getMessageNotifications(userEmail),
      reviews: this.getReviewNotifications(userEmail),
      payments: this.getPaymentNotifications(userEmail),
      paymentsReceived: this.getPaymentReceivedNotifications(userEmail),
      newOffers: this.getNewOfferNotifications(userEmail),
      offerStatus: this.getOfferStatusNotifications(userEmail)
    }).pipe(
      map(({ bookingRequests, bookingStatus, messages, reviews, payments, paymentsReceived, newOffers, offerStatus }) => {
        // Combine all notifications
        const allNotifications = [...bookingRequests, ...bookingStatus, ...messages, ...reviews, ...payments, ...paymentsReceived, ...newOffers, ...offerStatus];

        // Sort by timestamp (newest first)
        return allNotifications.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }),
      catchError(error => {
        console.error('Error loading notifications:', error);
        return of([]);
      })
    );
  }

  /**
   * Get pending booking request notifications for trip creator
   */
  private getBookingRequestNotifications(userEmail: string): Observable<Notification[]> {
    return this.bookingService.getPendingRequestsForCreator(userEmail).pipe(
      map(bookings => {
        return bookings.map(booking => ({
          id: `booking-${booking.id}`,
          type: 'booking' as const,
          title: 'Neue Buchungsanfrage',
          message: this.formatBookingMessage(booking),
          timestamp: new Date(booking.erstelltAm),
          actionUrl: `/my-trips?openBooking=${booking.id}`,
          actionLabel: 'Anfragen ansehen',
          relatedData: booking,
          isRead: false
        }));
      }),
      catchError(error => {
        console.error('Error loading booking notifications:', error);
        return of([]);
      })
    );
  }

  /**
   * Get booking status change notifications for passenger (CONFIRMED/REJECTED)
   */
  private getBookingStatusNotifications(userEmail: string): Observable<Notification[]> {
    return this.bookingService.getBookingsByPassenger(userEmail).pipe(
      map(bookings => {
        // Filter for recently confirmed or rejected bookings (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        return bookings
          .filter(booking =>
            (booking.status === 'CONFIRMED' || booking.status === 'REJECTED') &&
            booking.bestaetigtAm &&
            new Date(booking.bestaetigtAm) > sevenDaysAgo
          )
          .map(booking => ({
            id: `booking-status-${booking.id}`,
            type: booking.status === 'CONFIRMED' ? 'booking-confirmed' as const : 'review' as const,
            title: booking.status === 'CONFIRMED' ? 'Buchung bestätigt! 🎉' : 'Buchung abgelehnt',
            message: this.formatBookingStatusMessage(booking),
            timestamp: new Date(booking.bestaetigtAm!),
            actionUrl: booking.status === 'CONFIRMED' ? `/offer/${booking.fahrt?.id}` : `/search`,
            actionLabel: booking.status === 'CONFIRMED' ? 'Zur Zahlung' : 'Andere Fahrten suchen',
            relatedData: booking,
            isRead: false
          }));
      }),
      catchError(error => {
        console.error('Error loading booking status notifications:', error);
        return of([]);
      })
    );
  }

  /**
   * Get unread message notifications
   */
  private getMessageNotifications(userEmail: string): Observable<Notification[]> {
    return this.messageService.getUnreadMessages(userEmail).pipe(
      map(messages => {
        return messages.map(message => ({
          id: `message-${message.id}`,
          type: 'message' as const,
          title: 'Neue Nachricht',
          message: `${message.sender.vorname} ${message.sender.nachname}: ${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}`,
          timestamp: new Date(message.erstelltAm),
          actionUrl: `/messages`,
          actionLabel: 'Nachrichten öffnen',
          relatedData: message,
          isRead: false
        }));
      }),
      catchError(error => {
        console.error('Error loading message notifications:', error);
        return of([]);
      })
    );
  }

  /**
   * Get recent review notifications
   */
  private getReviewNotifications(userEmail: string): Observable<Notification[]> {
    return this.reviewService.getReviewsForUser(userEmail).pipe(
      map(reviews => {
        // Get only recent reviews (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        return reviews
          .filter(review => new Date(review.createdAt) > sevenDaysAgo)
          .map(review => ({
            id: `review-${review.id}`,
            type: 'review' as const,
            title: 'Neue Bewertung',
            message: `${review.bewerterName} hat dich bewertet`,
            timestamp: new Date(review.createdAt),
            actionUrl: `/reviews/me`,
            actionLabel: 'Bewertungen ansehen',
            relatedData: review,
            isRead: false
          }));
      }),
      catchError(error => {
        console.error('Error loading review notifications:', error);
        return of([]);
      })
    );
  }

  /**
   * Get recent payment notifications
   */
  private getPaymentNotifications(userEmail: string): Observable<Notification[]> {
    return this.http.get<any[]>(`${this.API_URL}/payments/history?email=${encodeURIComponent(userEmail)}`).pipe(
      map(payments => {
        // Get only successful payments from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        return payments
          .filter(payment =>
            payment.status === 'COMPLETED' &&
            new Date(payment.paymentDate) > sevenDaysAgo
          )
          .map(payment => ({
            id: `payment-${payment.id}`,
            type: 'payment' as const,
            title: 'Zahlung abgeschlossen',
            message: `${payment.amount.toFixed(2)} € für ${payment.route}`,
            timestamp: new Date(payment.paymentDate),
            actionUrl: `/payments`,
            actionLabel: 'Zahlungen ansehen',
            relatedData: payment,
            isRead: false
          }));
      }),
      catchError(error => {
        console.error('Error loading payment notifications:', error);
        return of([]);
      })
    );
  }

  /**
   * Get payment received notifications (for trip creators/drivers)
   * Shows when passengers pay for their trips
   */
  private getPaymentReceivedNotifications(userEmail: string): Observable<Notification[]> {
    // Get all trips created by this user
    return this.http.get<any[]>(`${this.API_URL}/fahrten?creatorEmail=${encodeURIComponent(userEmail)}`).pipe(
      map(trips => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const notifications: Notification[] = [];

        // For each trip, check for confirmed bookings with payments
        trips.forEach(trip => {
          // Get payments for this trip (you'll need to implement this endpoint)
          // For now, we'll use confirmed bookings as proxy
          if (trip.buchungen && Array.isArray(trip.buchungen)) {
            trip.buchungen
              .filter((booking: any) =>
                booking.status === 'CONFIRMED' &&
                booking.isPaid === true &&
                booking.bestaetigtAm &&
                new Date(booking.bestaetigtAm) > sevenDaysAgo
              )
              .forEach((booking: any) => {
                const passengerName = booking.mitfahrer?.vorname && booking.mitfahrer?.nachname
                  ? `${booking.mitfahrer.vorname} ${booking.mitfahrer.nachname}`
                  : 'Ein Fahrgast';

                notifications.push({
                  id: `payment-received-${booking.id}`,
                  type: 'payment' as const,
                  title: 'Zahlung eingegangen 💶',
                  message: `${passengerName} hat für die Fahrt ${trip.startOrt} → ${trip.zielOrt} bezahlt`,
                  timestamp: new Date(booking.bestaetigtAm),
                  actionUrl: `/payments`,
                  actionLabel: 'Zahlungen ansehen',
                  relatedData: { booking, trip },
                  isRead: false
                });
              });
          }
        });

        return notifications;
      }),
      catchError(error => {
        console.error('Error loading payment received notifications:', error);
        return of([]);
      })
    );
  }

  /**
   * Get count of unread notifications
   */
  getUnreadCount(userEmail: string): Observable<number> {
    return this.getUserNotifications(userEmail).pipe(
      map(notifications => notifications.filter(n => !n.isRead).length)
    );
  }

  /**
   * Get count of pending booking requests
   */
  getPendingBookingRequestsCount(userEmail: string): Observable<number> {
    return this.bookingService.getPendingRequestsForCreator(userEmail).pipe(
      map(bookings => bookings.length),
      catchError(error => {
        console.error('Error counting pending requests:', error);
        return of(0);
      })
    );
  }


  /**
   * Get new offer notifications for my requests
   */
  private getNewOfferNotifications(userEmail: string): Observable<Notification[]> {
    return this.requestOfferService.getOffersReceived(userEmail).pipe(
      map(offers => {
        return offers
          .filter(offer => offer.status === 'PENDING')
          .map(offer => ({
            id: 'new-offer-' + offer.id,
            type: 'offer' as const,
            title: 'Neues Angebot',
            message: `${offer.driverName} hat dir ein Angebot gemacht`,
            timestamp: offer.erstelltAm ? new Date(offer.erstelltAm) : new Date(),
            actionUrl: '/my-requests',
            actionLabel: 'Angebot ansehen',
            relatedData: offer,
            isRead: false
          }));
      }),
      catchError(error => {
        console.error('Error loading offer notifications:', error);
        return of([]);
      })
    );
  }

  /**
   * Get status notifications for my submitted offers
   */
  private getOfferStatusNotifications(userEmail: string): Observable<Notification[]> {
    return this.requestOfferService.getOffersByDriver(userEmail).pipe(
      map(offers => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        return offers
          .filter(offer =>
            (offer.status === 'ACCEPTED' || offer.status === 'REJECTED') &&
            offer.beantwortetAm &&
            new Date(offer.beantwortetAm) > sevenDaysAgo
          )
          .map(offer => ({
            id: 'offer-status-' + offer.id,
            type: 'offer-status' as const,
            title: offer.status === 'ACCEPTED' ? 'Dein Angebot wurde akzeptiert! 🎉' : 'Angebot abgelehnt',
            message: offer.status === 'ACCEPTED' ? 'Der Nutzer hat dein Angebot für die Anfrage angenommen.' : 'Dein Angebot wurde leider abgelehnt.',
            timestamp: new Date(offer.beantwortetAm!),
            actionUrl: offer.status === 'ACCEPTED' ? '/my-trips' : '/search',
            actionLabel: offer.status === 'ACCEPTED' ? 'Zu meinen Fahrten' : 'Andere Anfragen suchen',
            relatedData: offer,
            isRead: false
          }));
      }),
      catchError(error => {
        console.error('Error loading offer status notifications:', error);
        return of([]);
      })
    );
  }

  /**
   * Format booking message
   */
  private formatBookingMessage(booking: Booking): string {
    const passengerName = booking.mitfahrer?.vorname || 'Ein Nutzer';
    const route = booking.fahrt?.startort && booking.fahrt?.zielort
      ? `${booking.fahrt.startort} → ${booking.fahrt.zielort}`
      : 'deine Fahrt';

    const seatsText = booking.anzahlPlaetze > 1
      ? `${booking.anzahlPlaetze} Plätze`
      : '1 Platz';

    return `${passengerName} möchte ${seatsText} für ${route} buchen`;
  }

  /**
   * Format booking status message
   */
  private formatBookingStatusMessage(booking: Booking): string {
    const route = booking.fahrt?.startort && booking.fahrt?.zielort
      ? `${booking.fahrt.startort} → ${booking.fahrt.zielort}`
      : 'deine Fahrt';

    if (booking.status === 'CONFIRMED') {
      return `Deine Buchung für ${route} wurde bestätigt!`;
    } else {
      return `Deine Buchung für ${route} wurde leider abgelehnt`;
    }
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Gerade eben';
    } else if (diffMinutes < 60) {
      return `vor ${diffMinutes} ${diffMinutes === 1 ? 'Minute' : 'Minuten'}`;
    } else if (diffHours < 24) {
      return `vor ${diffHours} ${diffHours === 1 ? 'Stunde' : 'Stunden'}`;
    } else if (diffDays < 7) {
      return `vor ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tagen'}`;
    } else {
      return date.toLocaleDateString('de-DE');
    }
  }

  /**
   * Get notification icon
   */
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'booking': return '📩';
      case 'review': return '⭐';
      case 'payment': return '💶';
      case 'message': return '💬';
      case 'offer': return '📦';
      case 'offer-status': return '📋';
      default: return '📢';
    }
  }
}
