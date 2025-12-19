/**
 * Cargo Domain Model
 * Represents cargo to be transported
 */

export interface Cargo {
  id: string;
  rideId: string;
  senderId: string;
  receiverId?: string;
  description: string;
  category: CargoCategory;
  weight: number; // in kg
  dimensions: CargoDimensions;
  pickupLocation: Location;
  deliveryLocation: Location;
  pickupDate: Date;
  deliveryDate?: Date;
  status: CargoStatus;
  price: number;
  insurance: boolean;
  insuranceValue?: number;
  specialInstructions?: string;
  photos?: string[];
  trackingNumber?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Cargo Dimensions
 */
export interface CargoDimensions {
  length: number;  // in cm
  width: number;   // in cm
  height: number;  // in cm
}

/**
 * Location Model (same as in ride.model.ts)
 */
export interface Location {
  city: string;
  postalCode: string;
  address: string;
  contactPerson?: string;
  phoneNumber?: string;
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
 * Cargo Status Enum
 */
export enum CargoStatus {
  REQUESTED = 'requested',
  CONFIRMED = 'confirmed',
  PICKED_UP = 'picked-up',
  IN_TRANSIT = 'in-transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

/**
 * Cargo Category Enum
 */
export enum CargoCategory {
  FURNITURE = 'Möbel',
  BOXES = 'Umzugskisten',
  ELECTRONICS = 'Elektronik',
  SPORTS_EQUIPMENT = 'Sportgeräte',
  BUILDING_MATERIALS = 'Baumaterial',
  OTHER = 'Sonstiges'
}

/**
 * Helper function to calculate volume in m³
 */
export function calculateVolume(dimensions: CargoDimensions): number {
  return (dimensions.length * dimensions.width * dimensions.height) / 1000000;
}

/**
 * Helper function to check if cargo fits in available space
 */
export function doesCargoFit(
  cargo: CargoDimensions,
  availableSpace: CargoDimensions
): boolean {
  return (
    cargo.length <= availableSpace.length &&
    cargo.width <= availableSpace.width &&
    cargo.height <= availableSpace.height
  );
}
