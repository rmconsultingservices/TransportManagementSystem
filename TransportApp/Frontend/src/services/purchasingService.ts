import api from '../lib/api';
import type { PurchaseRequisition, Supplier, Quotation, PurchaseOrder, PurchaseInvoice } from '../types';

export const purchasingService = {
  // Suppliers
  getSuppliers: async (): Promise<Supplier[]> => {
    const response = await api.get<Supplier[]>('/suppliers');
    return response.data;
  },
  createSupplier: async (supplier: Partial<Supplier>): Promise<Supplier> => {
    const response = await api.post<Supplier>('/suppliers', supplier);
    return response.data;
  },

  // Requisitions & Quotations
  getRequisitions: async (): Promise<PurchaseRequisition[]> => {
    const response = await api.get<PurchaseRequisition[]>('/purchaserequisitions');
    return response.data;
  },
  addQuotation: async (requisitionId: number, quotation: Partial<Quotation>): Promise<Quotation> => {
    const response = await api.post<Quotation>(`/purchaserequisitions/${requisitionId}/Quotes`, quotation);
    return response.data;
  },
  selectQuotation: async (requisitionId: number, quotationId: number): Promise<void> => {
    await api.put(`/purchaserequisitions/${requisitionId}/SelectQuote/${quotationId}`);
  },

  // Purchase Orders
  getPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    const response = await api.get<PurchaseOrder[]>('/purchaseorders');
    return response.data;
  },
  generateFromRequisitions: async (supplierId: number, requisitionIds: number[]): Promise<PurchaseOrder> => {
    const response = await api.post<PurchaseOrder>('/purchaseorders/GenerateFromRequisitions', { supplierId, requisitionIds });
    return response.data;
  },

  // Invoices (Receiving)
  getPurchaseInvoices: async (): Promise<PurchaseInvoice[]> => {
    const response = await api.get<PurchaseInvoice[]>('/purchaseinvoices');
    return response.data;
  },
  createPurchaseInvoice: async (invoice: Partial<PurchaseInvoice>): Promise<PurchaseInvoice> => {
    const response = await api.post<PurchaseInvoice>('/purchaseinvoices', invoice);
    return response.data;
  }
};
