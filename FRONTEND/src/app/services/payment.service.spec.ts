import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentService, PaymentMethod, PaymentTransaction, PaymentRequest, PaymentResult } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    // 1. WICHTIG: LocalStorage MUSS gesetzt werden, BEVOR der Service injiziert wird
    localStorage.clear();
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      vorname: 'Max',
      nachname: 'Mustermann'
    };
    localStorage.setItem('currentUser', JSON.stringify(mockUser));

    // 2. Jetzt erst das Modul konfigurieren
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaymentService]
    });

    // 3. Service injizieren (liest jetzt den User korrekt aus dem LocalStorage)
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateCardNumber', () => {
    it('should validate correct credit card numbers', () => {
      expect(service.validateCardNumber('4532015112830366')).toBe(true);
      expect(service.validateCardNumber('5425233430109903')).toBe(true);
    });

    it('should reject invalid credit card numbers', () => {
      expect(service.validateCardNumber('1234567890123456')).toBe(false);
    });

    it('should reject non-numeric card numbers', () => {
      expect(service.validateCardNumber('abcd-efgh-ijkl')).toBe(false);
      expect(service.validateCardNumber('')).toBe(false);
    });
  });

  describe('detectCardBrand', () => {
    it('should identify Visa cards', () => {
      expect(service.detectCardBrand('4532015112830366')).toBe('visa');
    });

    it('should identify MasterCard cards', () => {
      expect(service.detectCardBrand('5425233430109903')).toBe('mastercard');
    });

    it('should identify American Express cards', () => {
      expect(service.detectCardBrand('378282246310005')).toBe('amex');
    });

    it('should return undefined for unknown cards', () => {
      expect(service.detectCardBrand('1234567890123456')).toBeUndefined();
    });
  });

  describe('formatCardNumber', () => {
    it('should mask card number showing only last 4 digits', () => {
      expect(service.formatCardNumber('4532015112830366')).toBe('**** **** **** 0366');
    });

    it('should handle short card numbers', () => {
      expect(service.formatCardNumber('1234')).toBe('**** **** **** 1234');
    });
  });

  describe('getLastFourDigits', () => {
    it('should return last 4 digits', () => {
      expect(service.getLastFourDigits('1234567890123456')).toBe('3456');
    });

    it('should handle card numbers with spaces', () => {
      expect(service.getLastFourDigits('1234 5678 9012 3456')).toBe('3456');
    });

    it('should handle short card numbers', () => {
      expect(service.getLastFourDigits('1234')).toBe('1234');
    });
  });

  describe('validateExpiryDate', () => {
    it('should validate correct expiry dates', () => {
      const today = new Date();
      const futureYear = (today.getFullYear() + 2) % 100;
      const futureDate = `12/${futureYear.toString().padStart(2, '0')}`;
      expect(service.validateExpiryDate(futureDate)).toBe(true);
      expect(service.validateExpiryDate('12/99')).toBe(true);
    });

    it('should reject invalid expiry dates', () => {
      expect(service.validateExpiryDate('13/25')).toBe(false);
      expect(service.validateExpiryDate('00/25')).toBe(false);
      // Da wir 2026 haben, ist 12/20 (Vergangenheit) korrekt als false markiert
      expect(service.validateExpiryDate('12/20')).toBe(false);
    });

    it('should reject incorrectly formatted dates', () => {
      expect(service.validateExpiryDate('1/25')).toBe(false);
      expect(service.validateExpiryDate('12/2025')).toBe(false);
      expect(service.validateExpiryDate('abc')).toBe(false);
    });
  });

  describe('validateCVV', () => {
    it('should validate 3-digit CVV for Visa/MasterCard', () => {
      expect(service.validateCVV('123', 'visa')).toBe(true);
      expect(service.validateCVV('456', 'mastercard')).toBe(true);
    });

    it('should validate 4-digit CVV for Amex', () => {
      expect(service.validateCVV('1234', 'amex')).toBe(true);
    });

    it('should reject invalid CVVs', () => {
      expect(service.validateCVV('12', 'visa')).toBe(false);
      expect(service.validateCVV('1234', 'visa')).toBe(false);
      expect(service.validateCVV('123', 'amex')).toBe(false);
      expect(service.validateCVV('abc', 'visa')).toBe(false);
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', (done) => {
      const paymentRequest: PaymentRequest = {
        offerId: '123',
        amount: 50.00,
        cardNumber: '4532015112830366',
        cardHolder: 'Max Mustermann',
        expiryDate: '12/30', // In der Zukunft
        cvv: '123',
        saveCard: true,
        route: 'Berlin → Munich',
        driverName: 'Hans Mueller'
      };

      service.processPayment(paymentRequest).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.transactionId).toBeTruthy();
        expect(result.message).toContain('Zahlung erfolgreich');
        done();
      });

      setTimeout(() => {
        const createReq = httpMock.expectOne('http://localhost:8080/api/payments');
        expect(createReq.request.method).toBe('POST');
        createReq.flush({ id: 1, status: 'PENDING' });

        const processReq = httpMock.expectOne('http://localhost:8080/api/payments/1/process');
        expect(processReq.request.method).toBe('POST');
        processReq.flush({ id: 1, status: 'COMPLETED', transactionReference: 'TXN-123' });
      }, 2100);
    });

    it('should handle payment failure for invalid card', (done) => {
      const paymentRequest: PaymentRequest = {
        offerId: '123',
        amount: 50.00,
        cardNumber: '1234567890123456',
        cardHolder: 'Max Mustermann',
        expiryDate: '12/30',
        cvv: '123',
        saveCard: false,
        route: 'Berlin → Munich',
        driverName: 'Hans Mueller'
      };

      service.processPayment(paymentRequest).subscribe(result => {
        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
        done();
      });
    });

    it('should save card when requested', (done) => {
      const paymentRequest: PaymentRequest = {
        offerId: '123',
        amount: 50.00,
        cardNumber: '4532015112830366',
        cardHolder: 'Max Mustermann',
        expiryDate: '12/30',
        cvv: '123',
        saveCard: true,
        route: 'Berlin → Munich',
        driverName: 'Hans Mueller'
      };

      service.processPayment(paymentRequest).subscribe(() => {
        service.paymentMethods$.subscribe(methods => {
          expect(methods.length).toBeGreaterThan(0);
          expect(methods[0].cardNumber).toBe('0366');
          done();
        });
      });

      setTimeout(() => {
        const createReq = httpMock.expectOne('http://localhost:8080/api/payments');
        createReq.flush({ id: 1, status: 'PENDING' });

        const processReq = httpMock.expectOne('http://localhost:8080/api/payments/1/process');
        processReq.flush({ id: 1, status: 'COMPLETED', transactionReference: 'TXN-123' });
      }, 2100);
    });
  });

  describe('savePaymentMethod', () => {
    it('should save a new payment method', () => {
      const method: PaymentMethod = {
        id: '1',
        type: 'credit_card',
        cardNumber: '0366',
        cardBrand: 'visa',
        cardHolder: 'Max Mustermann',
        expiryDate: '12/30', // GEÄNDERT auf 30
        isDefault: true,
        createdAt: new Date()
      };

      service.savePaymentMethod(method);

      service.paymentMethods$.subscribe(methods => {
        expect(methods.length).toBe(1);
        expect(methods[0].cardNumber).toBe('0366');
        expect(methods[0].cardHolder).toBe('Max Mustermann');
        expect(methods[0].cardBrand).toBe('visa');
      });
    });

    it('should mark first method as default', () => {
      const method: PaymentMethod = {
        id: '1',
        type: 'credit_card',
        cardNumber: '0366',
        cardHolder: 'Max Mustermann',
        expiryDate: '12/30', // GEÄNDERT auf 30
        isDefault: true,
        createdAt: new Date()
      };

      service.savePaymentMethod(method);

      service.paymentMethods$.subscribe(methods => {
        expect(methods[0].isDefault).toBe(true);
      });
    });
  });

  describe('removePaymentMethod', () => {
    it('should remove a payment method', () => {
      const method: PaymentMethod = {
        id: '1',
        type: 'credit_card',
        cardNumber: '0366',
        cardHolder: 'Max Mustermann',
        expiryDate: '12/30', // GEÄNDERT auf 30
        isDefault: true,
        createdAt: new Date()
      };

      service.savePaymentMethod(method);
      service.removePaymentMethod(method.id);

      service.paymentMethods$.subscribe(methods => {
        expect(methods.length).toBe(0);
      });
    });
  });

  describe('setDefaultPaymentMethod', () => {
    it('should set a payment method as default', () => {
      const method1: PaymentMethod = {
        id: '1',
        type: 'credit_card',
        cardNumber: '0366',
        cardHolder: 'Max Mustermann',
        expiryDate: '12/30', // GEÄNDERT auf 30
        isDefault: true,
        createdAt: new Date()
      };

      const method2: PaymentMethod = {
        id: '2',
        type: 'credit_card',
        cardNumber: '9903',
        cardHolder: 'John Doe',
        expiryDate: '06/30', // GEÄNDERT auf 30
        isDefault: false,
        createdAt: new Date()
      };

      service.savePaymentMethod(method1);
      service.savePaymentMethod(method2);
      service.setDefaultPaymentMethod(method2.id);

      service.paymentMethods$.subscribe(methods => {
        expect(methods.find(m => m.id === method1.id)?.isDefault).toBe(false);
        expect(methods.find(m => m.id === method2.id)?.isDefault).toBe(true);
      });
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history', () => {
      service.transactions$.subscribe(transactions => {
        expect(Array.isArray(transactions)).toBe(true);
      });
    });
  });
});
