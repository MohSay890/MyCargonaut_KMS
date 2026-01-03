import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PaymentModalComponent } from './payment-modal.component';
import { ReactiveFormsModule } from '@angular/forms';

describe('PaymentModalComponent', () => {
  let component: PaymentModalComponent;
  let fixture: ComponentFixture<PaymentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentModalComponent, ReactiveFormsModule, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a form with required fields', () => {
    expect(component.paymentForm).toBeTruthy();
    expect(component.paymentForm.get('cardNumber')).toBeTruthy();
    expect(component.paymentForm.get('cardHolder')).toBeTruthy();
    expect(component.paymentForm.get('expiryDate')).toBeTruthy();
    expect(component.paymentForm.get('cvv')).toBeTruthy();
    expect(component.paymentForm.get('saveCard')).toBeTruthy();
  });

  it('should detect Visa card brand', () => {
    component.paymentForm.get('cardNumber')?.setValue('4111111111111111');
    expect(component.cardBrand).toBe('visa');
  });

  it('should detect Mastercard brand', () => {
    component.paymentForm.get('cardNumber')?.setValue('5555555555554444');
    expect(component.cardBrand).toBe('mastercard');
  });

  it('should emit close event when onClose is called', () => {
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });
});
