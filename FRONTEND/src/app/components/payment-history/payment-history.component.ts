import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { PaymentService, PaymentTransaction } from '../../services/payment.service';

interface BackendPayment {
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
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink],
  templateUrl: './payment-history.component.html',
  styleUrls: ['./payment-history.component.css']
})
export class PaymentHistoryComponent implements OnInit, OnDestroy {

  transactions: PaymentTransaction[] = [];
  isLoading: boolean = true;
  selectedTransaction: PaymentTransaction | null = null;
  showRefundModal: boolean = false;
  showDetailModal: boolean = false;
  isProcessingRefund: boolean = false;
  refundMessage: string = '';
  currentUserEmail: string | null = null;

  private destroy$ = new Subject<void>();

  // Stats
  totalSpent: number = 0;
  completedCount: number = 0;
  refundedCount: number = 0;

  constructor(
    private paymentService: PaymentService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get current user
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserEmail = user.email;
    }
    this.loadTransactions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTransactions(): void {
    if (!this.currentUserEmail) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    // Load from backend API
    this.http.get<BackendPayment[]>(
      `http://localhost:8080/api/payments/history?email=${encodeURIComponent(this.currentUserEmail)}`
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (backendPayments) => {
          // Convert backend format to frontend format
          this.transactions = backendPayments.map(bp => this.convertToFrontendFormat(bp));
          // Sort by date, newest first
          this.transactions.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          this.calculateStats();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          this.isLoading = false;
        }
      });
  }

  private convertToFrontendFormat(bp: BackendPayment): PaymentTransaction {
    // Map status to match frontend expectations
    const statusMap: { [key: string]: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' } = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'COMPLETED': 'completed',
      'FAILED': 'failed',
      'REFUNDED': 'refunded'
    };

    // Map payment method
    const methodMap: { [key: string]: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' } = {
      'CREDIT_CARD': 'credit_card',
      'DEBIT_CARD': 'debit_card',
      'PAYPAL': 'paypal',
      'BANK_TRANSFER': 'bank_transfer'
    };

    return {
      id: bp.id.toString(),
      offerId: bp.id.toString(),
      userId: this.currentUserEmail || '',
      amount: bp.amount,
      currency: bp.currency,
      status: statusMap[bp.status] || 'pending',
      paymentMethod: {
        id: bp.id.toString(),
        type: methodMap[bp.paymentMethod] || 'credit_card',
        isDefault: false,
        createdAt: new Date(bp.createdAt)
      },
      description: `Zahlung für ${bp.route}`,
      route: bp.route,
      driverName: bp.recipientName || 'Unbekannt',
      createdAt: new Date(bp.createdAt),
      completedAt: bp.processedAt ? new Date(bp.processedAt) : undefined,
      refundedAt: bp.status === 'REFUNDED' ? new Date(bp.processedAt || bp.createdAt) : undefined
    };
  }

  private calculateStats(): void {
    this.totalSpent = this.transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    this.completedCount = this.transactions.filter(t => t.status === 'completed').length;
    this.refundedCount = this.transactions.filter(t => t.status === 'refunded').length;
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed': return 'Abgeschlossen';
      case 'pending': return 'Ausstehend';
      case 'processing': return 'In Bearbeitung';
      case 'failed': return 'Fehlgeschlagen';
      case 'refunded': return 'Erstattet';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'failed': return 'status-failed';
      case 'refunded': return 'status-refunded';
      default: return '';
    }
  }

  getCardBrandIcon(brand?: string): string {
    switch (brand) {
      case 'visa': return '💳 Visa';
      case 'mastercard': return '💳 MC';
      case 'amex': return '💳 Amex';
      default: return '💳';
    }
  }

  onViewDetails(transaction: PaymentTransaction): void {
    this.selectedTransaction = transaction;
    this.showDetailModal = true;
  }

  onCloseDetailModal(): void {
    this.showDetailModal = false;
    this.selectedTransaction = null;
  }

  onRequestRefund(transaction: PaymentTransaction): void {
    this.selectedTransaction = transaction;
    this.showRefundModal = true;
  }

  onCloseRefundModal(): void {
    this.showRefundModal = false;
    this.selectedTransaction = null;
    this.refundMessage = '';
  }

  onConfirmRefund(): void {
    if (!this.selectedTransaction || this.isProcessingRefund || !this.currentUserEmail) return;

    this.isProcessingRefund = true;

    this.http.post(
      `http://localhost:8080/api/payments/${this.selectedTransaction.id}/refund`,
      {},
      { params: { email: this.currentUserEmail } }
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isProcessingRefund = false;
          this.refundMessage = 'Rückerstattung erfolgreich beantragt!';
          // Reload transactions to update status
          this.loadTransactions();
          setTimeout(() => {
            this.onCloseRefundModal();
          }, 2000);
        },
        error: (error) => {
          this.isProcessingRefund = false;
          this.refundMessage = 'Fehler bei der Rückerstattungsanfrage.';
          console.error('Error processing refund:', error);
        }
      });
  }

  onBackToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
