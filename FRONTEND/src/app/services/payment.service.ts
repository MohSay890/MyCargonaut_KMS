import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, delay, map, switchMap, catchError } from 'rxjs';

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
  cardNumber?: string; // Last 4 digits only
  cardBrand?: 'visa' | 'mastercard' | 'amex';
  cardHolder?: string;
  expiryDate?: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface PaymentTransaction {
  id: string;
  offerId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentMethod: PaymentMethod;
  description: string;
  route: string;
  driverName: string;
  createdAt: Date;
  completedAt?: Date;
  refundedAt?: Date;
  errorMessage?: string;
}

export interface PaymentRequest {
  offerId: string;
  amount: number;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  saveCard: boolean;
  route: string;
  driverName: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  message: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly STORAGE_KEY_METHODS = 'mycargonaut_payment_methods';
  private readonly STORAGE_KEY_TRANSACTIONS = 'mycargonaut_transactions';
  private readonly API_URL = 'http://localhost:8080/api/payments';

  private paymentMethodsSubject = new BehaviorSubject<PaymentMethod[]>([]);
  private transactionsSubject = new BehaviorSubject<PaymentTransaction[]>([]);

  public paymentMethods$ = this.paymentMethodsSubject.asObservable();
  public transactions$ = this.transactionsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const methodsJson = localStorage.getItem(this.STORAGE_KEY_METHODS);
      const transactionsJson = localStorage.getItem(this.STORAGE_KEY_TRANSACTIONS);

      if (methodsJson) {
        const methods = JSON.parse(methodsJson);
        this.paymentMethodsSubject.next(methods);
      }

