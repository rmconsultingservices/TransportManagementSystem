import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { purchasingService } from '../services/purchasingService';
import type { PurchaseOrder } from '../types';
import { Printer } from 'lucide-react';

export default function PrintPurchaseOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!id) return;
        const data = await purchasingService.getPurchaseOrders();
        const found = data.find(o => o.id === Number(id));
        if (found) setOrder(found);
      } catch (error) {
        console.error('Error fetching order for print:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Cargando documento...</div>;
  }

  if (!order) {
    return <div className="p-12 text-center text-red-500">Orden no encontrada.</div>;
  }

  // Combine vehicles from details
  const vehicles = Array.from(new Set(order.details?.map(d => 
    d.purchaseRequisition?.serviceRequest?.vehicle?.licensePlate || 
    d.purchaseRequisition?.serviceRequest?.trailer?.licensePlate
  ).filter(Boolean)));
  const vehicleText = vehicles.length > 0 ? vehicles.join(', ') : 'Múltiples / Taller General';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-8 font-sans print:p-0 print:bg-white text-gray-900">
      <style>
        {`
          @media print {
            @page {
              size: letter;
              margin: 10mm;
            }
            body {
              background: white;
            }
            .print-hidden {
              display: none;
            }
          }
        `}
      </style>
      <div className="max-w-[800px] mx-auto">
        
        {/* Web Only Action Bar */}
        <div className="flex justify-end gap-3 mb-6 print:hidden">
          <button 
            onClick={() => navigate('/purchasing')}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            Volver
          </button>
          <button 
            onClick={() => window.print()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Printer size={16} /> Imprimir Documento
          </button>
        </div>

        {/* Paper Document */}
        <div className="bg-white print:shadow-none shadow-lg print:border-0 border border-gray-200" style={{ minHeight: '1056px', position: 'relative' }}>
          
          {/* Top Section */}
          <div className="bg-slate-50 p-8 flex justify-between items-start border-b border-gray-100">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Orden de Compra</h1>
              <p className="text-slate-500 mt-2 text-sm max-w-sm leading-relaxed">
                Solicitud formal de insumos y servicios para las operaciones de mantenimiento de la flota.
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-right min-w-[160px]">
              <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1">Document ID</div>
              <div className="text-lg font-bold text-indigo-700">#{order.orderNumber}</div>
              <div className="text-xs text-gray-500 mt-2 flex items-center justify-end gap-1.5">
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                 {new Date(order.dateCreated).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="border border-gray-100 rounded p-4">
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1">PROVEEDOR</div>
                  <div className="font-semibold text-gray-800 text-sm">{order.supplier?.name || 'Proveedor General'}</div>
               </div>
               <div className="border border-gray-100 rounded p-4">
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1">DEPARTAMENTO</div>
                  <div className="font-semibold text-gray-800 text-sm">Mantenimiento y Taller</div>
               </div>
            </div>

            {/* Table */}
            <div className="rounded-t-lg overflow-hidden border border-gray-200">
               <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-500 text-xs uppercase tracking-wider font-bold">
                     <tr>
                        <th className="px-4 py-3 w-12 text-center">#</th>
                        <th className="px-4 py-3">ARTÍCULOS / REPUESTOS</th>
                        <th className="px-4 py-3 text-center">CANTIDAD</th>
                        <th className="px-4 py-3">OBSERVACIÓN</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {order.details?.map((d, index) => (
                        <tr key={d.id} className="bg-white">
                           <td className="px-4 py-4 text-center text-gray-400 font-medium">{String(index + 1).padStart(2, '0')}</td>
                           <td className="px-4 py-4 font-semibold text-gray-800">{d.purchaseRequisition?.partNameOrDescription || 'Repuesto'}</td>
                           <td className="px-4 py-4 text-center">
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold text-xs">{d.quantityOrdered} und</span>
                           </td>
                           <td className="px-4 py-4 text-gray-500 text-xs italic">
                              {d.purchaseRequisition?.serviceRequest?.description ? d.purchaseRequisition.serviceRequest.description.substring(0, 50) + '...' : 'Requisición aprobada'}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            
            {/* Table Spacer for padding */}
            <div className="border-x border-b border-gray-200 bg-slate-50 h-10 mb-12 rounded-b-lg"></div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-8 mb-12 mt-20">
               <div>
                  <div className="border-b border-gray-300 pb-2 mb-2 min-h-[40px] flex items-end">
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">AUTORIZADO POR</div>
                  <div className="font-bold text-sm text-gray-800">Gerencia de Mantenimiento</div>
               </div>
               <div>
                  <div className="border-b border-gray-300 pb-2 mb-2 min-h-[40px] flex items-end"></div>
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">MECÁNICO SOLICITANTE</div>
                  <div className="font-bold text-sm text-gray-800"></div>
               </div>
               <div>
                  <div className="border-b border-gray-300 pb-2 mb-2 min-h-[40px] flex items-end"></div>
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">CHOFER / ALMACÉN</div>
                  <div className="font-bold text-sm text-gray-800"></div>
               </div>
            </div>

            {/* Provider Box */}
            <div className="bg-slate-50 border border-gray-200 rounded-lg p-6 flex gap-6">
               <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1">Uso Exclusivo del Proveedor</h3>
                  <p className="text-xs text-gray-500">Sello, Firma y Teléfono requerido para validar entrega en almacén.</p>
               </div>
               <div className="w-32 h-20 border-2 border-dashed border-gray-200 flex justify-center items-center text-gray-300 text-xs font-medium uppercase tracking-widest bg-white">
                  Sello Aquí
               </div>
               <div className="flex-1 flex flex-col justify-end space-y-4">
                  <div className="border-b border-gray-200 flex items-end pb-1">
                     <span className="text-xs text-gray-400 w-16">Firma:</span>
                  </div>
                  <div className="border-b border-gray-200 flex items-end pb-1">
                     <span className="text-xs text-gray-400 w-16">Teléfono:</span>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
