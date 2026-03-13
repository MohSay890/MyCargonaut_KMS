import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap, map, switchMap } from 'rxjs';

export interface Vehicle {
  id?: number;  // Backend uses Long/number
  ownerEmail?: string;
  besitzerEmail?: string;  // Backend field name
  name?: string;
  marke?: string;          // Backend field name (brand)
  modell?: string;         // Backend field name (model)
  type?: string;
  typ?: string;            // Backend field name
  licensePlate?: string;
  kennzeichen?: string;    // Backend field name
  year?: number;
  baujahr?: number;        // Backend field name
  capacity?: number;
  kapazitaet?: number;     // Backend field name
  maxWeight?: number;
  maxGewicht?: number;     // Backend field name
  dimensions?: string;
  abmessungen?: string;    // Backend field name
  insurance?: string;
  versicherung?: string;   // Backend field name
  isActive?: boolean;
  istAktiv?: boolean;      // Backend field name
  hatKuehlung?: boolean;   // Backend field (has cooling)
  createdAt?: string;
  erstelltAm?: string;     // Backend field name
  updatedAt?: string;
  aktualisiertAm?: string; // Backend field name
}

@Injectable({
  providedIn: 'root'
})
export class VehicleService {

  private readonly API_URL = 'http://localhost:8080/api/fahrzeuge';

