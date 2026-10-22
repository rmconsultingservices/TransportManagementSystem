import { useEffect, useState } from 'react';
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

  const [, setRequest] = useState<ServiceRequest | null>(null);
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
      <div className="flex h-screen items-center justify-center bg-white text-gray-700">
        <Loader2 className="animate-spin text-gray-900 mr-2" size={32} />
        <span className="font-semibold">Cargando solicitud de cotización...</span>
      </div>
    );
  }

  if (filteredRequisitions.length === 0) {
    return (
      <div className="p-12 text-center text-red-600">
        <p className="font-bold text-lg">No se encontraron requisiciones especificadas para imprimir.</p>
        <button
          onClick={() => navigate('/purchasing')}
          className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-semibold cursor-pointer"
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
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/purchasing')}
            className="bg-white text-gray-800 border border-gray-300 px-4 py-2 rounded-md font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <ArrowLeft size={16} /> Volver
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 font-semibold mr-2">
              {filteredRequisitions.length} repuesto(s) en esta hoja
            </span>
            <button 
              onClick={() => window.print()}
              className="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-md font-bold text-sm transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer size={16} /> Imprimir Solicitud
            </button>
          </div>
        </div>

        {/* Paper Document */}
        <div className="printable-sheet bg-white shadow-lg border border-gray-300 rounded-sm flex flex-col min-h-[980px] text-black">
          
          {/* Top Header Section */}
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
                  {ownerNameDisplay.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight uppercase">Solicitud de Cotización</h1>
                <p className="text-gray-700 font-semibold text-sm mt-0.5">
                  Departamento de Compras y Suministros &bull; {ownerNameDisplay}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs font-extrabold text-black uppercase tracking-wider">
                  <span>Documento Oficial de Requerimientos</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-gray-400 text-right min-w-[175px]">
              <div className="text-xs font-extrabold text-gray-700 tracking-wider uppercase mb-0.5">N° REFERENCIA</div>
              <div className="text-lg font-black text-black font-mono">{docNumber}</div>
              <div className="text-xs text-gray-800 mt-1 flex items-center justify-end gap-1 font-bold">
                <span>Fecha:</span>
                <span>{currentDate}</span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
            {/* Top Content (Cards, Notice, Table) */}
            <div>
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="border border-gray-400 rounded-lg p-4 bg-white">
                  <div className="text-xs font-extrabold text-gray-700 tracking-wider uppercase mb-1">PROVEEDOR / DESTINATARIO</div>
                  <div className="font-extrabold text-black text-base">A QUIEN PUEDA INTERESAR / PROVEEDOR</div>
                  <div className="text-xs font-semibold text-gray-700 mt-2 border-b border-dashed border-gray-400 pb-1">
                    Nombre Vendedor / Tienda: _____________________________________
                  </div>
                </div>

                <div className="border border-gray-400 rounded-lg p-4 bg-white">
                  <div className="text-xs font-extrabold text-gray-700 tracking-wider uppercase mb-1">DATOS DE LA UNIDAD Y ORDEN</div>
                  <div className="font-extrabold text-black text-base flex items-center gap-2">
                    <span>{unitPlateDisplay}</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 mt-1.5">
                    Empresa: <strong className="font-extrabold text-black">{ownerNameDisplay}</strong> &bull; Ticket Taller: <strong className="font-extrabold text-black">{ticketDisplay}</strong>
                  </div>
                </div>
              </div>

              {/* Instruction Notice */}
              <div className="bg-gray-100 border border-gray-400 rounded-lg px-4 py-2.5 mb-5 text-xs font-medium text-black flex items-center justify-between">
                <span><strong className="font-extrabold">Estimado Proveedor:</strong> Favor indicar marca ofrecida, disponibilidad de entrega inmediata o días, precio unitario y tiempo de garantía.</span>
                <span className="font-extrabold uppercase text-xs bg-white border border-gray-400 text-black px-2.5 py-0.5 rounded ml-2 whitespace-nowrap">Validez: 5 a 15 días</span>
              </div>

              {/* Table */}
              <div className="rounded-lg overflow-hidden border border-gray-400 mb-6">
                <table className="w-full text-sm text-left border-collapse table-fixed">
                  <thead className="bg-gray-100 text-black uppercase tracking-wider font-extrabold text-xs border-b border-gray-400">
                    <tr>
                      <th className="px-3 py-3 w-14 text-center border-r border-gray-300">#</th>
                      <th className="px-4 py-3 w-[44%] border-r border-gray-300">ARTÍCULO / REPUESTO REQUERIDO</th>
                      <th className="px-3 py-3 w-28 text-center border-r border-gray-300">CANT. REQ.</th>
                      <th className="px-4 py-3">OBSERVACIONES / ESPECIFICACIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300">
                    {filteredRequisitions.map((req, index) => {
                      const t = req.serviceRequestId ? ticketsMap[req.serviceRequestId] : null;
                      const veh = t?.vehicle || req.serviceRequest?.vehicle;
                      const trailer = t?.trailer || req.serviceRequest?.trailer;
                      const plate = veh?.licensePlate || trailer?.licensePlate;

                      return (
                        <tr key={req.id} className="bg-white break-inside-avoid">
                          <td className="px-3 py-3 text-center text-black font-extrabold border-r border-gray-300 font-mono text-sm">
                            {String(index + 1).padStart(2, '0')}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-300">
                            <div className="font-bold text-black text-sm leading-snug">
                              {req.partNameOrDescription}
                            </div>
                            <div className="text-xs font-semibold text-gray-700 mt-1 flex items-center gap-1.5 flex-wrap">
                              <span>Req #{req.id.toString().padStart(4, '0')}</span>
                              {req.serviceRequestId && (
                                <>
                                  <span>&bull;</span>
                                  <span className="font-bold text-black">OT #{req.serviceRequestId.toString().padStart(4, '0')}</span>
                                </>
                              )}
                              {plate && (
                                <>
                                  <span>&bull;</span>
                                  <span className="font-mono font-bold text-black">Placa: {plate}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center border-r border-gray-300 font-extrabold text-black text-sm">
                            <span className="bg-gray-100 border border-gray-400 text-black px-2.5 py-1 rounded font-mono inline-block">
                              {req.quantity} {(req as any).unitOfMeasure?.code || 'und'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-black text-sm leading-snug">
                            {req.observations ? (
                              <span className="font-semibold text-black leading-relaxed">{req.observations}</span>
                            ) : (
                              <span className="text-gray-700 italic text-xs">Sin observaciones</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Footer Section (Signatures & Provider Box anchored at bottom) */}
            <div className="mt-auto pt-6 break-inside-avoid">
              {/* Signatures */}
              <div className="grid grid-cols-3 gap-8 mb-6">
                <div>
                  <div className="border-b-2 border-gray-800 pb-2 mb-2 min-h-[38px] flex items-end"></div>
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
                Este documento representa una solicitud formal de cotización de repuestos e insumos para el mantenimiento de flota.
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
