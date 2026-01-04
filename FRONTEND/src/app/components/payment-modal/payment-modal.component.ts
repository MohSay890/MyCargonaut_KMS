import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentService, PaymentRequest, PaymentResult } from '../../services/payment.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.css']
})
export class PaymentModalComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() amount: number = 0;
  @Input() offerId: string = '';
  @Input() route: string = '';
  @Input() driverName: string = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() paymentSuccess = new EventEmitter<PaymentResult>();
  @Output() paymentError = new EventEmitter<PaymentResult>();

  paymentForm!: FormGroup;
  isProcessing: boolean = false;
  cardBrand: 'visa' | 'mastercard' | 'amex' | undefined;
  formattedCardNumber: string = '';
  errorMessage: string = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.paymentForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.minLength(16), Validators.maxLength(19)]],
      cardHolder: ['', [Validators.required, Validators.minLength(2)]],
      expiryDate: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(4)]],
      saveCard: [false]
    });

    // Watch card number for brand detection
    this.paymentForm.get('cardNumber')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        if (value) {
          const cleaned = value.replace(/\s/g, '');
          this.cardBrand = this.paymentService.detectCardBrand(cleaned);
        }
      });
  }

  formatCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    
    // Limit length
    if (this.cardBrand === 'amex') {
      value = value.substring(0, 15);
    } else {
      value = value.substring(0, 16);
    }

    // Format with spaces
    let formatted = '';
    if (this.cardBrand === 'amex') {
      // AMEX: 4-6-5 format
      for (let i = 0; i < value.length; i++) {
        if (i === 4 || i === 10) formatted += ' ';
        formatted += value[i];
      }
    } else {
      // Standard: 4-4-4-4 format
      for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += value[i];
      }
    }

    this.paymentForm.get('cardNumber')?.setValue(formatted, { emitEvent: true });
    this.formattedCardNumber = formatted;
  }

  formatExpiryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }

    this.paymentForm.get('expiryDate')?.setValue(value);
  }

  formatCVVInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const maxLength = this.cardBrand === 'amex' ? 4 : 3;
    let value = input.value.replace(/\D/g, '').substring(0, maxLength);
    this.paymentForm.get('cvv')?.setValue(value);
  }

  onClose(): void {
    if (!this.isProcessing) {
      this.resetForm();
      this.close.emit();
    }
  }

  onBackdropClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop') && !this.isProcessing) {
      this.onClose();
    }
  }

  onSubmit(): void {
    if (this.paymentForm.invalid || this.isProcessing) {
      this.markFormGroupTouched(this.paymentForm);
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';

    const formValue = this.paymentForm.value;
    const request: PaymentRequest = {
      offerId: this.offerId,
      amount: this.amount,
      cardNumber: formValue.cardNumber.replace(/\s/g, ''),
      cardHolder: formValue.cardHolder,
      expiryDate: formValue.expiryDate,
      cvv: formValue.cvv,
      saveCard: formValue.saveCard,
      route: this.route,
      driverName: this.driverName
    };

    this.paymentService.processPayment(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isProcessing = false;
          if (result.success) {
            this.resetForm();
            this.paymentSuccess.emit(result);
          } else {
            this.errorMessage = result.message;
            this.paymentError.emit(result);
          }
        },
        error: (err) => {
          this.isProcessing = false;
          this.errorMessage = 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.';
          this.paymentError.emit({ success: false, message: this.errorMessage, error: 'UNKNOWN' });
        }
      });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private resetForm(): void {
    this.paymentForm.reset({ saveCard: false });
    this.cardBrand = undefined;
    this.formattedCardNumber = '';
    this.errorMessage = '';
  }

  getCardBrandIcon(): string {
    switch (this.cardBrand) {
      case 'visa': return '💳 Visa';
      case 'mastercard': return '💳 Mastercard';
      case 'amex': return '💳 American Express';
      default: return '💳';
    }
  }

  getPlatformFee(): number {
    return this.amount * 0.15; // 15% commission
  }

  getDriverAmount(): number {
    return this.amount - this.getPlatformFee();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.paymentForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.paymentForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Dieses Feld ist erforderlich';
    if (field.errors['minlength']) return 'Eingabe ist zu kurz';
    if (field.errors['maxlength']) return 'Eingabe ist zu lang';
    if (field.errors['pattern']) return 'Ungültiges Format';

    return 'Ungültige Eingabe';
  }
}
