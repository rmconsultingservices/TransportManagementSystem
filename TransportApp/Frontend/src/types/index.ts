export interface Vehicle {
  id: number;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  currentMileage: number;
  lastMaintenanceMileage: number;
  maintenanceInterval: number;
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
  isActive: boolean;
}

export * from './inventory';
export * from './workshop';
export * from './staff';
export * from './logs';
export * from './purchasing';
