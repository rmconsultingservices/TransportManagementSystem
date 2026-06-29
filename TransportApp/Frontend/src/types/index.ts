export interface FleetOwner {
  id: number;
  companyId: number;
  name: string;
  description: string;
  isActive: boolean;
}

export interface Vehicle {
  id: number;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  currentMileage: number;
  lastMaintenanceMileage: number;
  maintenanceInterval: number;
  fleetOwnerId?: number;
  fleetOwner?: FleetOwner;
  isActive: boolean;
}

export interface Trailer {
  id: number;
  licensePlate: string;
  type: string;
  axlesCount: number;
  currentMileage: number;
  lastMaintenanceMileage: number;
  maintenanceInterval: number;
  fleetOwnerId?: number;
  fleetOwner?: FleetOwner;
  isActive: boolean;
}

export * from './inventory';
export * from './workshop';
export * from './staff';
export * from './logs';
export * from './purchasing';
