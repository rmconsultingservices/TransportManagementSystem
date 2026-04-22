import type { ServiceRequest } from './workshop';
import type { Quotation } from './purchasing';

export interface ServiceLog {
  id: number;
  serviceRequestId: number;
  createdAt: string;
  note: string;
  createdBy?: string;
}

export interface PurchaseRequisition {
  id: number;
  serviceRequestId: number;
  serviceRequest?: ServiceRequest;
  dateRequested: string;
  partNameOrDescription: string;
  quantity: number;
  status: string; // 'Pendiente', 'Cotizando', 'Aprobada', 'Comprada', 'Rechazada'
  quotations?: Quotation[];
}
