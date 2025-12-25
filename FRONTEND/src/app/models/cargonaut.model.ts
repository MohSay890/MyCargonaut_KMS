/**
 * Cargonaut Domain Model
 * Represents a user in the MyCargonaut system
 */

export interface Cargonaut {
  id: string;
  name: string;
  dateOfBirth: Date;
  mobileNumber: string;
  profileImage?: string;
  averageRating: number;
  totalRatings: number;
  vehicles: Vehicle[];
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Vehicle Model
 * Represents a vehicle owned by a Cargonaut
 */
export interface Vehicle {
  id: string;
  type: VehicleType;
  brand: string;
  model: string;
  licensePlate: string;
  year: number;
  loadCapacity: number; // in kg
  dimensions: VehicleDimensions;
  insurance: InsuranceType;
  isActive: boolean;
  photos?: string[];
  createdAt: Date;
}

/**
 * Vehicle Dimensions
 */
export interface VehicleDimensions {
  length: number;  // in cm
  width: number;   // in cm
  height: number;  // in cm
}

/**
 * Vehicle Type Enum
 */
export enum VehicleType {
  PKW = 'PKW',
  TRANSPORTER = 'Transporter',
  LKW = 'LKW'
}

/**
 * Insurance Type Enum
 */
export enum InsuranceType {
  HAFTPFLICHT = 'Haftpflicht',
  TEILKASKO = 'Teilkasko',
  VOLLKASKO = 'Vollkasko'
}

/**
 * Helper function to calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}
