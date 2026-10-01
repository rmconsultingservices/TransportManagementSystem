import React, { useEffect, useState } from 'react';
import { 
  Users, Plus, Shield, Key, X, Building2, UserX, UserCheck, 
  Trash2, Search, AlertTriangle, ShieldCheck, CheckCircle2, XCircle
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function UsersAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // New user form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'Operator',
    isSuperAdmin: false
  });

  // Modal states
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [resetUser, setResetUser] = useState<any | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  // Delete confirmation modal state
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Status toggle loading state per user ID
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);

  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, companiesData] = await Promise.all([
        adminService.getUsers(),
        adminService.getCompanies()
      ]);
      setUsers(usersData);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading users data:', error);
      toast.error('Error al cargar la lista de usuarios y empresas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.username.trim() || !newUserData.password || !newUserData.fullName.trim()) {
      toast.error('Por favor completa todos los campos requeridos.');
      return;
    }

    try {
      await adminService.createUser(newUserData);
      toast.success('Usuario creado exitosamente');
      setNewUserData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        role: 'Operator',
        isSuperAdmin: false
      });
      setShowAddForm(false);
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al crear el usuario';
      toast.error(msg);
    }
  };

  const handleToggleStatus = async (user: any) => {
    if (currentUser && (currentUser.id === user.id || currentUser.username === user.username)) {
      toast.error('No puedes inhabilitar tu propio usuario activo.');
      return;
    }

    setTogglingUserId(user.id);
    try {
      const res = await adminService.toggleUserStatus(user.id);
      const isNowActive = res.isActive !== undefined ? res.isActive : !user.isActive;
      toast.success(
        isNowActive 
          ? `Usuario "${user.fullName || user.username}" activado correctamente.` 
          : `Usuario "${user.fullName || user.username}" inhabilitado.`
      );
      // Update local state smoothly
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: isNowActive } : u));
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al cambiar el estado del usuario.';
      toast.error(msg);
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (currentUser && (currentUser.id === userToDelete.id || currentUser.username === userToDelete.username)) {
      toast.error('No puedes eliminar tu propia cuenta.');
      setUserToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      await adminService.deleteUser(userToDelete.id);
      toast.success(`Usuario "${userToDelete.fullName || userToDelete.username}" eliminado permanentemente.`);
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al eliminar el usuario.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssignCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedCompanyId) return;

    try {
      await adminService.assignCompany(Number(selectedUser.id), Number(selectedCompanyId));
      toast.success('Empresa asignada correctamente');
      setSelectedCompanyId('');
      
      const updatedUsers = await adminService.getUsers();
      setUsers(updatedUsers);
      const found = updatedUsers.find((u: any) => u.id === selectedUser.id);
      if (found) setSelectedUser(found);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al asignar la empresa');
    }
  };

  const handleRemoveCompany = async (companyId: number) => {
    if (!selectedUser) return;
    try {
      await adminService.removeCompany(Number(selectedUser.id), Number(companyId));
      toast.success('Empresa desvinculada');
      
      const updatedUsers = await adminService.getUsers();
      setUsers(updatedUsers);
      const found = updatedUsers.find((u: any) => u.id === selectedUser.id);
      if (found) setSelectedUser(found);
    } catch (error: any) {
      toast.error('Error al desvincular empresa');
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !newAdminPassword) return;
    
    if (newAdminPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsResetting(true);
    try {
      await authService.adminChangePassword(Number(resetUser.id), newAdminPassword);
      toast.success('Contraseña restablecida exitosamente');
      setResetUser(null);
      setNewAdminPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al restablecer la contraseña');
    } finally {
      setIsResetting(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.role || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? (user.isActive !== false) :
      (user.isActive === false);

    return matchesSearch && matchesStatus;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive !== false).length;
  const inactiveUsers = users.filter(u => u.isActive === false).length;
  const adminCount = users.filter(u => u.role === 'Admin' || u.isSuperAdmin).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="text-indigo-600" size={28} />
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Administra los usuarios del sistema, sus accesos, estado activo/inactivo y asignaciones a empresas.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-all"
        >
          {showAddForm ? <X size={18} /> : <Plus size={18} />}
          {showAddForm ? 'Cerrar Formulario' : 'Nuevo Usuario'}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Usuarios</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalUsers}</p>
          </div>
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activos</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeUsers}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Inhabilitados</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{inactiveUsers}</p>
          </div>
          <div className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
            <XCircle size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Administradores</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{adminCount}</p>
          </div>
          <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
            <ShieldCheck size={22} />
          </div>
        </div>
      </div>

      {/* New User Form Collapse */}
      {showAddForm && (
        <form onSubmit={handleCreateUser} className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-md">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="text-indigo-600" size={20} />
            Crear Nuevo Usuario
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={newUserData.fullName}
                onChange={e => setNewUserData({ ...newUserData, fullName: e.target.value })}
                placeholder="Ej. Juan Pérez"
                className="w-full border border-gray-300 dark:border-gray-600 p-2.5 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Usuario (Username) *</label>
              <input
                type="text"
                required
                value={newUserData.username}
                onChange={e => setNewUserData({ ...newUserData, username: e.target.value })}
                placeholder="Ej. jperez"
                className="w-full border border-gray-300 dark:border-gray-600 p-2.5 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={newUserData.email}
                onChange={e => setNewUserData({ ...newUserData, email: e.target.value })}
                placeholder="jperez@empresa.com"
                className="w-full border border-gray-300 dark:border-gray-600 p-2.5 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña *</label>
              <input
                type="password"
                required
                value={newUserData.password}
                onChange={e => setNewUserData({ ...newUserData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-gray-300 dark:border-gray-600 p-2.5 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Rol *</label>
              <select
                value={newUserData.role}
                onChange={e => setNewUserData({ ...newUserData, role: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 p-2.5 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Operator">Operador / Personal</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Manager">Gerente</option>
                <option value="Admin">Administrador</option>
              </select>
            </div>
            <div className="flex items-center justify-between pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={newUserData.isSuperAdmin}
                  onChange={e => setNewUserData({ ...newUserData, isSuperAdmin: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="font-medium">Super Administrador</span>
              </label>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-medium text-sm shadow-sm transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario, rol..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todos ({totalUsers})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Activos ({activeUsers})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Inhabilitados ({inactiveUsers})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
            <p className="text-sm">Cargando usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            <Users className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-base font-medium">No se encontraron usuarios</p>
            <p className="text-xs text-gray-400">Prueba ajustando el término de búsqueda o el filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Usuario</th>
                  <th className="py-3.5 px-4">Rol</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Empresas Asignadas</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredUsers.map(user => {
                  const isActive = user.isActive !== false;
                  const isSelf = Boolean(currentUser && (currentUser.id === user.id || currentUser.username === user.username));
                  const isToggling = togglingUserId === user.id;

                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors ${
                        !isActive ? 'bg-red-50/20 dark:bg-red-950/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                            !isActive 
                              ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400' 
                              : user.isSuperAdmin 
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' 
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                          }`}>
                            {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                              {user.fullName || user.username}
                              {user.isSuperAdmin && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                                  <Shield size={10} /> SuperAdmin
                                </span>
                              )}
                              {isSelf && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                  (Tú)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              @{user.username} {user.email && `• ${user.email}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          {user.role || 'Usuario'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 size={12} /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800">
                            <XCircle size={12} /> Inhabilitado
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 items-center">
                          {user.companies && user.companies.length > 0 ? (
                            user.companies.map((c: any) => (
                              <span
                                key={c.id || c.companyId}
                                className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs border border-indigo-100 dark:border-indigo-800"
                              >
                                {c.commercialName || c.legalName || c.name || 'Empresa'}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">Sin empresas asignadas</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle Status (Inhabilitar / Habilitar) */}
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={isSelf || isToggling}
                            title={
                              isSelf 
                                ? 'No puedes inhabilitar tu propia cuenta' 
                                : isActive 
                                ? 'Inhabilitar usuario (bloquear acceso)' 
                                : 'Habilitar usuario (permitir acceso)'
                            }
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSelf 
                                ? 'opacity-30 cursor-not-allowed text-gray-400' 
                                : isActive 
                                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30' 
                                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                            }`}
                          >
                            {isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                          </button>

                          {/* Assign Companies */}
                          <button
                            onClick={() => setSelectedUser(user)}
                            title="Asignar / Gestionar Empresas"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          >
                            <Building2 size={18} />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setResetUser(user);
                              setNewAdminPassword('');
                            }}
                            title="Restablecer Contraseña"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          >
                            <Key size={18} />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => setUserToDelete(user)}
                            disabled={isSelf}
                            title={isSelf ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario permanentemente'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSelf 
                                ? 'opacity-30 cursor-not-allowed text-gray-400' 
                                : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
                            }`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Asignación de Empresas */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Building2 className="text-indigo-600" size={20} />
                  Empresas Asignadas
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Usuario: <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedUser.fullName || selectedUser.username}</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedUser(null)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* List of current assigned companies */}
            <div className="mb-5 space-y-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Empresas con acceso:</p>
              {selectedUser.companies && selectedUser.companies.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {selectedUser.companies.map((c: any) => (
                    <div 
                      key={c.id || c.companyId} 
                      className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/60 rounded-xl border border-gray-200 dark:border-gray-600 text-sm"
                    >
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {c.commercialName || c.legalName || c.name}
                      </span>
                      <button 
                        onClick={() => handleRemoveCompany(Number(c.id || c.companyId))}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 text-xs font-medium flex items-center gap-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Desvincular empresa"
                      >
                        <Trash2 size={14} /> Quitar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Este usuario no tiene acceso a ninguna empresa aún.
                  </p>
                </div>
              )}
            </div>

            {/* Form to assign a new company */}
            <form onSubmit={handleAssignCompany} className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                Asignar Nueva Empresa
              </label>
              {(() => {
                const assignedIds = new Set((selectedUser.companies || []).map((c: any) => c.id || c.companyId));
                const availableCompanies = companies.filter(c => !assignedIds.has(c.id));

                if (availableCompanies.length === 0) {
                  return (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium py-2">
                      ✓ El usuario ya tiene acceso a todas las empresas disponibles.
                    </p>
                  );
                }
                return (
                  <div className="flex gap-2">
                    <select
                      className="flex-1 border border-gray-300 dark:border-gray-600 p-2.5 dark:bg-gray-700 rounded-xl bg-white text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      value={selectedCompanyId}
                      onChange={e => setSelectedCompanyId(e.target.value)}
                    >
                      <option value="">-- Seleccionar Empresa --</option>
                      {availableCompanies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.commercialName || c.legalName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={!selectedCompanyId}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Asignar
                    </button>
                  </div>
                );
              })()}
            </form>
          </div>
        </div>
      )}

      {/* Modal: Restablecer Contraseña */}
      {resetUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Key className="text-amber-500" size={20} />
                  Restablecer Contraseña
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Usuario: <span className="font-semibold text-gray-800 dark:text-gray-200">{resetUser.fullName || resetUser.username}</span>
                </p>
              </div>
              <button 
                onClick={() => setResetUser(null)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdminResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nueva Contraseña Temporal *
                </label>
                <input 
                  type="password" 
                  required 
                  minLength={6} 
                  placeholder="Mínimo 6 caracteres" 
                  value={newAdminPassword} 
                  onChange={e => setNewAdminPassword(e.target.value)} 
                  className="w-full border border-gray-300 dark:border-gray-600 p-2.5 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500" 
                />
              </div>
              <div className="flex justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setResetUser(null)} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isResetting} 
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isResetting ? 'Guardando...' : 'Restablecer Clave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmación de Eliminación */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md shadow-2xl border border-red-100 dark:border-gray-700">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
              <div className="p-2.5 bg-red-100 dark:bg-red-900/40 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Eliminar Usuario</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-950/30 p-3.5 rounded-xl border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 my-4 space-y-1">
              <p className="font-semibold">¿Estás seguro de que deseas eliminar permanentemente a:</p>
              <p className="font-bold text-sm text-red-900 dark:text-red-200">
                {userToDelete.fullName || userToDelete.username} (@{userToDelete.username})
              </p>
              <p className="text-[11px] text-red-600 dark:text-red-400 pt-1">
                Se eliminarán sus asignaciones a empresas y accesos al sistema.
              </p>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Eliminar Definitivamente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
