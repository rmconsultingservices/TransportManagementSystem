import type { Vehicle, Trailer, Mechanic } from './index';
import type { SparePart } from './inventory';
import type { ServiceLog, PurchaseRequisition } from './logs';

export interface ServiceExecutionSparePart {
  id: number;
  sparePartId: number;
  sparePart?: SparePart;
  quantity: number;
}

export interface ServiceExecution {
  id?: number;
  diagnosisObservations?: string;
  finalObservations?: string;
  mileageAtService?: number;
  dateCompleted?: string;
  usedSpareParts?: ServiceExecutionSparePart[];
}

export interface ServiceRequest {
  id: number;
  vehicleId?: number;
  vehicle?: Vehicle;
  trailerId?: number;
  trailer?: Trailer;
  dateRequested: string;
  driverId?: number;
  driver?: { id: number, name: string };
  repairType?: string;
  description?: string;
  status: string; // 'Pendiente', 'En Revisión', 'Completado'
  mechanicId?: number;
  mechanic?: Mechanic;
  logs?: ServiceLog[];
  requisitions?: PurchaseRequisition[];
  execution?: ServiceExecution;
  activities?: { id?: number, description: string }[];
}

export interface MaintenanceOrder {
  id: number;
  companyId: number;
  vehicleId?: number;
  vehicle?: Vehicle;
  trailerId?: number;
  trailer?: Trailer;
  serviceRequestId?: number;
  date: string;
  type: string;
  mileageAtMaintenance: number;
  mechanicAssigned: string;
  notes: string;
}
