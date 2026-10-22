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

  if (loading) return <div className="p-8 text-center text-gray-700 font-semibold">Cargando documento...</div>;
  if (!order) return <div className="p-8 text-center text-red-600 font-bold">No se encontró la orden de compra.</div>;

  // Extract unique vehicles associated with this PO's requisitions
  const vehicles = Array.from(new Set(order.details?.map(d => {
    const v = d.purchaseRequisition?.serviceRequest?.vehicle;
    return v ? `${v.brand} ${v.model} (${v.licensePlate})` : null;
  }).filter(Boolean)));
  const vehicleText = vehicles.length > 0 ? vehicles.join(', ') : 'Múltiples / Taller General';

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 font-sans print:p-0 print:m-0 print:bg-white text-black">
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
              min-height: 258mm !important;
              width: 100% !important;
              max-width: 100% !important;
              color: #000000 !important;
            }
          }
        `}
      </style>
      <div className="max-w-[850px] mx-auto print:max-w-none print:w-full">
        
        {/* Web Only Action Bar */}
        <div className="flex justify-between items-center gap-3 mb-6 print:hidden">
          <button 
            onClick={() => navigate('/purchasing')}
            className="bg-white text-gray-800 border border-gray-300 px-4 py-2 rounded-md font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <button 
            onClick={() => window.print()}
            className="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-md font-bold text-sm transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Printer size={16} /> Imprimir Orden
          </button>
        </div>

        {/* Paper Document */}
        <div className="printable-sheet bg-white shadow-lg border border-gray-300 rounded-sm flex flex-col min-h-[980px] text-black">
          
          {/* Top Section */}
          <div className="bg-gray-50 p-6 sm:p-8 flex justify-between items-start border-b-2 border-gray-900 shrink-0">
            <div className="flex items-start gap-4">
              {selectedCompany?.logoUrl ? (
                <img 
                  src={selectedCompany.logoUrl} 
                  alt={selectedCompany.name || 'Logo'} 
                  className="h-16 w-auto object-contain print:h-14"
                />
              ) : (
                <div className="h-14 w-14 rounded bg-black text-white flex items-center justify-center font-black text-xl">
                  {(selectedCompany?.name || 'OC').substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight uppercase">Orden de Compra</h1>
                <p className="text-gray-700 font-medium text-sm mt-0.5">
                  Solicitud formal de insumos y servicios para las operaciones de mantenimiento de la flota.
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm font-extrabold text-black uppercase">
                  <span>{selectedCompany?.name || 'Transporte'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-gray-400 text-right min-w-[175px]">
              <div className="text-xs font-extrabold text-gray-700 tracking-wider uppercase mb-0.5">DOCUMENT ID</div>
              <div className="text-lg font-black text-black font-mono">#{order.orderNumber}</div>
              <div className="text-xs text-gray-800 mt-1 flex items-center justify-end gap-1 font-bold">
                <span>Fecha:</span>
                <span>{new Date(order.dateCreated).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
            {/* Top Content */}
            <div>
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="border border-gray-400 rounded-lg p-4 bg-white">
                    <div className="text-xs font-extrabold text-gray-700 tracking-wider uppercase mb-1">PROVEEDOR</div>
                    <div className="font-extrabold text-black text-base">{order.supplier?.name || 'Proveedor General'}</div>
                    {order.supplier?.taxId && (
                      <div className="text-sm font-semibold text-gray-800 mt-0.5">RIF / ID: <span className="font-bold text-black">{order.supplier.taxId}</span></div>
                    )}
                 </div>
                 <div className="border border-gray-400 rounded-lg p-4 bg-white">
                    <div className="text-xs font-extrabold text-gray-700 tracking-wider uppercase mb-1">DEPARTAMENTO / DESTINO</div>
                    <div className="font-extrabold text-black text-base">Mantenimiento y Taller</div>
                    <div className="text-sm font-semibold text-gray-800 mt-0.5">Unidad: <span className="font-extrabold text-black">{vehicleText}</span></div>
                 </div>
              </div>

              {/* Table */}
              <div className="rounded-lg overflow-hidden border border-gray-400 mb-6">
                 <table className="w-full text-sm text-left border-collapse table-fixed">
                    <thead className="bg-gray-100 text-black uppercase tracking-wider font-extrabold text-xs border-b border-gray-400">
                       <tr>
                          <th className="px-3 py-3 w-14 text-center border-r border-gray-300">#</th>
                          <th className="px-4 py-3 w-[44%] border-r border-gray-300">ARTÍCULOS / REPUESTOS</th>
                          <th className="px-3 py-3 w-28 text-center border-r border-gray-300">CANTIDAD</th>
                          <th className="px-4 py-3">OBSERVACIÓN / DESTINO</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                       {order.details?.map((d, index) => (
                          <tr key={d.id} className="bg-white break-inside-avoid">
                             <td className="px-3 py-3 text-center text-black font-extrabold border-r border-gray-300 font-mono text-sm">{String(index + 1).padStart(2, '0')}</td>
                             <td className="px-4 py-3 border-r border-gray-300 font-bold text-black text-sm leading-snug">
                               {d.purchaseRequisition?.partNameOrDescription || 'Repuesto'}
                             </td>
                             <td className="px-3 py-3 text-center border-r border-gray-300">
                                <span className="bg-gray-100 border border-gray-400 text-black px-2.5 py-1 rounded font-extrabold text-sm font-mono inline-block">
                                  {d.quantityOrdered} {(d.purchaseRequisition as any)?.unitOfMeasure?.code || 'und'}
                                </span>
                             </td>
                             <td className="px-4 py-3 text-black text-sm leading-snug">
                                {d.purchaseRequisition?.observations ? (
                                  <span className="text-black font-semibold">{d.purchaseRequisition.observations}</span>
                                ) : d.purchaseRequisition?.serviceRequest?.description ? (
                                  <span className="italic text-gray-800 font-medium">{d.purchaseRequisition.serviceRequest.description.substring(0, 80)}</span>
                                ) : (
                                  <span className="italic text-gray-700">Requisición aprobada</span>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </div>

            {/* Bottom Footer Section (Signatures & Provider Box anchored at bottom) */}
            <div className="mt-auto pt-6 break-inside-avoid">
              {/* Signatures */}
              <div className="grid grid-cols-3 gap-8 mb-6">
                 <div>
                    <div className="border-b-2 border-gray-800 pb-2 mb-2 min-h-[38px] flex items-end">
                    </div>
                    <div className="text-xs font-extrabold text-gray-700 tracking-wider uppercase mb-0.5">AUTORIZADO POR</div>
                    <div className="font-bold text-sm text-black">Gerencia de Mantenimiento</div>
                 </div>
                 <div>
                    <div className="border-b-2 border-gray-800 pb-2 mb-2 min-h-[38px] flex items-end"></div>
                    <div className="text-xs font-extrabold text-gray-700 tracking-wider uppercase mb-0.5">MECÁNICO SOLICITANTE</div>
                    <div className="font-bold text-sm text-black"></div>
                 </div>
                 <div>
                    <div className="border-b-2 border-gray-800 pb-2 mb-2 min-h-[38px] flex items-end"></div>
                    <div className="text-xs font-extrabold text-gray-700 tracking-wider uppercase mb-0.5">CHOFER / ALMACÉN</div>
                    <div className="font-bold text-sm text-black"></div>
                 </div>
              </div>

              {/* Provider Box */}
              <div className="bg-gray-50 border border-gray-400 rounded-lg p-4 flex gap-6">
                 <div className="flex-1">
                    <h3 className="font-extrabold text-black text-sm mb-1">Uso Exclusivo del Proveedor</h3>
                    <p className="text-xs font-medium text-gray-700 leading-relaxed">Sello, Firma y Teléfono requerido para validar entrega en almacén.</p>
                 </div>
                 <div className="w-32 h-16 border-2 border-dashed border-gray-400 flex justify-center items-center text-gray-700 text-xs font-bold uppercase tracking-widest bg-white rounded">
                    Sello Aquí
                 </div>
                 <div className="flex-1 flex flex-col justify-end space-y-3">
                    <div className="border-b border-gray-500 flex items-end pb-1">
                       <span className="text-xs font-bold text-black w-20">Firma:</span>
                    </div>
                    <div className="border-b border-gray-500 flex items-end pb-1">
                       <span className="text-xs font-bold text-black w-20">Teléfono:</span>
                    </div>
                 </div>
              </div>

              {/* Footer Notice */}
              <div className="text-center text-xs font-medium text-gray-700 mt-4 pt-2 border-t border-gray-300">
                Documento emitido formalmente por el sistema de compras y mantenimiento.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
