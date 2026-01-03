import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentHistoryComponent } from './payment-history.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('PaymentHistoryComponent', () => {
  let component: PaymentHistoryComponent;
  let fixture: ComponentFixture<PaymentHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentHistoryComponent, HttpClientTestingModule],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format amount correctly', () => {
    expect(component.formatAmount(1234.56)).toBe('1.234,56');
  });

  it('should get correct status text', () => {
    expect(component.getStatusText('completed')).toBe('Abgeschlossen');
    expect(component.getStatusText('pending')).toBe('Ausstehend');
    expect(component.getStatusText('refunded')).toBe('Erstattet');
  });
});
