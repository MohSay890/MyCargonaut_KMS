import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PaymentService, PaymentMethod, PaymentTransaction, PaymentRequest, PaymentResult } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaymentService]
    });
    service = TestBed.inject(PaymentService);
    localStorage.clear();
  });

  afterEach(() => {
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
      expect(service.validateExpiryDate('12/25')).toBe(true);
      expect(service.validateExpiryDate('06/30')).toBe(true);
    });

    it('should reject invalid expiry dates', () => {
      expect(service.validateExpiryDate('13/25')).toBe(false);
      expect(service.validateExpiryDate('00/25')).toBe(false);
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
        expiryDate: '12/25',
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
    });

    it('should handle payment failure for invalid card', (done) => {
      const paymentRequest: PaymentRequest = {
        offerId: '123',
        amount: 50.00,
        cardNumber: '1234567890123456',
        cardHolder: 'Max Mustermann',
        expiryDate: '12/25',
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
        expiryDate: '12/25',
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
        expiryDate: '12/25',
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
        expiryDate: '12/25',
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
        expiryDate: '12/25',
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
        expiryDate: '12/25',
        isDefault: true,
        createdAt: new Date()
      };

      const method2: PaymentMethod = {
        id: '2',
        type: 'credit_card',
        cardNumber: '9903',
        cardHolder: 'John Doe',
        expiryDate: '06/26',
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
