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

            const missingIds = reqIdList.filter(rid => !matchedInTicket.some(r => r.id === rid));
            if (missingIds.length > 0) {
              const allReqs = await purchasingService.getRequisitions();
              reqsToShow = allReqs.filter(r => reqIdSet.has(r.id));
            }
          } else {
            reqsToShow = ticketReqs;
          }
        } else {
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
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/purchasing')}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
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
        <div className="printable-sheet bg-white shadow-lg border border-gray-200 rounded-sm">
          
          {/* Top Header Section */}
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
                  {ownerNameDisplay.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Solicitud de Cotización</h1>
                <p className="text-slate-500 text-xs mt-0.5">
                  Departamento de Compras y Suministros &bull; {ownerNameDisplay}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-indigo-700">
                  <span>Documento Oficial de Requerimientos</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200 text-right min-w-[150px] shadow-xs">
              <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">N° REFERENCIA</div>
              <div className="text-base font-extrabold text-indigo-700 font-mono">{docNumber}</div>
              <div className="text-[11px] text-gray-500 mt-1 flex items-center justify-end gap-1 font-medium">
                <span>Fecha:</span>
                <span>{currentDate}</span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="border border-gray-200 rounded-lg p-3.5 bg-white">
                <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1">PROVEEDOR / DESTINATARIO</div>
                <div className="font-bold text-gray-800 text-sm">A QUIEN PUEDA INTERESAR / PROVEEDOR</div>
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
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg px-4 py-2 mb-5 text-xs text-indigo-900 flex items-center justify-between">
              <span><strong>Estimado Proveedor:</strong> Favor indicar marca ofrecida, disponibilidad de entrega inmediata o días, precio unitario y tiempo de garantía.</span>
              <span className="font-bold uppercase text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded ml-2 whitespace-nowrap">Validez: 5 a 15 días</span>
            </div>

            {/* Table */}
            <div className="rounded-lg overflow-hidden border border-gray-300 mb-6">
              <table className="w-full text-xs text-left border-collapse table-fixed">
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-extrabold text-[10px] border-b border-gray-300">
                  <tr>
                    <th className="px-3 py-2.5 w-12 text-center border-r border-gray-200">#</th>
                    <th className="px-4 py-2.5 w-[42%] border-r border-gray-200">ARTÍCULO / REPUESTO REQUERIDO</th>
                    <th className="px-3 py-2.5 w-24 text-center border-r border-gray-200">CANT. REQ.</th>
                    <th className="px-4 py-2.5">OBSERVACIONES / ESPECIFICACIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRequisitions.map((req, index) => {
                    const t = req.serviceRequestId ? ticketsMap[req.serviceRequestId] : null;
                    const veh = t?.vehicle || req.serviceRequest?.vehicle;
                    const trailer = t?.trailer || req.serviceRequest?.trailer;
                    const plate = veh?.licensePlate || trailer?.licensePlate;

                    return (
                      <tr key={req.id} className="bg-white hover:bg-slate-50/50 break-inside-avoid">
                        <td className="px-3 py-3 text-center text-gray-500 font-bold border-r border-gray-200">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-4 py-3 border-r border-gray-200">
                          <div className="font-bold text-gray-900 text-xs">
                            {req.partNameOrDescription}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span>Req #{req.id.toString().padStart(4, '0')}</span>
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
                        <td className="px-3 py-3 text-center border-r border-gray-200 font-extrabold text-gray-900 text-xs">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono">
                            {req.quantity} {(req as any).unitOfMeasure?.code || 'und'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-800 text-xs">
                          {req.observations ? (
                            <span className="font-medium text-gray-900 leading-relaxed">{req.observations}</span>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Sin observaciones</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-8 mb-8 mt-10 break-inside-avoid">
              <div>
                <div className="border-b border-gray-300 pb-2 mb-2 min-h-[40px] flex items-end"></div>
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
              Este documento representa una solicitud formal de cotización de repuestos e insumos para el mantenimiento de flota.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
