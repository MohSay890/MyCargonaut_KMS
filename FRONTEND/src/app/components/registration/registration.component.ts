import { Component } from '@angular/core';
import { Cargonaut } from '../../models/cargonaut.model';

@Component({
  selector: 'app-registration',
  standalone: true,        // ← NEU!
  imports: [],             // ← NEU!
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent {

  // Form data
  newCargonaut: Partial<Cargonaut> = {
    name: '',
    dateOfBirth: undefined,
    mobileNumber: '',
    averageRating: 0,
    totalRatings: 0,
    vehicles: [],
    createdAt: new Date()
  };

  constructor() { }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    console.log('Registration submitted:', this.newCargonaut);

    // TODO: Send data to backend
    // TODO: Navigate to profile page

    alert('Registrierung erfolgreich! (TODO: Backend-Integration)');
  }

  /**
   * Handle cancel button
   */
  onCancel(): void {
    // Reset form
    this.newCargonaut = {
      name: '',
      dateOfBirth: undefined,
      mobileNumber: '',
      averageRating: 0,
      totalRatings: 0,
      vehicles: [],
      createdAt: new Date()
    };

    console.log('Registration cancelled');
  }

  /**
   * Mask phone number for display (optional feature)
   */
  maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length < 4) return phoneNumber;
    const visible = phoneNumber.slice(-4);
    const masked = '•'.repeat(phoneNumber.length - 4);
    return masked + visible;
  }
}
