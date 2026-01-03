import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar.component';

interface PaymentTransaction {
  id: number;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  route: string;
  payerName: string;
  payerEmail: string;
  recipientName?: string;
  recipientEmail?: string;
  createdAt: string;
  processedAt?: string;
  transactionReference?: string;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit {

  isLoading = true;
  paymentHistory: PaymentTransaction[] = [];
  currentUserEmail: string | null = null;

  // Filter
  selectedStatus: string = 'all';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Get current user
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserEmail = user.email;
      this.loadPaymentHistory();
    } else {
      this.isLoading = false;
    }
  }

  loadPaymentHistory(): void {
    if (!this.currentUserEmail) return;

    this.isLoading = true;
    this.http.get<PaymentTransaction[]>(
      `http://localhost:8080/api/payments/history?email=${encodeURIComponent(this.currentUserEmail)}`
    ).subscribe({
      next: (data) => {
        this.paymentHistory = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading payment history:', error);
        this.isLoading = false;
      }
    });
  }

  get filteredPayments(): PaymentTransaction[] {
    if (this.selectedStatus === 'all') {
      return this.paymentHistory;
    }
    return this.paymentHistory.filter(p => p.status.toLowerCase() === this.selectedStatus.toLowerCase());
  }

  getStatusClass(status: string): string {
    const statusLower = status.toLowerCase();
    switch(statusLower) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'failed': return 'status-failed';
      case 'refunded': return 'status-refunded';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    const statusLower = status.toLowerCase();
    switch(statusLower) {
      case 'completed': return 'Abgeschlossen';
      case 'pending': return 'Ausstehend';
      case 'processing': return 'In Bearbeitung';
      case 'failed': return 'Fehlgeschlagen';
      case 'refunded': return 'Erstattet';
      default: return status;
    }
  }

  getPaymentMethodText(method: string): string {
    const methodLower = method.toLowerCase();
    switch(methodLower) {
      case 'credit_card': return 'Kreditkarte';
      case 'debit_card': return 'EC-Karte';
      case 'paypal': return 'PayPal';
      case 'bank_transfer': return 'Überweisung';
      default: return method;
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency || 'EUR'
    }).format(amount);
  }

  requestRefund(payment: PaymentTransaction): void {
    if (!this.currentUserEmail) return;

    if (!confirm(`Möchten Sie eine Rückerstattung für diese Zahlung (${this.formatAmount(payment.amount, payment.currency)}) beantragen?`)) {
      return;
    }

    this.http.post(
      `http://localhost:8080/api/payments/${payment.id}/refund`,
      {},
      { params: { email: this.currentUserEmail } }
    ).subscribe({
      next: () => {
        alert('Rückerstattung wurde erfolgreich beantragt.');
        this.loadPaymentHistory(); // Reload to show updated status
      },
      error: (error) => {
        console.error('Error requesting refund:', error);
        alert('Fehler beim Beantragen der Rückerstattung: ' + (error.error?.error || 'Unbekannter Fehler'));
      }
    });
  }

  canRequestRefund(payment: PaymentTransaction): boolean {
    return payment.status.toLowerCase() === 'completed';
  }
}
