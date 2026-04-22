import React, { useEffect, useState } from 'react';
import { History, Search } from 'lucide-react';
import { adminService } from '../services/adminService';
import type { AuditLog } from '../services/adminService';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [table, setTable] = useState('');
  const [user, setUser] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAuditLogs(table, user);
      setLogs(data);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="text-indigo-600" size={32} />
            Pistas de Auditoría
          </h1>
          <p className="text-gray-500 mt-1">Rastreo de actividades y modificaciones en la plataforma.</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6 flex gap-4 items-end border border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Tabla Afectada</label>
          <input type="text" value={table} onChange={e => setTable(e.target.value)} placeholder="Ej. Vehicles" className="w-full rounded border p-2 bg-transparent dark:border-gray-600" />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Usuario (Sistema/Windows)</label>
          <input type="text" value={user} onChange={e => setUser(e.target.value)} placeholder="Ej. admin" className="w-full rounded border p-2 bg-transparent dark:border-gray-600" />
        </div>
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded font-medium flex gap-2 items-center h-10">
           <Search size={18} /> Filtrar
        </button>
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Tabla</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Acción</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Usuario Sist.</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">IP / Entorno</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Valores (Pre)</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Valores (Post)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3 font-semibold">{log.tableName}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    log.action == 'Modified' ? 'bg-yellow-100 text-yellow-800' :
                    log.action == 'Added' ? 'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3">{log.systemUsername}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                     <span className="text-xs text-blue-500">{log.machineName}</span>
                     <span className="text-[10px] text-gray-400">{log.windowsUsername}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {log.oldValues == "{}" ? <span className="text-gray-400">-</span> : 
                   <textarea readOnly className="w-40 text-xs bg-gray-100 dark:bg-gray-900 p-1 border-none rounded" value={log.oldValues} rows={3}></textarea>}
                </td>
                <td className="px-4 py-3">
                   {log.newValues == "{}" ? <span className="text-gray-400">-</span> : 
                   <textarea readOnly className="w-40 text-xs bg-gray-100 dark:bg-gray-900 p-1 border-none rounded" value={log.newValues} rows={3}></textarea>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && !loading && (
          <div className="p-8 text-center text-gray-500">
            No se encontraron registros de auditoría.
          </div>
        )}
      </div>
    </div>
  );
}
