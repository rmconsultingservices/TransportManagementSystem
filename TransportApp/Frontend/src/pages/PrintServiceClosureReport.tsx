import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workshopService } from '../services/workshopService';
import { useAuthStore } from '../store/authStore';
import type { ServiceRequest } from '../types';
import { formatSparePartName } from '../types';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';

export default function PrintServiceClosureReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const selectedCompany = useAuthStore(state => state.selectedCompany);
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        if (id) {
          const data = await workshopService.getRequestById(parseInt(id));
          setRequest(data);
        }
      } catch (error) {
        console.error('Error fetching ticket for print:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-gray-500">
        <Loader2 className="animate-spin text-indigo-600 mr-2" size={32} />
        <span>Cargando acta de cierre de ODT...</span>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 text-center text-red-500">
        <p className="font-bold">No se encontró el reporte técnico solicitado.</p>
        <button 
          onClick={() => navigate('/workshop')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded text-sm cursor-pointer"
        >
          Volver al Taller
        </button>
      </div>
    );
  }

  const reqDate = request.execution?.dateCompleted ? new Date(request.execution.dateCompleted) : new Date(request.dateRequested);
  const formattedDate = reqDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const ownerCompanyName = request.vehicle?.fleetOwner?.name || request.trailer?.fleetOwner?.name || selectedCompany?.name || 'N/A';

  // Classify physical spare parts vs external outsourced services
  const allUsedItems = request.execution?.usedSpareParts || [];
  const physicalParts = allUsedItems.filter(p => p.itemType !== 'S' && p.sparePart?.itemType !== 'Servicio');
  const externalServices = allUsedItems.filter(p => p.itemType === 'S' || p.sparePart?.itemType === 'Servicio');

  const totalPartsCost = physicalParts.reduce((acc: number, part: any) => acc + (part.quantity * (part.unitCost ?? part.sparePart?.unitCost ?? 0)), 0);
  const totalServicesCost = externalServices.reduce((acc: number, srv: any) => acc + (srv.quantity * (srv.unitCost ?? srv.sparePart?.unitCost ?? 0)), 0);
  const totalCost = totalPartsCost + totalServicesCost;

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
            onClick={() => navigate('/workshop')}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <button 
            onClick={() => window.print()} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-bold text-sm transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Printer size={16} /> Imprimir Cierre ODT
          </button>
        </div>

        {/* Paper Document */}
        <div className="printable-sheet bg-white shadow-lg border border-gray-200 rounded-sm p-6 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              {selectedCompany?.logoUrl ? (
                <img src={selectedCompany.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
              ) : (
                <div className="h-12 w-12 rounded bg-indigo-700 text-white flex items-center justify-center font-black text-xl">
                  {(selectedCompany?.name || 'T').substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-[9px] font-bold text-indigo-700 tracking-widest uppercase mb-0.5">Control de Taller &bull; Liquidación de Mantenimiento</p>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">Acta de Cierre de Trabajo (ODT)</h1>
                <h2 className="text-xs font-semibold text-gray-500 mt-0.5">Liquidación técnica de repuestos y servicios aplicados</h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Orden de Trabajo</p>
              <h3 className="text-lg font-bold text-indigo-700 mb-1">#{request.id.toString().padStart(4, '0')}</h3>
              <span className="inline-flex bg-emerald-100 text-emerald-800 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                {request.status}
              </span>
            </div>
          </div>

          {/* Info Boxes */}
          <div className="grid grid-cols-4 gap-0 border border-gray-200 rounded-md mb-6 bg-white shadow-xs overflow-hidden text-xs">
            <div className="p-3 border-r border-gray-200">
              <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Vehículo</p>
              <p className="font-bold text-gray-900 uppercase">{request.vehicle?.brand} {request.vehicle?.model}</p>
            </div>
            <div className="p-3 border-r border-gray-200">
              <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Placa / Unidad</p>
              <p className="font-bold text-gray-900 uppercase">{request.vehicle?.licensePlate || request.trailer?.licensePlate || 'N/A'}</p>
            </div>
            <div className="p-3 border-r border-gray-200">
              <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Fecha Cierre</p>
              <p className="font-bold text-gray-900">{formattedDate}</p>
            </div>
            <div className="p-3">
              <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Empresa Flota</p>
              <p className="font-bold text-gray-900 uppercase">{ownerCompanyName}</p>
            </div>
          </div>

          {/* Activities / Problem */}
          <div className="mb-2 flex items-end justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">1. Actividades y Protocolo Realizado</h3>
            <span className="text-[10px] font-medium text-gray-500">{request.activities?.length || 0} Registros</span>
          </div>

          <div className="mb-6 overflow-hidden rounded-md border border-gray-200">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-100">
                  <th className="px-4 py-2 text-[9px] font-bold text-gray-600 tracking-widest uppercase">Descripción de la Avería / Trabajo Realizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {request.activities && request.activities.length > 0 ? (
                  request.activities.map((act, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-2 text-xs font-semibold text-gray-800">{act.description}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-2 text-xs text-gray-500 italic">No se detallaron renglones específicos de actividad.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Parts Consumed */}
          <div className="mb-2 flex items-end justify-between">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">2. Repuestos Consumidos de Almacén</h3>
            <span className="text-[10px] font-medium text-gray-500">{physicalParts.length} Ítems</span>
          </div>

          <div className="mb-6 overflow-hidden rounded-md border border-gray-200">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-100">
                  <th className="px-4 py-2 text-[9px] font-bold text-gray-600 tracking-widest uppercase w-28">Código</th>
                  <th className="px-4 py-2 text-[9px] font-bold text-gray-600 tracking-widest uppercase">Repuesto / Insumo</th>
                  <th className="px-4 py-2 text-[9px] font-bold text-gray-600 tracking-widest uppercase text-right w-20">Cant.</th>
                  <th className="px-4 py-2 text-[9px] font-bold text-gray-600 tracking-widest uppercase text-right w-28">Costo Unit.</th>
                  <th className="px-4 py-2 text-[9px] font-bold text-gray-600 tracking-widest uppercase text-right w-28">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {physicalParts.length > 0 ? (
                  physicalParts.map((usp: any, idx: number) => {
                    const unitCost = usp.unitCost ?? usp.sparePart?.unitCost ?? 0;
                    const subTotal = usp.quantity * unitCost;
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-2 text-xs font-mono text-gray-700">{usp.sparePart?.code || '---'}</td>
                        <td className="px-4 py-2 text-xs text-gray-800">{usp.description || formatSparePartName(usp.sparePart)}</td>
                        <td className="px-4 py-2 text-xs font-semibold text-gray-800 text-right font-mono">{usp.quantity}</td>
                        <td className="px-4 py-2 text-xs text-gray-600 text-right font-mono">${unitCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="px-4 py-2 text-xs font-bold text-gray-900 text-right font-mono">${subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-2 text-xs text-gray-500 italic text-center">No se registró el uso de repuestos de almacén.</td>
                  </tr>
                )}
              </tbody>
              {physicalParts.length > 0 && (
                <tfoot>
                  <tr className="border-t border-gray-200 bg-slate-50">
                    <td colSpan={4} className="px-4 py-2 text-[10px] font-bold text-gray-700 tracking-widest uppercase text-right">Subtotal Repuestos:</td>
                    <td className="px-4 py-2 text-xs font-black text-indigo-700 text-right font-mono">${totalPartsCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* External Services Consumed */}
          {externalServices.length > 0 && (
            <>
              <div className="mb-2 mt-4 flex items-end justify-between">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">3. Servicios y Trabajos Externos</h3>
                <span className="text-[10px] font-medium text-gray-500">{externalServices.length} Ítems</span>
              </div>

              <div className="mb-6 overflow-hidden rounded-md border border-gray-200">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 bg-slate-100">
                      <th className="px-4 py-2 text-[9px] font-bold text-gray-600 tracking-widest uppercase">Descripción del Trabajo / Servicio</th>
                      <th className="px-4 py-2 text-[9px] font-bold text-gray-600 tracking-widest uppercase">Proveedor / Factura</th>
                      <th className="px-4 py-2 text-[9px] font-bold text-gray-600 tracking-widest uppercase text-right w-20">Cant.</th>
                      <th className="px-4 py-2 text-[9px] font-bold text-gray-600 tracking-widest uppercase text-right w-28">P. Unit.</th>
                      <th className="px-4 py-2 text-[9px] font-bold text-gray-600 tracking-widest uppercase text-right w-28">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {externalServices.map((srv: any, idx: number) => {
                      const unitCost = srv.unitCost ?? srv.sparePart?.unitCost ?? 0;
                      const subTotal = srv.quantity * unitCost;
                      const supplierName = srv.purchaseInvoiceDetail?.purchaseInvoice?.supplier?.name;
                      const invNumber = srv.purchaseInvoiceDetail?.purchaseInvoice?.invoiceNumber;
                      const sourceText = supplierName ? `${supplierName} (Fact. #${invNumber})` : 'Servicio Tercerizado';
                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-4 py-2 text-xs font-semibold text-gray-800">{srv.description || formatSparePartName(srv.sparePart) || 'Servicio Externo'}</td>
                          <td className="px-4 py-2 text-xs text-gray-600">{sourceText}</td>
                          <td className="px-4 py-2 text-xs font-semibold text-gray-800 text-right font-mono">{srv.quantity}</td>
                          <td className="px-4 py-2 text-xs text-gray-600 text-right font-mono">${unitCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                          <td className="px-4 py-2 text-xs font-bold text-gray-900 text-right font-mono">${subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200 bg-slate-50">
                      <td colSpan={4} className="px-4 py-2 text-[10px] font-bold text-gray-700 tracking-widest uppercase text-right">Subtotal Servicios:</td>
                      <td className="px-4 py-2 text-xs font-black text-indigo-700 text-right font-mono">${totalServicesCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}

          {/* Resumen Total General ODT */}
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center break-inside-avoid">
            <div className="text-xs text-gray-600 space-y-0.5">
              <div>Subtotal Repuestos Almacén: <span className="font-semibold text-gray-900 font-mono">${totalPartsCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
              {externalServices.length > 0 && (
                <div>Subtotal Servicios Externos: <span className="font-semibold text-gray-900 font-mono">${totalServicesCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
              )}
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Costo Total ODT</p>
              <p className="text-xl font-black text-indigo-700 font-mono">${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 mt-12 mb-4 px-10 break-inside-avoid">
            <div className="text-center">
              <div className="border-t border-gray-400 w-full mb-2"></div>
              <p className="text-[9px] font-bold text-gray-600 tracking-widest uppercase mb-0.5">Mecánico Responsable</p>
              <p className="text-[11px] font-medium italic text-indigo-800">{request.mechanic?.name || ''}</p>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 w-full mb-2"></div>
              <p className="text-[9px] font-bold text-gray-600 tracking-widest uppercase mb-0.5">Chofer / Operador</p>
              <p className="text-[11px] font-medium italic text-indigo-800">{request.driver?.name || ''}</p>
            </div>
          </div>
          
          {/* Footer Disclaimer */}
          <div className="text-center mt-6 pt-3 border-t border-gray-100 break-inside-avoid">
            <p className="text-[7px] text-gray-400">Este reporte es un documento oficial de {ownerCompanyName}. Prohibida su alteración. Generado digitalmente por el Sistema de Flota.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
