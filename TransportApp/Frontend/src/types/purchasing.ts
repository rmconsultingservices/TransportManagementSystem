export interface Supplier {
  id: number;
  name: string;
  taxId?: string;
  code?: string;
  address?: string;
  contactName?: string;
  phoneNumber?: string;
  email?: string;
  isActive: boolean;
}

export interface Quotation {
  id: number;
  purchaseRequisitionId: number;
  supplierId: number;
  supplier?: Supplier;
  unitPrice: number;
  quantity: number;
  dateReceived: string;
  notes?: string;
  isSelected: boolean;
}

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId: number;
  supplier?: Supplier;
  dateCreated: string;
  approvedBy?: string;
  status: string;
  orderTotal: number;
  details?: PurchaseOrderDetail[];
}

export interface PurchaseOrderDetail {
  id: number;
  purchaseOrderId: number;
  purchaseRequisitionId: number;
  purchaseRequisition?: any; // Requisition back ref
  quantityOrdered: number;
  unitPrice: number;
  unitOfMeasureId?: number;
}

export interface PurchaseInvoice {
  id: number;
  supplierId: number;
  supplier?: Supplier;
  purchaseOrderId?: number | null;
  purchaseOrder?: PurchaseOrder | null;
  invoiceNumber: string;
  controlNumber?: string;
  dateIssued: string;
  paymentCondition: string;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus?: string; // "CXP", "PARCIAL", "PAGADO"
  amountPaid?: number;
  paymentDate?: string | null;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  exchangeRate?: number;
  attachmentUrl?: string;
  isCancelled?: boolean;
  details?: PurchaseInvoiceDetail[];
}

export interface PurchaseInvoiceDetail {
  id: number;
  purchaseInvoiceId: number;
  sparePartId: number;
  sparePart?: any; // Inventory Part Back ref
  unitOfMeasureId?: number;
  warehouseCode?: string;
  quantityReceived: number;
  unitCost: number;
  taxPercentage: number;
  purchaseOrderDetailId?: number | null;
  purchaseRequisitionId?: number | null;
  purchaseRequisition?: any;
  vehicleId?: number | null;
  vehicle?: any;
  trailerId?: number | null;
  trailer?: any;
  itemType?: string; // "C" | "S"
  description?: string;
}


export interface ExpensesSheetItem {
  fechaCompra: string;
  tipo: string;
  estatus: string;
  descripcion: string;
  modelo: string;
  marca: string;
  cantidad: number;
  reqCompra: string;
  numeroFactura: string;
  proveedor: string;
  costoUnitario: number;
  costoTotal: number;
  fechaRecibido: string;
  pagadoDia: string;
  formaPago: string;
  totalFactura: number;
  vehiculo: string;
  empresa: string;
}

export interface ExpensesSheetSummary {
  totalItems: number;
  totalInvoices: number;
  totalSpent: number;
  totalPaid: number;
  totalPendingCxp: number;
}

export interface ExpensesSheetResponse {
  companyName: string;
  periodText: string;
  summary: ExpensesSheetSummary;
  items: ExpensesSheetItem[];
}
