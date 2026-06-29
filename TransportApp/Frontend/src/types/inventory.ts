export interface SparePartCategory {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

export interface UnitOfMeasure {
  id: number;
  name: string;
  abbreviation: string;
  isActive: boolean;
}

export interface SparePart {
  id: number;
  code: string;
  name: string;
  categoryId?: number;
  category?: SparePartCategory;
  estimatedLifeSpanKm?: number;
  estimatedLifeSpanMonths?: number;
  stockQuantity: number;
  unitCost: number;
  unitOfMeasureId?: number;
  unitOfMeasure?: UnitOfMeasure;
  warehouseId?: number;
  warehouse?: { id: number; name: string };
  locationId?: number;
  location?: { id: number; name: string };
  imageUrl?: string;
  registrationDate?: string;
  isActive: boolean;
}

export interface InventoryAdjustmentDetail {
  id?: number;
  sparePartId: number;
  sparePart?: SparePart;
  type: 'ENTRADA' | 'SALIDA';
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface InventoryAdjustment {
  id?: number;
  date: string;
  remarks: string;
  createdBy?: string;
  details: InventoryAdjustmentDetail[];
}

export interface PhysicalInventoryDetail {
  id?: number;
  physicalInventoryId?: number;
  sparePartId: number;
  sparePart?: SparePart;
  theoreticalStock: number;
  realStock?: number;
  unitCost: number;
}

export interface PhysicalInventory {
  id?: number;
  number: string;
  description: string;
  warehouseId: number;
  warehouse?: { id: number; name: string };
  locationId?: number;
  location?: { id: number; name: string };
  dateStarted: string;
  dateProcessed?: string;
  status: 'INITIATED' | 'PROCESSED' | 'CANCELLED';
  details: PhysicalInventoryDetail[];
}
