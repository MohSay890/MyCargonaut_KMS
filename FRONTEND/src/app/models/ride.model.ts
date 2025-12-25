/**
 * Ride Domain Model
 * Represents a transport ride offered by a driver
 */

export interface Ride {
  id: string;
  driverId: string;
  vehicleId: string;
  origin: Location;
  destination: Location;
  departureDate: Date;
  departureTime: string;
  estimatedArrivalTime: string;
  distance: number; // in km
  duration: number; // in minutes
  availableWeight: number; // in kg
  availableVolume: number; // in m³
  pricePerKm: number;
  totalPrice: number;
  status: RideStatus;
  features: RideFeature[];
  cargoList: string[]; // IDs of associated cargo
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Location Model
 */
export interface Location {
  city: string;
  postalCode: string;
  address?: string;
  coordinates?: Coordinates;
}

/**
 * Coordinates Model
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Ride Status Enum
 */
export enum RideStatus {
  ACTIVE = 'active',
  BOOKED = 'booked',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Ride Feature Enum
 */
export enum RideFeature {
  INSURANCE_INCLUDED = 'Versicherung inkl.',
  LOADING_HELP = 'Be-/Entladehilfe',
  EXPRESS = 'Express',
  CAREFUL_TRANSPORT = 'Sorgfältiger Transport',
  FLEXIBLE_TIMES = 'Flexible Zeiten'
}

/**
 * Helper function to format location as string
 */
export function formatLocation(location: Location): string {
  return `${location.city}, ${location.postalCode}`;
}

/**
 * Helper function to format route as string
 */
export function formatRoute(origin: Location, destination: Location): string {
  return `${origin.city} → ${destination.city}`;
}
