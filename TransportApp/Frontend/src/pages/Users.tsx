import React, { useEffect, useState } from 'react';
import { Users, Plus, Shield, Key } from 'lucide-react';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

export default function UsersAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // New User State
  const [username, setUsername] = useState('');
  const [passwordHash, setPasswordHash] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Assignment Modal
  const [assignUser, setAssignUser] = useState<any>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(0);

  // Reset Password Modal
  const [resetUser, setResetUser] = useState<any>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const fetchData = async () => {
    try {
      setUsers(await adminService.getUsers());
      setCompanies(await adminService.getCompanies());
    } catch(e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await adminService.createUser({ username, passwordHash, fullName, isSuperAdmin, isActive: true });
    setShowForm(false);
    fetchData();
  };

  const handleAssign = async () => {
    if(!assignUser || selectedCompanyId === 0) return;
    try {
      await adminService.assignCompany(assignUser.id, selectedCompanyId);
      setAssignUser(null);
      fetchData();
    } catch(e: any) {
      console.error(e);
      alert('Error asignando la empresa: ' + (e.response?.data || e.message));
    }
  };

  const handleAdminReset = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!resetUser || newAdminPassword.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres');
          return;
      }
      setIsResetting(true);
      try {
          await authService.adminChangePassword(resetUser.id, newAdminPassword);
          toast.success(`Contraseña de ${resetUser.username} restablecida con éxito`);
          setResetUser(null);
          setNewAdminPassword('');
      } catch(err: any) {
          toast.error(err.response?.data?.message || 'Error al restablecer contraseña');
      } finally {
          setIsResetting(false);
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Users className="text-indigo-600" size={32} /> Gestión de Usuarios</h1>
          <p className="text-gray-500 mt-1">Crea cuentas y asigna permisos por empresa.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2">
           <Plus size={20} /> Nuevo Usuario
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <input required type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Usuario" className="rounded-md border p-2 bg-transparent dark:border-gray-600" />
          <input required type="password" value={passwordHash} onChange={e => setPasswordHash(e.target.value)} placeholder="Contraseña" className="rounded-md border p-2 bg-transparent dark:border-gray-600" />
          <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nombre Completo" className="rounded-md border p-2 bg-transparent dark:border-gray-600" />
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={isSuperAdmin} onChange={e => setIsSuperAdmin(e.target.checked)} id="iSA" />
            <label htmlFor="iSA">Es Super Admin</label>
            <button type="submit" className="ml-auto bg-green-600 text-white px-4 py-2 rounded-md font-medium">Guardar</button>
          </div>
        </form>
      )}

      {assignUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-96">
            <h2 className="text-xl font-bold mb-4">Asignar a {assignUser.username}</h2>
            <select className="w-full border p-2 mb-4 dark:bg-gray-700 dark:border-gray-600 rounded bg-white dark:text-white" value={selectedCompanyId} onChange={e => setSelectedCompanyId(Number(e.target.value))}>
              <option value={0} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Seleccione una empresa...</option>
              {companies.map(c => <option key={c.id} value={c.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{c.name}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setAssignUser(null)} className="px-4 py-2 text-gray-500">Cancelar</button>
              <button onClick={handleAssign} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">Asignar</button>
            </div>
          </div>
        </div>
      )}

      {resetUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-96 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Key className="text-orange-600" size={24}/> Resetear Clave</h2>
            <p className="text-sm text-gray-500 mb-4">Estableciendo nueva clave para <b>{resetUser.username}</b></p>
            <form onSubmit={handleAdminReset}>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva Contraseña</label>
                    <input type="password" required value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} className="w-full border p-2 rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setResetUser(null)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">Cancelar</button>
                    <button type="submit" disabled={isResetting} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition-colors disabled:opacity-50">
                        {isResetting ? 'Guardando...' : 'Restablecer'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden p-0">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Empresas Asignadas</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-6 py-4 font-semibold">{u.username}</td>
                <td className="px-6 py-4">{u.fullName}</td>
                <td className="px-6 py-4">
                  {u.isSuperAdmin ? <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex w-fit items-center gap-1"><Shield size={12}/> Super Admin</span> : <span className="text-gray-500">Normal</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {u.companies?.map((c:any) => <span key={c.companyId} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{c.name}</span>)}
                  </div>
                </td>
                <td className="px-6 py-4 flex items-center gap-3">
                  <button onClick={() => setAssignUser(u)} className="text-indigo-600 hover:underline">Dar Acceso</button>
                  <button onClick={() => setResetUser(u)} className="text-orange-600 hover:underline flex items-center gap-1" title="Restablecer Contraseña"><Key size={16}/> Clave</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
