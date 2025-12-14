import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cargonaut, calculateAge } from '../../models/cargonaut.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  // Mock data - später vom Backend
  cargonaut: Cargonaut = {
    id: '1',
    name: 'Max Mustermann',
    dateOfBirth: new Date('1995-06-15'),
    mobileNumber: '+49 123 456789',
    profileImage: 'https://i.pravatar.cc/300?img=12',
    averageRating: 4.8,
    totalRatings: 67,
    vehicles: [
      {
        id: '1',
        type: 'Transporter' as any,
        brand: 'Mercedes',
        model: 'Sprinter',
        licensePlate: 'B-XX 1234',
        year: 2020,
        loadCapacity: 1200,
        dimensions: { length: 320, width: 180, height: 180 },
        insurance: 'Vollkasko' as any,
        isActive: true,
        createdAt: new Date()
      }
    ],
    createdAt: new Date('2023-01-15'),
  };

  totalRides: number = 45;
  completedRides: number = 42;
  averageRating: number = 0;

  ngOnInit(): void {
    this.averageRating = Math.round(this.cargonaut.averageRating);
  }

  /**
   * Calculate age from date of birth
   */
  calculateAge(): number {
    return calculateAge(this.cargonaut.dateOfBirth);
  }

  /**
   * Format date for display
   */
  formatDate(date?: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long'
    });
  }

  /**
   * Navigate to edit profile
   */
  onEditProfile(): void {
    console.log('Edit profile clicked');
    // TODO: Navigate to edit page
  }

  /**
   * Navigate to vehicle management
   */
  onManageVehicles(): void {
    console.log('Manage vehicles clicked');
    // TODO: Navigate to vehicle page
  }
}