  // BehaviorSubject to notify components of vehicle changes
  private vehiclesSubject = new BehaviorSubject<Vehicle[]>([]);
  public vehicles$ = this.vehiclesSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load vehicles for current user on service initialization
    this.loadVehiclesForCurrentUser();
  }

  /**
   * Get current user from localStorage
   */
  private getCurrentUser(): any {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Map backend vehicle to frontend format
   */
  private mapBackendToFrontend(backendVehicle: any): Vehicle {
    return {
      id: backendVehicle.id,
      ownerEmail: backendVehicle.besitzerEmail || backendVehicle.ownerEmail,
      name: `${backendVehicle.marke || ''} ${backendVehicle.modell || ''}`.trim(),
      marke: backendVehicle.marke,
      modell: backendVehicle.modell,
      type: backendVehicle.typ || backendVehicle.type,
      licensePlate: backendVehicle.kennzeichen || backendVehicle.licensePlate,
      year: backendVehicle.baujahr || backendVehicle.year,
      capacity: backendVehicle.kapazitaet || backendVehicle.capacity,
      maxWeight: backendVehicle.maxGewicht || backendVehicle.maxWeight,
      dimensions: backendVehicle.abmessungen || backendVehicle.dimensions,
      insurance: backendVehicle.versicherung || backendVehicle.insurance,
      isActive: backendVehicle.istAktiv !== undefined ? backendVehicle.istAktiv : backendVehicle.isActive,
      hatKuehlung: backendVehicle.hatKuehlung,
      createdAt: backendVehicle.erstelltAm || backendVehicle.createdAt,
      updatedAt: backendVehicle.aktualisiertAm || backendVehicle.updatedAt
    };
  }

  /**
   * Map frontend vehicle to backend format
   */
  private mapFrontendToBackend(frontendVehicle: any): any {
    const parts = (frontendVehicle.name || '').split(' ');
    return {
      id: frontendVehicle.id,
      besitzerEmail: frontendVehicle.ownerEmail || frontendVehicle.besitzerEmail,
      marke: frontendVehicle.marke || parts[0] || '',
      modell: frontendVehicle.modell || parts.slice(1).join(' ') || '',
      typ: frontendVehicle.type || frontendVehicle.typ,
      kennzeichen: frontendVehicle.licensePlate || frontendVehicle.kennzeichen,
      baujahr: frontendVehicle.year || frontendVehicle.baujahr,
      kapazitaet: frontendVehicle.capacity || frontendVehicle.kapazitaet || 0,
      maxGewicht: frontendVehicle.maxWeight || frontendVehicle.maxGewicht || 0,
      abmessungen: frontendVehicle.dimensions || frontendVehicle.abmessungen,
      versicherung: frontendVehicle.insurance || frontendVehicle.versicherung,
      istAktiv: frontendVehicle.isActive !== undefined ? frontendVehicle.isActive : frontendVehicle.istAktiv !== undefined ? frontendVehicle.istAktiv : true,
      hatKuehlung: frontendVehicle.hatKuehlung || false
    };
  }

  /**
   * Load vehicles for the current logged-in user from backend
   */
  loadVehiclesForCurrentUser(): void {
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.email) {
      const params = new HttpParams().set('email', currentUser.email);

      this.http.get<any[]>(this.API_URL, { params }).pipe(
        map(vehicles => vehicles.map(v => this.mapBackendToFrontend(v))),
        tap(vehicles => console.log('Vehicles loaded from backend:', vehicles)),
        catchError(error => {
          console.error('Error loading vehicles from backend:', error);
          this.vehiclesSubject.next([]);
          return of([]);
        })
      ).subscribe(vehicles => {
        this.vehiclesSubject.next(vehicles);
      });
    } else {
      this.vehiclesSubject.next([]);
    }
  }

  /**
   * Get all vehicles for the current user
   */
  getMyVehicles(): Vehicle[] {
    return this.vehiclesSubject.getValue();
  }

  /**
   * Get a specific vehicle by ID (only if owned by current user)
   */
  getVehicleById(id: number): Observable<Vehicle | undefined> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return of(undefined);

    const params = new HttpParams().set('email', currentUser.email);

    return this.http.get<any>(`${this.API_URL}/${id}`, { params }).pipe(
      map(vehicle => this.mapBackendToFrontend(vehicle)),
      catchError(error => {
        console.error('Error loading vehicle:', error);
        return of(undefined);
      })
    );
  }

  /**
   * Create a new vehicle for the current user
   */
  createVehicle(vehicleData: Omit<Vehicle, 'id' | 'ownerEmail' | 'createdAt' | 'updatedAt'>): Observable<{ success: boolean; vehicle?: Vehicle; error?: string }> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return of({ success: false, error: 'Du musst angemeldet sein, um ein Fahrzeug hinzuzufügen.' });
    }

    // Validate required fields
    if (!vehicleData.name || !vehicleData.type || !vehicleData.licensePlate) {
      return of({ success: false, error: 'Bitte fülle alle Pflichtfelder aus.' });
    }

    const backendVehicle = this.mapFrontendToBackend({
      ...vehicleData,
      ownerEmail: currentUser.email
    });

    return this.http.post<any>(this.API_URL, backendVehicle).pipe(
      map(vehicle => {
        const mappedVehicle = this.mapBackendToFrontend(vehicle);
        this.loadVehiclesForCurrentUser(); // Refresh list
        console.log('Vehicle created:', mappedVehicle);
        return { success: true, vehicle: mappedVehicle };
      }),
      catchError(error => {
        console.error('Error creating vehicle:', error);
        return of({ success: false, error: 'Fehler beim Erstellen des Fahrzeugs.' });
      })
    );
  }

  /**
   * Update an existing vehicle (only if owned by current user)
   */
  updateVehicle(id: number, updates: Partial<Vehicle>): Observable<{ success: boolean; vehicle?: Vehicle; error?: string }> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return of({ success: false, error: 'Du musst angemeldet sein, um ein Fahrzeug zu bearbeiten.' });
    }

    const backendUpdates = this.mapFrontendToBackend(updates);
    const params = new HttpParams().set('email', currentUser.email);

    return this.http.put<any>(`${this.API_URL}/${id}`, backendUpdates, { params }).pipe(
      map(vehicle => {
        const mappedVehicle = this.mapBackendToFrontend(vehicle);
        this.loadVehiclesForCurrentUser(); // Refresh list
        console.log('Vehicle updated:', mappedVehicle);
        return { success: true, vehicle: mappedVehicle };
      }),
      catchError(error => {
        console.error('Error updating vehicle:', error);
        return of({ success: false, error: 'Fehler beim Aktualisieren des Fahrzeugs.' });
      })
    );
  }

  /**
   * Delete a vehicle (only if owned by current user)
   */
  deleteVehicle(id: number): Observable<{ success: boolean; error?: string }> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return of({ success: false, error: 'Du musst angemeldet sein, um ein Fahrzeug zu löschen.' });
    }

    const params = new HttpParams().set('email', currentUser.email);

    return this.http.delete<void>(`${this.API_URL}/${id}`, { params }).pipe(
      map(() => {
        this.loadVehiclesForCurrentUser(); // Refresh list
        console.log('Vehicle deleted:', id);
        return { success: true };
      }),
      catchError(error => {
        console.error('Error deleting vehicle:', error);
        return of({ success: false, error: 'Fehler beim Löschen des Fahrzeugs.' });
      })
    );
  }

  /**
   * Toggle vehicle active status
   */
  toggleVehicleActive(id: number): Observable<{ success: boolean; isActive?: boolean; error?: string }> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return of({ success: false, error: 'Du musst angemeldet sein.' });
    }

    // Get current vehicle first
    return this.getVehicleById(id).pipe(
      switchMap(vehicle => {
        if (!vehicle) {
          return of({ success: false, error: 'Fahrzeug nicht gefunden.' });
        }

        // Update with toggled active status
        return this.updateVehicle(id, { isActive: !vehicle.isActive }).pipe(
          map(res => ({ ...res, isActive: !vehicle.isActive }))
        );
      }),
      catchError(error => {
        console.error('Error toggling vehicle active:', error);
        return of({ success: false, error: 'Fehler beim Aktualisieren des Fahrzeugs.' });
      })
    );
  }

  /**
   * Get active vehicles for current user (for use in offer creation)
   */
  getActiveVehicles(): Vehicle[] {
    return this.getMyVehicles().filter(v => v.isActive);
  }

  /**
   * Get vehicle count for current user
   */
  getVehicleCount(): { total: number; active: number; inactive: number } {
    const vehicles = this.getMyVehicles();
    return {
      total: vehicles.length,
      active: vehicles.filter(v => v.isActive).length,
      inactive: vehicles.filter(v => !v.isActive).length
    };
  }
}
