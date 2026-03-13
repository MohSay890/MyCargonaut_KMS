import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';

interface DriverPayoutAccount {
  id?: number;
  accountHolderName: string;
  iban: string;
  bic?: string;
  bankName: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt?: Date;
  verifiedAt?: Date;
}

@Component({
  selector: 'app-driver-bank-account',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './driver-bank-account.component.html',
  styleUrls: ['./driver-bank-account.component.css']
})
export class DriverBankAccountComponent implements OnInit, OnDestroy {
  bankAccountForm!: FormGroup;
  currentAccount?: DriverPayoutAccount;
  isLoading = false;
  isSaving = false;
  isEditing = false;
  successMessage = '';
  errorMessage = '';

  private destroy$ = new Subject<void>();
  private apiUrl = 'http://localhost:8080/api/driver-payout-accounts';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadBankAccount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.bankAccountForm = this.fb.group({
      accountHolderName: ['', [Validators.required, Validators.minLength(3)]],
      iban: ['', [Validators.required, this.ibanValidator()]],
      bic: ['', [Validators.pattern(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/)]],
      bankName: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  private ibanValidator() {
    return (control: any) => {
      if (!control.value) return null;

      // Remove spaces and convert to uppercase
      const iban = control.value.replace(/\s/g, '').toUpperCase();

      // Basic format check: 2 letters + 2 digits + alphanumeric (15-30 chars total)
      const ibanPattern = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/;
      if (!ibanPattern.test(iban)) {
        return { pattern: true };
      }

      // German IBAN must be exactly 22 characters
      if (iban.startsWith('DE') && iban.length !== 22) {
        return { pattern: true };
      }

      return null;
    };
  }

  loadBankAccount(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const driverId = this.getCurrentUserId();

    this.http.get<DriverPayoutAccount>(`${this.apiUrl}/driver/${driverId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          this.currentAccount = account;
          this.populateForm(account);
          this.isLoading = false;
        },
        error: (err) => {
          if (err.status === 404) {
            // No account exists yet - this is fine
            this.currentAccount = undefined;
          } else {
            this.errorMessage = 'Fehler beim Laden der Kontodaten';
          }
          this.isLoading = false;
        }
      });
  }

  private populateForm(account: DriverPayoutAccount): void {
    this.bankAccountForm.patchValue({
      accountHolderName: account.accountHolderName,
      iban: account.iban,
      bic: account.bic || '',
      bankName: account.bankName
    });
  }

  onEdit(): void {
    this.isEditing = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  onCancel(): void {
    this.isEditing = false;
    if (this.currentAccount) {
      this.populateForm(this.currentAccount);
    } else {
      this.bankAccountForm.reset();
    }
    this.successMessage = '';
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (this.bankAccountForm.invalid || this.isSaving) {
      this.markFormGroupTouched(this.bankAccountForm);
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const driverId = this.getCurrentUserId();
    const formData = {
      ...this.bankAccountForm.value,
      // Strip spaces from IBAN for backend
      iban: this.bankAccountForm.value.iban.replace(/\s/g, '').toUpperCase(),
      // Strip spaces from BIC if provided
      bic: this.bankAccountForm.value.bic ? this.bankAccountForm.value.bic.replace(/\s/g, '').toUpperCase() : ''
    };

    this.http.post<DriverPayoutAccount>(`${this.apiUrl}/driver/${driverId}`, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (account) => {
          this.currentAccount = account;
          this.isEditing = false;
          this.isSaving = false;
          this.successMessage = 'Kontodaten erfolgreich gespeichert!';
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: (err) => {
          this.isSaving = false;
          this.errorMessage = 'Fehler beim Speichern der Kontodaten';
          console.error('Error saving bank account:', err);
        }
      });
  }

  onDelete(): void {
    if (!this.currentAccount || !confirm('Möchtest du dein Bankkonto wirklich löschen?')) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.http.delete(`${this.apiUrl}/${this.currentAccount.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.currentAccount = undefined;
          this.bankAccountForm.reset();
          this.isEditing = false;
          this.isLoading = false;
          this.successMessage = 'Bankkonto erfolgreich gelöscht';
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Fehler beim Löschen des Bankkontos';
          console.error('Error deleting bank account:', err);
        }
      });
  }

  formatIBAN(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\s/g, '').toUpperCase();

    // Format with spaces every 4 characters
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += value[i];
    }

    this.bankAccountForm.get('iban')?.setValue(formatted.trim(), { emitEvent: false });
  }

  formatBIC(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toUpperCase();
    this.bankAccountForm.get('bic')?.setValue(value, { emitEvent: false });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private getCurrentUserId(): number {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
    throw new Error('User not authenticated. Please log in.');
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.bankAccountForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.bankAccountForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Dieses Feld ist erforderlich';
    if (field.errors['minlength']) return 'Eingabe ist zu kurz';
    if (field.errors['pattern']) {
      if (fieldName === 'iban') return 'Ungültige IBAN (Format: DE89 3704 0044 0532 0130 00)';
      if (fieldName === 'bic') return 'Ungültiger BIC (Format: ABCDEFGH oder ABCDEFGH123)';
    }

    return 'Ungültige Eingabe';
  }
}
