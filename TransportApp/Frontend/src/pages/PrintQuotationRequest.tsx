import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { workshopService } from '../services/workshopService';
import { purchasingService } from '../services/purchasingService';
import { useAuthStore } from '../store/authStore';
import type { ServiceRequest, PurchaseRequisition } from '../types';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';

export default function PrintQuotationRequest() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedCompany = useAuthStore(state => state.selectedCompany);

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [ticketsMap, setTicketsMap] = useState<{ [id: number]: ServiceRequest }>({});
  const [filteredRequisitions, setFilteredRequisitions] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotationData = async () => {
      try {
        setLoading(true);
        const rawReqIds = searchParams.get('reqIds');
        const reqIdList = rawReqIds
          ? rawReqIds.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0)
          : [];
        const reqIdSet = new Set(reqIdList);

        let reqsToShow: PurchaseRequisition[] = [];
        let singleTicket: ServiceRequest | null = null;
        const loadedTickets: { [id: number]: ServiceRequest } = {};

        // 1. If id is a valid numeric ID, try to load that ServiceRequest
        const numericTicketId = (!id || id === 'all') ? null : Number(id);
        if (numericTicketId && !isNaN(numericTicketId) && numericTicketId > 0) {
          try {
            singleTicket = await workshopService.getRequestById(numericTicketId);
            if (singleTicket) {
              loadedTickets[singleTicket.id] = singleTicket;
            }
          } catch (e) {
            console.warn('Could not fetch ticket for id:', numericTicketId, e);
          }
        }

        // 2. Determine requisitions to display
        if (singleTicket && (!rawReqIds || singleTicket.requisitions?.some(r => reqIdSet.has(r.id)))) {
          const ticketReqs = singleTicket.requisitions || [];
          if (reqIdSet.size > 0) {
            const matchedInTicket = ticketReqs.filter(r => reqIdSet.has(r.id));
            reqsToShow = matchedInTicket;

            // If there were requested IDs that were NOT in this ticket (e.g. selected across multiple tickets),
            // fetch all requisitions to ensure all requested IDs are included!
            const missingIds = reqIdList.filter(rid => !matchedInTicket.some(r => r.id === rid));
            if (missingIds.length > 0) {
              const allReqs = await purchasingService.getRequisitions();
              reqsToShow = allReqs.filter(r => reqIdSet.has(r.id));
            }
          } else {
            reqsToShow = ticketReqs;
          }
        } else {
          // No single ticket or 'all' passed: fetch all requisitions
          const allReqs = await purchasingService.getRequisitions();
          if (reqIdSet.size > 0) {
            reqsToShow = allReqs.filter(r => reqIdSet.has(r.id));
          } else if (singleTicket) {
            reqsToShow = singleTicket.requisitions || [];
          } else {
            reqsToShow = allReqs;
          }
        }

        // 3. For any requisitions that have a serviceRequestId, load their tickets in parallel
        const neededTicketIds = Array.from(new Set(reqsToShow.map(r => r.serviceRequestId).filter(Boolean))) as number[];
        const missingTicketIds = neededTicketIds.filter(tid => !loadedTickets[tid]);

        if (missingTicketIds.length > 0) {
          await Promise.all(missingTicketIds.map(async tid => {
            try {
              const t = await workshopService.getRequestById(tid);
              if (t) loadedTickets[tid] = t;
            } catch (err) {
              console.warn(`Could not load ticket #${tid}:`, err);
            }
          }));
        }

        if (!singleTicket && neededTicketIds.length === 1 && loadedTickets[neededTicketIds[0]]) {
          singleTicket = loadedTickets[neededTicketIds[0]];
        }

        setRequest(singleTicket);
        setTicketsMap(loadedTickets);
        setFilteredRequisitions(reqsToShow);
      } catch (error) {
        console.error('Error fetching quotation request data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotationData();
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900 text-gray-500">
        <Loader2 className="animate-spin text-indigo-600 mr-2" size={32} />
        <span>Cargando solicitud de cotización...</span>
      </div>
    );
  }

  if (filteredRequisitions.length === 0) {
    return (
      <div className="p-12 text-center text-red-500">
        <p className="font-bold text-lg">No se encontraron requisiciones especificadas para imprimir.</p>
        <button
          onClick={() => navigate('/purchasing')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold cursor-pointer"
        >
          Volver a Compras
        </button>
      </div>
    );
  }

  // Resolve metadata for header
  const distinctTicketIds = Array.from(new Set(filteredRequisitions.map(r => r.serviceRequestId).filter(Boolean))) as number[];

  const distinctVehicles = Array.from(new Set(
    filteredRequisitions.map(r => {
      const t = r.serviceRequestId ? ticketsMap[r.serviceRequestId] : null;
      const v = t?.vehicle || r.serviceRequest?.vehicle;
      const tr = t?.trailer || r.serviceRequest?.trailer;
      if (v) return `${v.licensePlate} (${v.brand || ''} ${v.model || ''})`.trim();
      if (tr) return `${tr.licensePlate} (${tr.type || 'Remolque'})`.trim();
      return null;
    }).filter(Boolean)
  )) as string[];

  const distinctOwners = Array.from(new Set(
    filteredRequisitions.map(r => {
      const t = r.serviceRequestId ? ticketsMap[r.serviceRequestId] : null;
      return t?.vehicle?.fleetOwner?.name || t?.trailer?.fleetOwner?.name || r.serviceRequest?.vehicle?.fleetOwner?.name || selectedCompany?.name;
    }).filter(Boolean)
  )) as string[];

  const currentDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const docNumber = distinctTicketIds.length === 1 
    ? `COT-OT#${distinctTicketIds[0].toString().padStart(4, '0')}`
    : `COT-LOTE-${currentDate.replace(/\//g, '')}`;

  const unitPlateDisplay = distinctVehicles.length === 1
    ? `Placa: ${distinctVehicles[0]}`
    : distinctVehicles.length > 1
      ? `Múltiples Unidades (${distinctVehicles.join(', ')})`
      : 'Flota General / Taller';

  const ticketDisplay = distinctTicketIds.length === 1
    ? `#${distinctTicketIds[0].toString().padStart(4, '0')}`
    : distinctTicketIds.length > 1
      ? `Múltiples OTs (${distinctTicketIds.map(t => '#' + t.toString().padStart(4, '0')).join(', ')})`
      : 'General';

  const ownerNameDisplay = distinctOwners.length === 1
    ? distinctOwners[0]
    : (selectedCompany?.name || 'Transporte');

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-8 font-sans print:p-0 print:bg-white text-gray-900">
      <style>
        {`
          @page {
            size: portrait;
            margin: 10mm;
          }
          @media print {
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
          <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
              <div className="flex items-center gap-4">
                {selectedCompany?.logoUrl ? (
                  <img src={selectedCompany.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                ) : (
                  <div className="w-14 h-14 bg-indigo-900 text-white flex items-center justify-center font-bold text-xl rounded">
                    {selectedCompany?.name ? selectedCompany.name.substring(0, 2).toUpperCase() : 'TR'}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-black text-indigo-950 uppercase tracking-tight">
                    {selectedCompany?.name || 'EMPRESA DE TRANSPORTE'}
                  </h1>
                  {selectedCompany?.rif && (
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      RIF: {selectedCompany.rif}
                    </p>
                  )}
                  <h2 className="text-base font-bold text-gray-800 mt-1">
                    SOLICITUD DE COTIZACIÓN DE REPUESTOS / SERVICIOS
                  </h2>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block bg-indigo-50 border border-indigo-200 rounded px-3 py-1.5 text-right">
                  <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest">DOCUMENTO NO.</div>
                  <div className="text-base font-black text-indigo-950 font-mono tracking-tight">
                    {docNumber}
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-medium mt-1.5">
                  Fecha Emisión: <strong>{currentDate}</strong>
                </div>
              </div>
            </div>

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
                  <span>{unitPlateDisplay}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1.5">
                  Empresa: <strong className="text-gray-700">{ownerNameDisplay}</strong> &bull; Ticket Taller: {ticketDisplay}
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
                    <th className="px-3 py-3 w-12 text-center border-r border-gray-200">#</th>
                    <th className="px-4 py-3 w-[45%] border-r border-gray-200">ARTÍCULO / REPUESTO REQUERIDO</th>
                    <th className="px-3 py-3 w-28 text-center border-r border-gray-200">CANT. REQ.</th>
                    <th className="px-4 py-3">OBSERVACIONES / ESPECIFICACIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRequisitions.map((req, index) => {
                    const t = req.serviceRequestId ? ticketsMap[req.serviceRequestId] : null;
                    const veh = t?.vehicle || req.serviceRequest?.vehicle;
                    const trailer = t?.trailer || req.serviceRequest?.trailer;
                    const plate = veh?.licensePlate || trailer?.licensePlate;

                    return (
                      <tr key={req.id} className="bg-white hover:bg-slate-50/50">
                        <td className="px-3 py-3.5 text-center text-gray-500 font-bold border-r border-gray-200">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-4 py-3.5 border-r border-gray-200">
                          <div className="font-bold text-gray-900 text-[13px]">
                            {req.partNameOrDescription}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span>Requisición #{req.id.toString().padStart(4, '0')}</span>
                            {req.serviceRequestId && (
                              <>
                                <span>&bull;</span>
                                <span className="font-medium text-indigo-700">OT #{req.serviceRequestId.toString().padStart(4, '0')}</span>
                              </>
                            )}
                            {plate && (
                              <>
                                <span>&bull;</span>
                                <span className="font-mono font-semibold text-gray-700">Placa: {plate}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-center border-r border-gray-200 font-extrabold text-gray-900 text-sm">
                          <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded font-mono">
                            {req.quantity} {(req as any).unitOfMeasure?.code || 'und'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-800 text-xs">
                          {req.observations ? (
                            <span className="font-medium text-gray-900 leading-relaxed">{req.observations}</span>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Sin observaciones</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-center border-r border-gray-200 bg-slate-50/40">
                          <div className="h-6 border-b border-dashed border-gray-400"></div>
                        </td>
                        <td className="px-3 py-3.5 text-center bg-slate-50/40">
                          <div className="h-6 border-b border-dashed border-gray-400"></div>
                        </td>
                      </tr>
                    );
                  })}
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
