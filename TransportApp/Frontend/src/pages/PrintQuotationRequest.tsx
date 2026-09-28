import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { workshopService } from '../services/workshopService';
import { useAuthStore } from '../store/authStore';
import type { ServiceRequest, PurchaseRequisition } from '../types';
import { Printer, ArrowLeft, Loader2, Building2, Truck, Calendar, ShoppingCart } from 'lucide-react';

export default function PrintQuotationRequest() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedCompany = useAuthStore(state => state.selectedCompany);

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [filteredRequisitions, setFilteredRequisitions] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const data = await workshopService.getRequestById(Number(id));
        setRequest(data);

        const rawReqIds = searchParams.get('reqIds');
        const allReqs = data.requisitions || [];

        if (rawReqIds) {
          const idSet = new Set(rawReqIds.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0));
          const filtered = allReqs.filter(r => idSet.has(r.id));
          setFilteredRequisitions(filtered.length > 0 ? filtered : allReqs);
        } else {
          setFilteredRequisitions(allReqs);
        }
      } catch (error) {
        console.error('Error fetching service request for quote printing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900 text-gray-500">
        <Loader2 className="animate-spin text-indigo-600 mr-2" size={32} />
        <span>Cargando solicitud de cotización...</span>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-12 text-center text-red-500">
        <p className="font-bold text-lg">No se encontró el ticket de servicio.</p>
        <button
          onClick={() => navigate('/purchasing')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold"
        >
          Volver a Compras
        </button>
      </div>
    );
  }

  const unitPlate = request.vehicle?.licensePlate || request.trailer?.licensePlate || 'N/A';
  const unitDesc = request.vehicle 
    ? `${request.vehicle.brand || ''} ${request.vehicle.model || ''}`.trim() || 'Vehículo de Flota'
    : request.trailer?.type || 'Remolque de Flota';
  const ownerName = request.vehicle?.fleetOwner?.name || request.trailer?.fleetOwner?.name || selectedCompany?.name || 'Transporte';
  const currentDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-8 font-sans print:p-0 print:bg-white text-gray-900">
      <style>
        {`
          @media print {
            @page {
              size: portrait;
              margin: 10mm;
            }
            body {
              background: white;
            }
            .print-hidden {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="max-w-[850px] mx-auto">
        {/* Web Only Action Bar */}
        <div className="flex justify-between items-center gap-3 mb-6 print:hidden">
          <button 
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/purchasing')}
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <ArrowLeft size={16} /> Volver
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium mr-2">
              {filteredRequisitions.length} repuesto(s) en esta hoja
            </span>
            <button 
              onClick={() => window.print()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-bold text-sm transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer size={16} /> Imprimir Solicitud
            </button>
          </div>
        </div>

        {/* Paper Document */}
        <div className="bg-white print:shadow-none shadow-lg print:border-0 border border-gray-200 text-gray-900" style={{ minHeight: '1056px', position: 'relative' }}>
          
          {/* Top Section */}
          <div className="bg-slate-50 p-6 sm:p-8 flex justify-between items-start border-b border-gray-200">
            <div className="flex items-start gap-4">
              {selectedCompany?.logoUrl && (
                <img 
                  src={selectedCompany.logoUrl} 
                  alt="Logo" 
                  className="w-16 h-16 object-contain rounded border border-gray-200 bg-white p-1"
                />
              )}
              <div>
                <p className="text-[10px] font-extrabold text-indigo-700 tracking-widest uppercase mb-1">
                  {selectedCompany?.name || 'EMPRESA DE TRANSPORTE'} &bull; {selectedCompany?.rif || ''}
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
                  Solicitud de Cotización
                </h1>
                <p className="text-slate-500 mt-1 text-xs max-w-md leading-relaxed">
                  Petición formal de precios, disponibilidad y condiciones comerciales para adquisición de repuestos e insumos.
                </p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl shadow-xs border border-gray-200 text-right min-w-[170px]">
              <div className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mb-1">Documento No.</div>
              <div className="text-base font-extrabold text-indigo-700 font-mono">
                COT-OT#{request.id.toString().padStart(4, '0')}
              </div>
              <div className="text-[11px] text-gray-600 mt-1.5 flex items-center justify-end gap-1.5 font-medium">
                <Calendar size={13} className="text-gray-400" />
                <span>Fecha: {currentDate}</span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-3.5 bg-white">
                <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1">PROVEEDOR / CASA COMERCIAL</div>
                <div className="font-semibold text-gray-800 text-sm">A QUIEN PUEDA INTERESAR / PROVEEDOR GENERAL</div>
                <div className="text-xs text-gray-400 mt-1.5 border-b border-dashed border-gray-300 pb-1">
                  Nombre Vendedor / Tienda: _____________________________________
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3.5 bg-white">
                <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1">DATOS DE LA UNIDAD Y ORDEN</div>
                <div className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                  <span>🚛 Placa: {unitPlate}</span>
                  <span className="text-xs font-medium text-gray-500">({unitDesc})</span>
                </div>
                <div className="text-xs text-gray-500 mt-1.5">
                  Empresa: <strong className="text-gray-700">{ownerName}</strong> &bull; Ticket Taller: #{request.id.toString().padStart(4, '0')}
                </div>
              </div>
            </div>

            {/* Instruction Notice */}
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg px-4 py-2.5 mb-6 text-xs text-indigo-900 flex items-center justify-between">
              <span><strong>Estimado Proveedor:</strong> Favor indicar marca ofrecida, disponibilidad de entrega inmediata o días, precio unitario y tiempo de garantía.</span>
              <span className="font-bold uppercase text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded ml-2 whitespace-nowrap">Validez: 5 a 15 días</span>
            </div>

            {/* Table */}
            <div className="rounded-lg overflow-hidden border border-gray-300">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-extrabold text-[10px] border-b border-gray-300">
                  <tr>
                    <th className="px-3 py-3 w-10 text-center border-r border-gray-200">#</th>
                    <th className="px-4 py-3 border-r border-gray-200">ARTÍCULO / REPUESTO REQUERIDO</th>
                    <th className="px-3 py-3 w-24 text-center border-r border-gray-200">CANT. REQ.</th>
                    <th className="px-3 py-3 w-40 text-center border-r border-gray-200">MARCA / DISPONIBILIDAD<br/><span className="text-[8px] font-normal lowercase">(llenar por proveedor)</span></th>
                    <th className="px-3 py-3 w-28 text-center border-r border-gray-200">PRECIO UNIT. ($)<br/><span className="text-[8px] font-normal lowercase">(llenar por proveedor)</span></th>
                    <th className="px-3 py-3 w-28 text-center">TOTAL ($)<br/><span className="text-[8px] font-normal lowercase">(llenar por proveedor)</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRequisitions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">
                        No hay requisiciones especificadas en esta solicitud.
                      </td>
                    </tr>
                  ) : (
                    filteredRequisitions.map((req, index) => (
                      <tr key={req.id} className="bg-white hover:bg-slate-50/50">
                        <td className="px-3 py-3.5 text-center text-gray-500 font-bold border-r border-gray-200">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-4 py-3.5 border-r border-gray-200">
                          <div className="font-bold text-gray-900 text-[13px]">
                            {req.partNameOrDescription}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Requisición #{req.id.toString().padStart(4, '0')} &bull; OT #{request.id.toString().padStart(4, '0')}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-center border-r border-gray-200 font-extrabold text-gray-900 text-sm">
                          <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded font-mono">
                            {req.quantity} {(req as any).unitOfMeasure?.code || 'und'}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center border-r border-gray-200 bg-slate-50/40">
                          <div className="h-6 border-b border-dashed border-gray-400"></div>
                        </td>
                        <td className="px-3 py-3.5 text-center border-r border-gray-200 bg-slate-50/40">
                          <div className="h-6 border-b border-dashed border-gray-400"></div>
                        </td>
                        <td className="px-3 py-3.5 text-center bg-slate-50/40">
                          <div className="h-6 border-b border-dashed border-gray-400"></div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Provider Notes & Condition */}
            <div className="mt-8 border border-gray-200 rounded-lg p-4 bg-slate-50 text-xs">
              <div className="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">
                Condiciones Comerciales del Proveedor (Llenar al cotizar):
              </div>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div className="border-b border-gray-300 pb-1 text-gray-500">
                  Forma de Pago: ____________________
                </div>
                <div className="border-b border-gray-300 pb-1 text-gray-500">
                  Tiempo de Garantía: _______________
                </div>
                <div className="border-b border-gray-300 pb-1 text-gray-500">
                  Validez Oferta (Días): _____________
                </div>
              </div>
            </div>

            {/* Signatures & Seal */}
            <div className="grid grid-cols-2 gap-8 mt-16 mb-4">
              <div>
                <div className="border-b border-gray-400 pb-2 mb-2 min-h-[45px] flex items-end">
                </div>
                <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">SOLICITADO POR</div>
                <div className="font-bold text-xs text-gray-800">Departamento de Compras / Taller Mecánico</div>
                <div className="text-[10px] text-gray-500">Firma del Asistente / Responsable</div>
              </div>

              <div>
                <div className="border-b border-gray-400 pb-2 mb-2 min-h-[45px] flex items-end">
                </div>
                <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">COTIZADO POR (PROVEEDOR)</div>
                <div className="font-bold text-xs text-gray-800">Firma, Nombre y Sello de la Empresa</div>
                <div className="text-[10px] text-gray-500">Teléfono / Persona de Contacto: ___________________</div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[10px] text-gray-400 mt-12 pt-4 border-t border-gray-100">
              Este documento representa una solicitud de precios y condiciones comerciales, no constituye un compromiso de compra hasta la emisión formal de la correspondiente Orden de Compra.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
