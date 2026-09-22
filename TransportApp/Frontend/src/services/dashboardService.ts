import api from '../lib/api';

export interface OperationalKpis {
  totalActiveVehicles: number;
  totalActiveTrailers: number;
  totalActiveUnits: number;
  inWorkshopVehicles: number;
  inWorkshopTrailers: number;
  inWorkshopTotal: number;
  operationalVehicles: number;
  operationalTrailers: number;
  operationalTotal: number;
  fleetAvailabilityPercent: number;
  vehiclesAvailabilityPercent: number;
  trailersAvailabilityPercent: number;
  fleetAvailabilityDelta: number;
  mttrHours: number;
  mttrDays: number;
  mttrDeltaHours: number;
  mttrSparkline: number[];
  completedOrdersCount: number;
  preventiveCount: number;
  correctiveCount: number;
  otherTypeCount: number;
  totalRequestsCount: number;
  preventivePercent: number;
  correctivePercent: number;
  failureFrequency: {
    id: number;
    licensePlate: string;
    unitType: string;
    brandOrType: string;
    model: string;
    totalFailures: number;
    correctiveCount: number;
    preventiveCount: number;
    lastServiceDate: string | null;
  }[];
  fleetOwners?: FleetOwnerFilter[];
}

export interface MonthlyCostEvolution {
  monthLabel: string;
  year: number;
  totalCost: number;
  averageCost: number;
  servicedUnitsCount: number;
}

export interface FinancialKpis {
  totalMaintenanceCost: number;
  totalCostDeltaPercent: number;
  averageCostPerServicedUnit: number;
  servicedUnitsCount: number;
  immobilizedInventoryValue: number;
  immobilizedItemsCount: number;
  topSpendingVehicles: {
    id: number;
    licensePlate: string;
    unitType: string;
    brandModel: string;
    totalCost: number;
    servicesCount: number;
    partsCount: number;
  }[];
  monthlyEvolution: MonthlyCostEvolution[];
}

export interface WarehouseFilter {
  id: number;
  name: string;
}

export interface FleetOwnerFilter {
  id: number;
  name: string;
}

export interface InventoryKpis {
  totalInventoryValuation: number;
  stockoutAlertsCount: number;
  stockoutAlerts: {
    id: number;
    code: string;
    name: string;
    category: string;
    warehouseName: string;
    stockQuantity: number;
    minimumStock: number;
    unitCost: number;
    unitOfMeasure: string;
    status: string;
  }[];
  topTurnoverParts: {
    id: number;
    code: string;
    name: string;
    category: string;
    totalQuantityConsumed: number;
    totalCostConsumed: number;
    unitOfMeasure: string;
    serviceOrdersCount: number;
  }[];
  warehouses: WarehouseFilter[];
}

export interface StaffKpis {
  mechanicProductivity: {
    mechanicId: number;
    mechanicName: string;
    speciality: string;
    completedOrders: number;
    preventiveOrdersCount: number;
    correctiveOrdersCount: number;
    averageRepairTimeHours: number;
    totalPartsInstalledCount: number;
  }[];
  driverIncidents: {
    driverId: number;
    driverName: string;
    licenseNumber: string;
    totalIncidents: number;
    correctiveCount: number;
    preventiveCount: number;
    lastIncidentDate: string | null;
  }[];
}

export const dashboardService = {
  getOperationalKpis: async (startDate?: string, endDate?: string, assetType: string = 'all', fleetOwnerId?: number): Promise<OperationalKpis> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (assetType && assetType !== 'all') params.append('assetType', assetType);
    if (fleetOwnerId && fleetOwnerId > 0) params.append('fleetOwnerId', fleetOwnerId.toString());
    const res = await api.get(`/dashboard/operational-kpis?${params.toString()}`);
    return res.data;
  },

  getFinancialKpis: async (startDate?: string, endDate?: string, assetType: string = 'all', fleetOwnerId?: number): Promise<FinancialKpis> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (assetType && assetType !== 'all') params.append('assetType', assetType);
    if (fleetOwnerId && fleetOwnerId > 0) params.append('fleetOwnerId', fleetOwnerId.toString());
    const res = await api.get(`/dashboard/financial-kpis?${params.toString()}`);
    return res.data;
  },

  getInventoryKpis: async (startDate?: string, endDate?: string, warehouseId?: number): Promise<InventoryKpis> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (warehouseId && warehouseId > 0) params.append('warehouseId', warehouseId.toString());
    const res = await api.get(`/dashboard/inventory-kpis?${params.toString()}`);
    return res.data;
  },

  getStaffKpis: async (startDate?: string, endDate?: string, fleetOwnerId?: number): Promise<StaffKpis> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (fleetOwnerId && fleetOwnerId > 0) params.append('fleetOwnerId', fleetOwnerId.toString());
    const res = await api.get(`/dashboard/staff-kpis?${params.toString()}`);
    return res.data;
  },

  downloadExcelReport: async (startDate?: string, endDate?: string, assetType: string = 'all', warehouseId?: number, fleetOwnerId?: number) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (assetType && assetType !== 'all') params.append('assetType', assetType);
    if (warehouseId && warehouseId > 0) params.append('warehouseId', warehouseId.toString());
    if (fleetOwnerId && fleetOwnerId > 0) params.append('fleetOwnerId', fleetOwnerId.toString());
    const res = await api.get(`/dashboard/export-excel?${params.toString()}`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Gerencial_${startDate || 'inicio'}_${endDate || 'fin'}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
