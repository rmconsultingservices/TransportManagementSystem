import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { purchasingService } from '../services/purchasingService';
import { useAuthStore } from '../store/authStore';
import type { PurchaseOrder } from '../types';
import { Printer, ArrowLeft } from 'lucide-react';

export default function PrintPurchaseOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const selectedCompany = useAuthStore(state => state.selectedCompany);
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

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando documento...</div>;
  if (!order) return <div className="p-8 text-center text-red-500">No se encontró la orden de compra.</div>;

  // Extract unique vehicles associated with this PO's requisitions
  const vehicles = Array.from(new Set(order.details?.map(d => {
    const v = d.purchaseRequisition?.serviceRequest?.vehicle;
    return v ? `${v.brand} ${v.model} (${v.licensePlate})` : null;
  }).filter(Boolean)));
  const vehicleText = vehicles.length > 0 ? vehicles.join(', ') : 'Múltiples / Taller General';

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans print:p-0 print:m-0 print:bg-white text-gray-900">
      <style>
        {`
          @page {
            size: letter portrait;
            margin: 8mm 10mm;
          }
          @media print {
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-hidden {
              display: none !important;
            }
            .printable-sheet {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              min-height: auto !important;
              width: 100% !important;
              max-width: 100% !important;
            }
          }
        `}
      </style>
      <div className="max-w-[850px] mx-auto print:max-w-none print:w-full">
        
        {/* Web Only Action Bar */}
        <div className="flex justify-between items-center gap-3 mb-6 print:hidden">
          <button 
            onClick={() => navigate('/purchasing')}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <button 
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-bold text-sm transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Printer size={16} /> Imprimir Orden
          </button>
        </div>

        {/* Paper Document */}
        <div className="printable-sheet bg-white shadow-lg border border-gray-200 rounded-sm">
          
          {/* Top Section */}
          <div className="bg-slate-50 p-6 sm:p-8 flex justify-between items-start border-b border-gray-200">
            <div className="flex items-start gap-4">
              {selectedCompany?.logoUrl ? (
                <img 
                  src={selectedCompany.logoUrl} 
                  alt={selectedCompany.name || 'Logo'} 
                  className="h-14 w-auto object-contain print:h-12"
                />
              ) : (
                <div className="h-12 w-12 rounded bg-indigo-700 text-white flex items-center justify-center font-black text-xl">
                  {(selectedCompany?.name || 'OC').substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Orden de Compra</h1>
                <p className="text-slate-500 text-xs mt-0.5">
                  Solicitud formal de insumos y servicios para las operaciones de mantenimiento de la flota.
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-indigo-700">
                  <span>{selectedCompany?.name || 'Transporte'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200 text-right min-w-[150px] shadow-xs">
              <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">DOCUMENT ID</div>
              <div className="text-base font-extrabold text-indigo-700 font-mono">#{order.orderNumber}</div>
              <div className="text-[11px] text-gray-500 mt-1 flex items-center justify-end gap-1 font-medium">
                <span>Fecha:</span>
                <span>{new Date(order.dateCreated).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="border border-gray-200 rounded-lg p-3.5 bg-white">
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1">PROVEEDOR</div>
                  <div className="font-bold text-gray-800 text-sm">{order.supplier?.name || 'Proveedor General'}</div>
                  {order.supplier?.taxId && (
                    <div className="text-xs text-gray-500 mt-0.5">RIF / ID: {order.supplier.taxId}</div>
                  )}
               </div>
               <div className="border border-gray-200 rounded-lg p-3.5 bg-white">
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1">DEPARTAMENTO / DESTINO</div>
                  <div className="font-bold text-gray-800 text-sm">Mantenimiento y Taller</div>
                  <div className="text-xs text-gray-500 mt-0.5">Unidad: <span className="font-semibold text-gray-700">{vehicleText}</span></div>
               </div>
            </div>

            {/* Table */}
            <div className="rounded-lg overflow-hidden border border-gray-300 mb-6">
               <table className="w-full text-xs text-left border-collapse table-fixed">
                  <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-extrabold text-[10px] border-b border-gray-300">
                     <tr>
                        <th className="px-3 py-2.5 w-12 text-center border-r border-gray-200">#</th>
                        <th className="px-4 py-2.5 w-[42%] border-r border-gray-200">ARTÍCULOS / REPUESTOS</th>
                        <th className="px-3 py-2.5 w-24 text-center border-r border-gray-200">CANTIDAD</th>
                        <th className="px-4 py-2.5">OBSERVACIÓN / DESTINO</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                     {order.details?.map((d, index) => (
                        <tr key={d.id} className="bg-white hover:bg-slate-50/50 break-inside-avoid">
                           <td className="px-3 py-3 text-center text-gray-500 font-bold border-r border-gray-200">{String(index + 1).padStart(2, '0')}</td>
                           <td className="px-4 py-3 border-r border-gray-200 font-semibold text-gray-800 text-xs">
                             {d.purchaseRequisition?.partNameOrDescription || 'Repuesto'}
                           </td>
                           <td className="px-3 py-3 text-center border-r border-gray-200">
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold text-xs font-mono">
                                {d.quantityOrdered} {(d.purchaseRequisition as any)?.unitOfMeasure?.code || 'und'}
                              </span>
                           </td>
                           <td className="px-4 py-3 text-gray-500 text-xs">
                              {d.purchaseRequisition?.observations ? (
                                <span className="text-gray-800 font-medium">{d.purchaseRequisition.observations}</span>
                              ) : d.purchaseRequisition?.serviceRequest?.description ? (
                                <span className="italic">{d.purchaseRequisition.serviceRequest.description.substring(0, 60)}</span>
                              ) : (
                                <span className="italic text-gray-400">Requisición aprobada</span>
                              )}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-8 mb-8 mt-10 break-inside-avoid">
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
            <div className="bg-slate-50 border border-gray-200 rounded-lg p-5 flex gap-6 break-inside-avoid">
               <div className="flex-1">
                  <h3 className="font-bold text-gray-800 text-sm mb-1">Uso Exclusivo del Proveedor</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Sello, Firma y Teléfono requerido para validar entrega en almacén.</p>
               </div>
               <div className="w-32 h-20 border-2 border-dashed border-gray-300 flex justify-center items-center text-gray-400 text-xs font-medium uppercase tracking-widest bg-white rounded">
                  Sello Aquí
               </div>
               <div className="flex-1 flex flex-col justify-end space-y-3">
                  <div className="border-b border-gray-300 flex items-end pb-1">
                     <span className="text-xs text-gray-500 w-16">Firma:</span>
                  </div>
                  <div className="border-b border-gray-300 flex items-end pb-1">
                     <span className="text-xs text-gray-500 w-16">Teléfono:</span>
                  </div>
               </div>
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[10px] text-gray-400 mt-6 pt-3 border-t border-gray-100 break-inside-avoid">
              Documento emitido formalmente por el sistema de compras y mantenimiento.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
