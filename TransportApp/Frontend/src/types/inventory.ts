export interface SparePartUnit {
  id?: number;
  sparePartId?: number;
  unitOfMeasureId: number;
  unitOfMeasure?: UnitOfMeasure;
  isPrimary: boolean;
  equivalence: number;
  isInverse: boolean;
}
export interface SparePartCategory {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  sparePartUnits?: SparePartUnit[];
}

export interface UnitOfMeasure {
  id: number;
  name: string;
  abbreviation: string;
  isActive: boolean;
  sparePartUnits?: SparePartUnit[];
}

export interface SparePart {
  id: number;
  itemType?: string;
  code: string;
  name: string;
  brand?: string;
  model?: string;
  presentation?: string;
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
  sparePartUnits?: SparePartUnit[];
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
    unitOfMeasureId?: number | null;
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


