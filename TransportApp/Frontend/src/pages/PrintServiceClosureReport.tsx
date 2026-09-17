import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { workshopService } from '../services/workshopService';
import { useAuthStore } from '../store/authStore';
import type { ServiceRequest } from '../types';
import { Loader2 } from 'lucide-react';

export default function PrintServiceClosureReport() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const selectedCompany = useAuthStore(state => state.selectedCompany);

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
    
    // Add print styles to body dynamically for this view
    document.body.classList.add('bg-white');
    document.body.classList.remove('bg-gray-50', 'dark:bg-gray-900');
    
    fetchRequest();

    return () => {
      document.body.classList.remove('bg-white');
      document.body.classList.add('bg-gray-50', 'dark:bg-gray-900');
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <p className="text-gray-500">No se encontr&oacute; el reporte.</p>
      </div>
    );
  }

  const reqDate = request.execution?.dateCompleted ? new Date(request.execution.dateCompleted) : new Date(request.dateRequested);
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const currentMonthYear = `${monthNames[reqDate.getMonth()]} ${reqDate.getFullYear()}`;
  const formattedDate = reqDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const startDate = new Date(request.dateRequested).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const usedParts = request.execution?.usedSpareParts || [];
  const totalCost = usedParts.reduce((acc, part) => acc + (part.quantity * (part.unitCost || part.sparePart?.unitCost || 0)), 0);
  const ownerCompanyName = request.vehicle?.fleetOwner?.name || request.trailer?.fleetOwner?.name || selectedCompany?.name || 'N/A';

  return (
    <div className="mx-auto bg-white p-4 max-w-[800px] text-zinc-900 w-full font-sans text-[13px] print:p-0 print:m-0" style={{ pageBreakInside: 'avoid' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          {selectedCompany?.logoUrl && (
            <img src={selectedCompany.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
          )}
          <div>
            <p className="text-[9px] font-bold text-indigo-800 tracking-widest uppercase mb-0.5">Documento T&eacute;cnico</p>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">Reporte de Cierre de Servicio</h1>
            <h2 className="text-xl font-bold text-indigo-900 leading-tight">{currentMonthYear}</h2>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">No. Reporte</p>
          <h3 className="text-lg font-bold text-gray-900 mb-1">#{request.id.toString().padStart(4, '0')}</h3>
          <span className="inline-flex bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-green-600"></span>
            {request.status}
          </span>
        </div>
      </div>

      {/* Info Boxes */}
      <div className="grid grid-cols-5 gap-0 border border-gray-100 rounded-md mb-6 bg-white shadow-sm overflow-hidden text-xs">
        <div className="p-3 border-r border-gray-100">
          <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Empresa</p>
          <p className="font-bold text-gray-900 uppercase">{request.vehicle?.fleetOwner?.name || request.trailer?.fleetOwner?.name || selectedCompany?.name || 'N/A'}</p>
        </div>
        <div className="p-3 border-r border-gray-100">
          <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">{request.trailer ? "Remolque" : "Vehículo"}</p>
          <p className="font-bold text-gray-900 uppercase">{request.vehicle ? `${request.vehicle.brand} ${request.vehicle.model}` : request.trailer ? request.trailer.type : "N/A"}</p>
        </div>
        <div className="p-3 border-r border-gray-100">
          <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Placa</p>
          <p className="font-bold text-gray-900 uppercase">{request.vehicle?.licensePlate || request.trailer?.licensePlate || "N/A"}</p>
        </div>
        <div className="p-3 border-r border-gray-100">
          <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Fechas</p>
          <p className="font-bold text-gray-900 text-[10px]">Entrada: {startDate}<br/>Salida: {formattedDate}</p>
        </div>
        <div className="p-3">
          <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Kilometraje</p>
          <p className="font-bold text-gray-900 uppercase">{request.execution?.mileageAtService ? request.execution.mileageAtService.toLocaleString() : 'N/A'} Km</p>
        </div>
      </div>

      {/* Observations Box */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-800 tracking-widest uppercase mb-2">Diagn&oacute;stico Inicial</h4>
            <div className="bg-white p-3 rounded border border-dashed border-gray-200 text-xs text-gray-600 leading-relaxed min-h-[60px]">
            {request.description || <span className="italic text-gray-400">N/A</span>}
            {request.execution?.diagnosisObservations && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                <span className="font-semibold">Nota mec&aacute;nico: </span> {request.execution.diagnosisObservations}
                </div>
            )}
            </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-800 tracking-widest uppercase mb-2">Observaci&oacute;n Final (Trabajo Realizado)</h4>
            <div className="bg-white p-3 rounded border border-dashed border-gray-200 text-xs text-gray-600 leading-relaxed min-h-[60px]">
            {request.execution?.finalObservations || <span className="italic text-gray-400">Sin observaciones finales...</span>}
            </div>
        </div>

      {/* Progress Logs */}
      {request.logs && request.logs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-base font-bold text-gray-900 mb-2">Bit&aacute;cora de Progreso</h3>
          <div className="overflow-hidden rounded-t-md border border-gray-100">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100">
                  <th className="px-4 py-2 text-[9px] font-bold text-gray-500 tracking-widest uppercase w-32">Fecha / Hora</th>
                  <th className="px-4 py-2 text-[9px] font-bold text-gray-500 tracking-widest uppercase">Anotaci&oacute;n</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {request.logs.map((log, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-[10px] font-semibold text-gray-600 whitespace-nowrap align-top">
                      {new Date(log.createdAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-800 whitespace-pre-wrap">{log.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* Spare Parts Consumed */}
      <div className="mb-2 flex items-end justify-between">
        <h3 className="text-base font-bold text-gray-900">Repuestos y Materiales Utilizados</h3>
        <span className="text-[10px] font-medium text-gray-500">{usedParts.length} &Iacute;tems</span>
      </div>

      <div className="mb-6 overflow-hidden rounded-t-md bg-gray-50 border border-gray-100">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              <th className="px-4 py-2 text-[9px] font-bold text-gray-500 tracking-widest uppercase">C&oacute;digo</th>
              <th className="px-4 py-2 text-[9px] font-bold text-gray-500 tracking-widest uppercase">Descripci&oacute;n</th>
              <th className="px-4 py-2 text-[9px] font-bold text-gray-500 tracking-widest uppercase text-right">Cant.</th>
              <th className="px-4 py-2 text-[9px] font-bold text-gray-500 tracking-widest uppercase text-right">P. Unit.</th>
              <th className="px-4 py-2 text-[9px] font-bold text-gray-500 tracking-widest uppercase text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {usedParts.length > 0 ? (
              usedParts.map((usp, idx) => {
                const unitCost = usp.unitCost || usp.sparePart?.unitCost || 0;
                const subTotal = usp.quantity * unitCost;
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-xs font-semibold text-gray-800">{usp.sparePart?.code}</td>
                    <td className="px-4 py-2 text-xs text-gray-800">{usp.sparePart?.name}</td>
                    <td className="px-4 py-2 text-xs font-semibold text-gray-800 text-right">{usp.quantity}</td>
                    <td className="px-4 py-2 text-xs text-gray-600 text-right">${unitCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="px-4 py-2 text-xs font-bold text-gray-900 text-right">${subTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-2 text-xs text-gray-500 italic text-center">No se registr&oacute; el uso de repuestos.</td>
              </tr>
            )}
          </tbody>
          {usedParts.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={4} className="px-4 py-2 text-[10px] font-bold text-gray-700 tracking-widest uppercase text-right">Total Repuestos:</td>
                <td className="px-4 py-2 text-sm font-black text-indigo-700 text-right">${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-12 mt-16 mb-4 px-10">
        <div className="text-center">
          <div className="border-t border-gray-400 w-full mb-2"></div>
          <p className="text-[9px] font-bold text-gray-600 tracking-widest uppercase mb-0.5">Mecánico Responsable</p>
          <p className="text-[11px] font-medium italic text-indigo-800">{request.mechanic?.name || ''}</p>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 w-full mb-2"></div>
                      <p className="text-[9px] font-bold text-gray-600 tracking-widest uppercase mb-0.5">Chofer</p>
            <p className="text-[11px] font-medium italic text-indigo-800">{request.driver?.name || ''}</p>
          </div>
      </div>
      
      {/* Footer Disclaimer */}
      <div className="text-center mt-auto pt-4 border-t border-gray-100">
        <p className="text-[7px] text-gray-400">Este reporte es un documento oficial de {ownerCompanyName}. Prohibida su alteraci&oacute;n. Generado digitalmente por el Sistema de Flota.</p>
      </div>

      {/* Auto Trigger Print on Load (Optional, but useful) */}
      <div className="fixed bottom-4 right-4 print:hidden">
        <button 
          onClick={() => window.print()} 
          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg text-white rounded-full p-4 transition-transform hover:scale-105"
          title="Imprimir Pesta&ntilde;a"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        </button>
      </div>
    </div>
  );
}