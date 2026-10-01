import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workshopService } from '../services/workshopService';
import { useAuthStore } from '../store/authStore';
import type { ServiceRequest } from '../types';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';

export default function PrintServiceReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const selectedCompany = useAuthStore(state => state.selectedCompany);
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      workshopService.getRequestById(Number(id))
        .then(data => {
          setRequest(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-gray-500">
        <Loader2 className="animate-spin text-blue-600 mr-2" size={32} />
        <span>Cargando reporte de averías...</span>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 text-center text-red-500">
        <p className="font-bold">No se encontró el reporte técnico solicitado.</p>
        <button 
          onClick={() => navigate('/workshop')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-sm cursor-pointer"
        >
          Volver al Taller
        </button>
      </div>
    );
  }

  const reqDate = new Date(request.dateRequested);
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const currentMonthYear = `${monthNames[reqDate.getMonth()]} ${reqDate.getFullYear()}`;
  const formattedDate = reqDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const ownerCompanyName = request.vehicle?.fleetOwner?.name || request.trailer?.fleetOwner?.name || selectedCompany?.name || 'N/A';

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
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md font-bold text-sm transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Printer size={16} /> Imprimir Reporte
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
                <div className="h-12 w-12 rounded bg-blue-800 text-white flex items-center justify-center font-black text-xl">
                  {(selectedCompany?.name || 'T').substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-[9px] font-bold text-blue-800 tracking-widest uppercase mb-0.5">Documento Técnico</p>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">Resumen de Reporte de Averías</h1>
                <h2 className="text-xl font-bold text-blue-900 leading-tight">{currentMonthYear}</h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">No. Reporte</p>
              <h3 className="text-lg font-bold text-gray-900 mb-1">#{request.id.toString().padStart(4, '0')}</h3>
              <span className="inline-flex bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-blue-600"></span>
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
              <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Placa</p>
              <p className="font-bold text-gray-900 uppercase">{request.vehicle?.licensePlate || request.trailer?.licensePlate || 'N/A'}</p>
            </div>
            <div className="p-3 border-r border-gray-200">
              <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Fecha</p>
              <p className="font-bold text-gray-900">{formattedDate}</p>
            </div>
            <div className="p-3">
              <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Empresa</p>
              <p className="font-bold text-gray-900 uppercase">{ownerCompanyName}</p>
            </div>
          </div>

          {/* Maintenance Protocol */}
          <div className="mb-2 flex items-end justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Protocolo de Mantenimiento</h3>
            <span className="text-[10px] font-medium text-gray-500">{request.activities?.length || 0} Ítems Registrados</span>
          </div>

          <div className="mb-6 overflow-hidden rounded-md border border-gray-200">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-100">
                  <th className="px-4 py-2 text-[9px] font-bold text-gray-600 tracking-widest uppercase">Descripción de avería / servicio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {request.activities && request.activities.length > 0 ? (
                  request.activities.map((act, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-2 text-xs font-semibold text-gray-800">
                        {act.description}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-2 text-xs text-gray-500 italic">No se detallaron renglones de actividad.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Observations Box */}
          <div className="bg-slate-50 rounded-lg p-4 mb-8 border border-gray-200 break-inside-avoid">
            <div className="flex items-center gap-2 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-800"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <h4 className="text-[10px] font-bold text-gray-800 tracking-widest uppercase">Observaciones</h4>
            </div>
            <div className="bg-white p-3 rounded border border-gray-200 text-xs text-gray-600 leading-relaxed min-h-[50px]">
              {request.description || <span className="italic text-gray-400">Sin observaciones generales...</span>}
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 mt-10 mb-4 break-inside-avoid">
            <div className="text-center">
              <div className="border-t border-gray-300 w-full mb-2"></div>
              <p className="text-[9px] font-bold text-gray-600 tracking-widest uppercase mb-0.5">Chofer</p>
              <p className="text-[11px] font-medium italic text-blue-800">{request.driver?.name || ''}</p>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-300 w-full mb-2"></div>
              <p className="text-[9px] font-bold text-gray-600 tracking-widest uppercase mb-0.5">Mecánico</p>
              <p className="text-[11px] font-medium italic text-blue-800">{request.mechanic?.name || ''}</p>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-300 w-full mb-2"></div>
              <p className="text-[9px] font-bold text-gray-600 tracking-widest uppercase mb-0.5">Jefe de Almacén</p>
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