      if (transactionsJson) {
        const transactions = JSON.parse(transactionsJson).map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
          refundedAt: t.refundedAt ? new Date(t.refundedAt) : undefined
        }));
        this.transactionsSubject.next(transactions);
      }
    } catch (error) {
      console.error('Error loading payment data from storage:', error);
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY_METHODS, JSON.stringify(this.paymentMethodsSubject.value));
    localStorage.setItem(this.STORAGE_KEY_TRANSACTIONS, JSON.stringify(this.transactionsSubject.value));
  }

  /**
   * Validate credit card number using Luhn algorithm
   */
  validateCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) return false;

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Detect card brand from number
   */
  detectCardBrand(cardNumber: string): 'visa' | 'mastercard' | 'amex' | undefined {
    const cleaned = cardNumber.replace(/\s/g, '');

    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';

    return undefined;
  }

  /**
   * Validate expiry date
   */
  validateExpiryDate(expiryDate: string): boolean {
    const match = expiryDate.match(/^(\d{2})\/(\d{2})$/);
    if (!match) return false;

    const month = parseInt(match[1], 10);
    const year = parseInt('20' + match[2], 10);

    if (month < 1 || month > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return true;
  }

  /**
   * Validate CVV
   */
  validateCVV(cvv: string, cardBrand?: string): boolean {
    if (cardBrand === 'amex') {
      return /^\d{4}$/.test(cvv);
    }
    return /^\d{3}$/.test(cvv);
  }

  /**
   * Format card number for display (mask all but last 4 digits)
   */
  formatCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    return '**** **** **** ' + cleaned.slice(-4);
  }

  /**
   * Get masked card number (last 4 digits)
   */
  getLastFourDigits(cardNumber: string): string {
    return cardNumber.replace(/\s/g, '').slice(-4);
  }

  /**
   * Process a payment (calls backend API)
   */
  processPayment(request: PaymentRequest): Observable<PaymentResult> {
    // Validate inputs
    if (!this.validateCardNumber(request.cardNumber)) {
      return of({ success: false, message: 'Ungültige Kartennummer', error: 'INVALID_CARD' });
    }

    if (!this.validateExpiryDate(request.expiryDate)) {
      return of({ success: false, message: 'Ungültiges Ablaufdatum', error: 'INVALID_EXPIRY' });
    }

    const cardBrand = this.detectCardBrand(request.cardNumber);
    if (!this.validateCVV(request.cvv, cardBrand)) {
      return of({ success: false, message: 'Ungültige Prüfziffer', error: 'INVALID_CVV' });
    }

    // Get current user
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      return of({ success: false, message: 'Benutzer nicht angemeldet', error: 'NOT_AUTHENTICATED' });
    }

    const currentUser = JSON.parse(userStr);
    if (!currentUser.id || !currentUser.email) {
      return of({ success: false, message: 'Ungültige Benutzerdaten', error: 'INVALID_USER' });
    }

    // Simulate payment processing with delay, then call backend
    return of(null).pipe(
      delay(2000), // Simulate 2 second processing time
      switchMap(() => {
        // Simulate 95% success rate for demo
        const isSuccess = Math.random() > 0.05;

        if (!isSuccess) {
          return of({
            success: false,
            message: 'Zahlung fehlgeschlagen. Bitte überprüfe deine Kartendetails.',
            error: 'PAYMENT_DECLINED'
          });
        }

        // Create payment in backend
        const backendPayload = {
          fahrtId: parseInt(request.offerId),
          payerId: currentUser.id,
          amount: request.amount,
          currency: 'EUR',
          paymentMethod: 'CREDIT_CARD'
        };

        return this.http.post<any>(`${this.API_URL}`, backendPayload).pipe(
          switchMap((createdPayment) => {
            // Process the payment to mark it as completed
            return this.http.post<any>(`${this.API_URL}/${createdPayment.id}/process`, {}).pipe(
              map((processedPayment) => {
                const transactionId = processedPayment.transactionReference || `TXN-${Date.now()}`;

                // Create local transaction record for immediate UI update
                const transaction: PaymentTransaction = {
                  id: transactionId,
                  offerId: request.offerId,
                  userId: currentUser.email,
                  amount: request.amount,
                  currency: 'EUR',
                  status: 'completed',
                  paymentMethod: {
                    id: this.generateId(),
                    type: 'credit_card',
                    cardNumber: this.getLastFourDigits(request.cardNumber),
                    cardBrand: cardBrand,
                    cardHolder: request.cardHolder,
                    expiryDate: request.expiryDate,
                    isDefault: false,
                    createdAt: new Date()
                  },
                  description: `Buchung: ${request.route}`,
                  route: request.route,
                  driverName: request.driverName,
                  createdAt: new Date(),
                  completedAt: new Date()
                };

                // Save transaction locally
                const transactions = [...this.transactionsSubject.value, transaction];
                this.transactionsSubject.next(transactions);

                // Save card if requested
                if (request.saveCard) {
                  this.savePaymentMethod({
                    id: this.generateId(),
                    type: 'credit_card',
                    cardNumber: this.getLastFourDigits(request.cardNumber),
                    cardBrand: cardBrand,
                    cardHolder: request.cardHolder,
                    expiryDate: request.expiryDate,
                    isDefault: this.paymentMethodsSubject.value.length === 0,
                    createdAt: new Date()
                  });
                }

                this.saveToStorage();

                return {
                  success: true,
                  transactionId,
                  message: 'Zahlung erfolgreich! Die Buchung wurde bestätigt.'
                };
              }),
              catchError((error) => {
                console.error('Error processing payment:', error);
                return of({
                  success: false,
                  message: 'Fehler beim Verarbeiten der Zahlung',
                  error: 'PROCESSING_ERROR'
                });
              })
            );
          }),
          catchError((error) => {
            console.error('Error creating payment:', error);
            return of({
              success: false,
              message: 'Fehler beim Erstellen der Zahlung',
              error: 'CREATION_ERROR'
            });
          })
        );
      })
    );
  }

  /**
   * Save a payment method
   */
  savePaymentMethod(method: PaymentMethod): void {
    const methods = [...this.paymentMethodsSubject.value];

    // If setting as default, unset others
    if (method.isDefault) {
      methods.forEach(m => m.isDefault = false);
    }

    methods.push(method);
    this.paymentMethodsSubject.next(methods);
    this.saveToStorage();
  }

  /**
   * Remove a payment method
   */
  removePaymentMethod(id: string): void {
    const methods = this.paymentMethodsSubject.value.filter(m => m.id !== id);
    this.paymentMethodsSubject.next(methods);
    this.saveToStorage();
  }

  isOfferPaid(offerId: string): boolean {
    return this.transactionsSubject.value.some(
      t => t.offerId === offerId &&
           (t.status === 'completed' || t.status === 'processing')
    );
  }

  /**
   * Check if user has already paid for an offer
   */
  hasUserPaidForOffer(offerId: string, userId?: string): boolean {
    const currentUserId = userId || this.getCurrentUserId();
    return this.transactionsSubject.value.some(
      t => t.offerId === offerId &&
           t.userId === currentUserId &&
           (t.status === 'completed' || t.status === 'processing')
    );
  }

  /**
   * Set default payment method
   */
  setDefaultPaymentMethod(id: string): void {
    const methods = this.paymentMethodsSubject.value.map(m => ({
      ...m,
      isDefault: m.id === id
    }));
    this.paymentMethodsSubject.next(methods);
    this.saveToStorage();
  }

  /**
   * Get all transactions for current user
   */
  getMyTransactions(): Observable<PaymentTransaction[]> {
    const userId = this.getCurrentUserId();
    return this.transactions$.pipe(
      map(transactions => transactions.filter(t => t.userId === userId))
    );
  }

  /**
   * Get transaction by ID
   */
  getTransactionById(id: string): PaymentTransaction | undefined {
    return this.transactionsSubject.value.find(t => t.id === id);
  }

  /**
   * Request refund (dummy)
   */
  requestRefund(transactionId: string): Observable<PaymentResult> {
    return of(null).pipe(
      delay(1500),
      map(() => {
        const transactions = this.transactionsSubject.value.map(t => {
          if (t.id === transactionId && t.status === 'completed') {
            return { ...t, status: 'refunded' as const, refundedAt: new Date() };
          }
          return t;
        });

        this.transactionsSubject.next(transactions);
        this.saveToStorage();

        return {
          success: true,
          transactionId,
          message: 'Rückerstattung wurde angefragt und wird in 3-5 Werktagen bearbeitet.'
        };
      })
    );
  }

  /**
   * Get saved payment methods for current user
   */
  getSavedPaymentMethods(): PaymentMethod[] {
    return this.paymentMethodsSubject.value;
  }

  /**
   * Get default payment method
   */
  getDefaultPaymentMethod(): PaymentMethod | undefined {
    return this.paymentMethodsSubject.value.find(m => m.isDefault);
  }

  private getCurrentUserId(): string {
    try {
      const userJson = localStorage.getItem('mycargonaut_user');
      if (userJson) {
        const user = JSON.parse(userJson);
        return user.email || 'anonymous';
      }
    } catch (e) {}
    return 'anonymous';
  }

  private generateId(): string {
    return 'pm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateTransactionId(): string {
    return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
}
