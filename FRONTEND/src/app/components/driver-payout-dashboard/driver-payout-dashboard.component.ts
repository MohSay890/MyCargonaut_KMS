import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';

interface Payout {
  id: number;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
  scheduledAt?: Date;
  processedAt?: Date;
  completedAt?: Date;
  transactionReference?: string;
  notes?: string;
  payment: {
    id: number;
    fahrt: {
      startOrt: string;
      zielOrt: string;
      datum: string;
    };
  };
}

interface PaymentSummary {
  totalEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  thisMonthEarnings: number;
}

@Component({
  selector: 'app-driver-payout-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './driver-payout-dashboard.component.html',
  styleUrls: ['./driver-payout-dashboard.component.css']
})
export class DriverPayoutDashboardComponent implements OnInit, OnDestroy {
  payouts: Payout[] = [];
  summary: PaymentSummary = {
    totalEarnings: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    thisMonthEarnings: 0
  };

  isLoading = true;
  errorMessage = '';
  selectedFilter: 'all' | 'pending' | 'completed' = 'all';

  private destroy$ = new Subject<void>();
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const driverId = this.getCurrentUserId();

    forkJoin({
      payouts: this.http.get<Payout[]>(`${this.apiUrl}/payouts/driver/${driverId}`),
      earnings: this.http.get<any>(`${this.apiUrl}/payments/earnings?email=${this.getCurrentUserEmail()}`)
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.payouts = data.payouts.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.calculateSummary(data.payouts, data.earnings);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Fehler beim Laden der Auszahlungsdaten';
        this.isLoading = false;
        console.error('Error loading payouts:', err);
      }
    });
  }

  private calculateSummary(payouts: Payout[], earnings: any): void {
    // Total earnings from backend (All RELEASED payments)
    this.summary.totalEarnings = earnings.totalEarnings || 0;

    // Pending payout amount (from ESCROW.HELD payments + SCHEDULED/PENDING Payouts that haven't hit bank)
    const pendingFromPayouts = payouts
      .filter(p => !['COMPLETED', 'FAILED', 'CANCELLED'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);

    // Sum of held escrow payments + payouts that haven't reached the bank
    this.summary.pendingPayouts = (earnings.pendingPayout || 0) + pendingFromPayouts;

    // Count of completed payouts to bank account
    this.summary.completedPayouts = payouts.filter(p => p.status === 'COMPLETED').length;

    // This month earnings
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.summary.thisMonthEarnings = payouts
      .filter(p => {
        if (p.status !== 'COMPLETED' || !p.completedAt) return false;
        return new Date(p.completedAt) >= firstDayOfMonth;
      })
      .reduce((sum, p) => sum + p.amount, 0);
  }

  get filteredPayouts(): Payout[] {
    switch (this.selectedFilter) {
      case 'pending':
        return this.payouts.filter(p =>
          p.status === 'PENDING' || p.status === 'SCHEDULED' || p.status === 'PROCESSING'
        );
      case 'completed':
        return this.payouts.filter(p => p.status === 'COMPLETED');
      default:
        return this.payouts;
    }
  }

  setFilter(filter: 'all' | 'pending' | 'completed'): void {
    this.selectedFilter = filter;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'Ausstehend',
      'SCHEDULED': 'Geplant',
      'PROCESSING': 'In Bearbeitung',
      'COMPLETED': 'Abgeschlossen',
      'FAILED': 'Fehlgeschlagen',
      'CANCELLED': 'Storniert'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'PENDING': 'status-pending',
      'SCHEDULED': 'status-scheduled',
      'PROCESSING': 'status-processing',
      'COMPLETED': 'status-completed',
      'FAILED': 'status-failed',
      'CANCELLED': 'status-cancelled'
    };
    return classes[status] || '';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'PENDING': '⏳',
      'SCHEDULED': '📅',
      'PROCESSING': '🔄',
      'COMPLETED': '✅',
      'FAILED': '❌',
      'CANCELLED': '🚫'
    };
    return icons[status] || '•';
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getNextPayoutDate(): string {
    const pending = this.payouts.find(p => p.status === 'SCHEDULED' && p.scheduledAt);
    if (pending && pending.scheduledAt) {
      return this.formatDate(pending.scheduledAt);
    }

    // Calculate next Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return this.formatDate(nextMonday);
  }

  private getCurrentUserId(): number {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
    throw new Error('User not authenticated. Please log in.');
  }

  private getCurrentUserEmail(): string {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.email;
    }
    return '';
  }
}
