import React, { useEffect, useState } from 'react';
import { Users, Plus, Shield, Key, X, Building2 } from 'lucide-react';
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
    try {
      await adminService.createUser({ username, passwordHash, fullName, isSuperAdmin, isActive: true });
      toast.success('Usuario creado con ?xito');
      setShowForm(false);
      setUsername('');
      setPasswordHash('');
      setFullName('');
      setIsSuperAdmin(false);
      fetchData();
    } catch(e: any) {
      console.error(e);
      toast.error('Error al crear usuario: ' + (e.response?.data?.message || e.response?.data || e.message));
    }
  };

  const handleAssign = async () => {
    if(!assignUser || selectedCompanyId === 0) return;
    try {
      await adminService.assignCompany(assignUser.id, selectedCompanyId);
      toast.success('Empresa asignada correctamente');
      const updatedUsers = await adminService.getUsers();
      setUsers(updatedUsers);
      const updatedUser = updatedUsers.find((u: any) => u.id === assignUser.id);
      if (updatedUser) {
        setAssignUser(updatedUser);
      }
      setSelectedCompanyId(0);
    } catch(e: any) {
      console.error(e);
      toast.error('Error asignando la empresa: ' + (e.response?.data?.message || e.response?.data || e.message));
    }
  };

  const handleRemoveCompany = async (user: any, companyId: number, companyName: string) => {
    if (!window.confirm(`?Est?s seguro de quitar el acceso a "${companyName}" para el usuario "${user.username}"?`)) {
      return;
    }
    try {
      await adminService.removeCompany(user.id, companyId);
      toast.success(`Acceso a ${companyName} revocado para ${user.username}`);
      const updatedUsers = await adminService.getUsers();
      setUsers(updatedUsers);
      if (assignUser && assignUser.id === user.id) {
        const updatedUser = updatedUsers.find((u: any) => u.id === user.id);
        setAssignUser(updatedUser || null);
      }
    } catch(e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || e.response?.data || 'Error al quitar el acceso a la empresa');
    }
  };

  const handleAdminReset = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!resetUser || newAdminPassword.length < 6) {
          toast.error('La contrase?a debe tener al menos 6 caracteres');
          return;
      }
      setIsResetting(true);
      try {
          await authService.adminChangePassword(resetUser.id, newAdminPassword);
          toast.success(`Contraseña de ${resetUser.username} restablecida con ?xito`);
          setResetUser(null);
          setNewAdminPassword('');
      } catch(err: any) {
          toast.error(err.response?.data?.message || 'Error al restablecer contrase?a');
      } finally {
          setIsResetting(false);
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Users className="text-indigo-600" size={32} /> Gestión de Usuarios</h1>
          <p className="text-gray-500 mt-1">Crea cuentas y asigna o revoca permisos por empresa.</p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Building2 className="text-indigo-600" size={24} />
                Empresas de {assignUser.username}
              </h2>
              <button onClick={() => { setAssignUser(null); setSelectedCompanyId(0); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* List of currently assigned companies */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Empresas con Acceso ({assignUser.companies?.length || 0})
              </label>
              {assignUser.companies && assignUser.companies.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg border dark:border-gray-600 max-h-40 overflow-y-auto">
                  {assignUser.companies.map((c: any) => (
                    <span
                      key={c.companyId}
                      className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200 text-xs pl-3 pr-1.5 py-1 rounded-full font-medium shadow-sm"
                    >
                      <span>{c.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCompany(assignUser, c.companyId, c.name)}
                        className="hover:bg-red-200 dark:hover:bg-red-800 text-blue-700 hover:text-red-700 dark:text-blue-200 dark:hover:text-red-300 rounded-full p-0.5 transition-colors"
                        title={`Quitar acceso a ${c.name}`}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-dashed dark:border-gray-600">
                  No tiene ninguna empresa asignada actualmente.
                </p>
              )}
            </div>

            {/* Assign new company */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Asignar Nueva Empresa
              </label>
              {(() => {
                const available = companies.filter(c => !assignUser.companies?.some((uc: any) => uc.companyId === c.id));
                if (available.length === 0) {
                  return (
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium py-2">
                      ✓ El usuario ya tiene acceso a todas las empresas disponibles.
                    </p>
                  );
                }
                return (
                  <div className="flex gap-2">
                    <select
                      className="flex-1 border p-2 dark:bg-gray-700 dark:border-gray-600 rounded-lg bg-white dark:text-white text-sm"
                      value={selectedCompanyId}
                      onChange={e => setSelectedCompanyId(Number(e.target.value))}
                    >
                      <option value={0} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                        Seleccione una empresa...
                      </option>
                      {available.map(c => (
                        <option key={c.id} value={c.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={selectedCompanyId === 0}
                      onClick={handleAssign}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Asignar
                    </button>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end pt-3 border-t dark:border-gray-700">
              <button
                onClick={() => { setAssignUser(null); setSelectedCompanyId(0); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {resetUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-2xl">
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
                  <div className="flex flex-wrap gap-1.5">
                    {u.companies && u.companies.length > 0 ? (
                      u.companies.map((c: any) => (
                        <span
                          key={c.companyId}
                          className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs pl-2.5 pr-1 py-0.5 rounded-full font-medium"
                        >
                          <span>{c.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCompany(u, c.companyId, c.name)}
                            className="hover:bg-red-200 dark:hover:bg-red-900/60 text-blue-600 hover:text-red-700 dark:text-blue-300 dark:hover:text-red-300 rounded-full p-0.5 transition-colors"
                            title={`Quitar acceso a ${c.name}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs italic">Sin empresas</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 flex items-center gap-3">
                  <button onClick={() => { setAssignUser(u); setSelectedCompanyId(0); }} className="text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400 font-medium hover:underline flex items-center gap-1">
                    <Building2 size={15}/> Empresas
                  </button>
                  <button onClick={() => setResetUser(u)} className="text-orange-600 hover:text-orange-800 dark:hover:text-orange-400 font-medium hover:underline flex items-center gap-1" title="Restablecer Contraseña">
                    <Key size={15}/> Clave
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
