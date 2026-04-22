import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { workshopService } from '../services/workshopService';
import { useAuthStore } from '../store/authStore';
import type { ServiceRequest } from '../types';
import { Loader2 } from 'lucide-react';

export default function PrintServiceReport() {
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
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <p className="text-gray-500">No se encontró el reporte.</p>
      </div>
    );
  }

  const reqDate = new Date(request.dateRequested);
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const currentMonthYear = `${monthNames[reqDate.getMonth()]} ${reqDate.getFullYear()}`;
  const formattedDate = reqDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="mx-auto bg-white p-4 max-w-[800px] text-zinc-900 w-full font-sans text-[13px] print:p-0 print:m-0" style={{ pageBreakInside: 'avoid' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          {selectedCompany?.logoUrl && (
            <img src={selectedCompany.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
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
      <div className="grid grid-cols-4 gap-0 border border-gray-100 rounded-md mb-6 bg-white shadow-sm overflow-hidden text-xs">
        <div className="p-3 border-r border-gray-100">
          <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Vehículo</p>
          <p className="font-bold text-gray-900 uppercase">{request.vehicle?.brand} {request.vehicle?.model}</p>
        </div>
        <div className="p-3 border-r border-gray-100">
          <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Placa</p>
          <p className="font-bold text-gray-900 uppercase">{request.vehicle?.licensePlate || 'N/A'}</p>
        </div>
        <div className="p-3 border-r border-gray-100">
          <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Fecha</p>
          <p className="font-bold text-gray-900">{formattedDate}</p>
        </div>
        <div className="p-3">
          <p className="text-[9px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">Compañía</p>
          <p className="font-bold text-gray-900 uppercase">{selectedCompany?.name || 'N/A'}</p>
        </div>
      </div>

      {/* Maintenance Protocol */}
      <div className="mb-2 flex items-end justify-between">
        <h3 className="text-base font-bold text-gray-900">Protocolo de Mantenimiento</h3>
        <span className="text-[10px] font-medium text-gray-500">{request.activities?.length || 0} Ítems Registrados</span>
      </div>

      <div className="mb-6 overflow-hidden rounded-t-md bg-gray-50 border border-gray-100">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-2 text-[9px] font-bold text-gray-500 tracking-widest uppercase">Descripción de avería / servicio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {request.activities && request.activities.length > 0 ? (
              request.activities.map((act, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
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
      <div className="bg-gray-50 rounded-lg p-4 mb-10 border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-800"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <h4 className="text-[10px] font-bold text-gray-800 tracking-widest uppercase">Observaciones</h4>
        </div>
        <div className="bg-white p-3 rounded border border-dashed border-gray-200 text-xs text-gray-600 leading-relaxed min-h-[60px]">
          {request.description || <span className="italic text-gray-400">Sin observaciones generales...</span>}
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-8 mt-12 mb-4">
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
      <div className="text-center mt-auto pt-4 border-t border-gray-100">
        <p className="text-[7px] text-gray-400">Este reporte es un documento oficial de {selectedCompany?.name || 'la empresa'}. Prohibida su alteración. Generado digitalmente por el Sistema de Flota.</p>
      </div>

      {/* Auto Trigger Print on Load (Optional, but useful) */}
      <div className="fixed bottom-4 right-4 print:hidden">
        <button 
          onClick={() => window.print()} 
          className="bg-blue-600 hover:bg-blue-700 shadow-lg text-white rounded-full p-4 transition-transform hover:scale-105"
          title="Imprimir Pestaña"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        </button>
      </div>
    </div>
  );
}
