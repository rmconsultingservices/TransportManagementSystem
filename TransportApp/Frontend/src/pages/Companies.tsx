import React, { useEffect, useState } from 'react';
import { Building2, Plus, PenSquare, X, Trash2 } from 'lucide-react';
import { adminService } from '../services/adminService';

export default function Companies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [rif, setRif] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const fetchCompanies = async () => {
    try {
      const data = await adminService.getCompanies();
      setCompanies(data);
    } catch(e) { console.error(e); }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId !== null) {
      await adminService.updateCompany(editingId, { name, rif, logoUrl });
    } else {
      await adminService.createCompany({ name, rif, logoUrl });
    }
    closeForm();
    fetchCompanies();
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta empresa?')) {
      await adminService.deleteCompany(id);
      fetchCompanies();
    }
  };

  const openEditForm = (company: any) => {
    setEditingId(company.id);
    setName(company.name);
    setRif(company.rif);
    setLogoUrl(company.logoUrl || '');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setRif('');
    setLogoUrl('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="text-indigo-600" size={32} />
            Gestión de Empresas
          </h1>
          <p className="text-gray-500 mt-1">Administra los entornos multi-tenant (Compañías).</p>
        </div>
        <button onClick={() => { closeForm(); setShowForm(!showForm); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
          {showForm ? <><X size={20} /> Cancelar</> : <><Plus size={20} /> Añadir</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8">
          <h2 className="text-lg font-bold mb-4 text-indigo-700 dark:text-indigo-400">
            {editingId !== null ? 'Editar Empresa' : 'Nueva Empresa'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Comercial</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Transporte del Sur" className="w-full rounded-md border p-2 bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RIF / NIT</label>
              <input required type="text" value={rif} onChange={e => setRif(e.target.value)} placeholder="J-12345678-9" className="w-full rounded-md border p-2 bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL Logo (Opcional)</label>
              <input type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." className="w-full rounded-md border p-2 bg-transparent dark:border-gray-600 focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeForm} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium">Cancelar</button>
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium">{editingId !== null ? 'Actualizar' : 'Guardar'}</button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Logo</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">RIF</th>
              <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {companies.map(c => (
              <tr key={c.id}>
                <td className="px-6 py-4">{c.id}</td>
                <td className="px-6 py-4">
                  {c.logoUrl ? <img src={c.logoUrl} alt="logo" className="h-8 max-w-xs object-contain" /> : <span className="text-gray-400 text-xs">Sin Logo</span>}
                </td>
                <td className="px-6 py-4 font-semibold">{c.name}</td>
                <td className="px-6 py-4">{c.rif}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => openEditForm(c)}
                    className="text-indigo-600 hover:text-indigo-800 p-2 rounded hover:bg-indigo-50 transition-colors"
                  >
                    <PenSquare size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(c.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors ml-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
