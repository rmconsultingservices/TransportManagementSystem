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
}

export interface PurchaseInvoice {
  id: number;
  supplierId: number;
  supplier?: Supplier;
  invoiceNumber: string;
  controlNumber?: string;
  dateIssued: string;
  paymentCondition: string;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  details?: PurchaseInvoiceDetail[];
}

export interface PurchaseInvoiceDetail {
  id: number;
  purchaseInvoiceId: number;
  sparePartId: number;
  sparePart?: any; // Inventory Part Back ref
  warehouseCode?: string;
  quantityReceived: number;
  unitCost: number;
  taxPercentage: number;
}
