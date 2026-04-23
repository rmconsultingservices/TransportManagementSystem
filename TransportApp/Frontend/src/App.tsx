import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Truck, Home, PackageOpen, Wrench, Users, ShoppingCart, FileText, LogOut, Menu, X, ChevronDown, ChevronRight, List, SlidersHorizontal, Tags, Scale, MapPin } from 'lucide-react';
import { useAuthStore } from './store/authStore';

import Fleet from './pages/Fleet';
import Inventory from './pages/Inventory';
import Workshop from './pages/Workshop';
import ServiceExecutionDetail from './pages/ServiceExecutionDetail';
import Staff from './pages/Staff';
import Purchasing from './pages/Purchasing';
import Invoices from './pages/Invoices';
import Login from './pages/Login';
import CompanySelect from './pages/CompanySelect';
import Companies from './pages/Companies';
import UsersAdmin from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import PrintServiceReport from './pages/PrintServiceReport';
import PrintPurchaseOrder from './pages/PrintPurchaseOrder';
import InventoryAdjustments from './pages/InventoryAdjustments';
import InventoryCategories from './pages/InventoryCategories';
import UnitsOfMeasure from './pages/UnitsOfMeasure';
import Warehouses from './pages/Warehouses';
import Locations from './pages/Locations';
import { Shield, Building2, History } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import VehicleDetail from './pages/VehicleDetail';

const ProtectedRoute = () => {
  const { token, selectedCompany } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!selectedCompany) return <Navigate to="/select-company" replace />;
  return <Outlet />;
};

function Layout() {
  const { user, selectedCompany, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInventoryExpanded, setIsInventoryExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleInventory = () => setIsInventoryExpanded(!isInventoryExpanded);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-between px-4 lg:justify-center border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Truck size={24} /> <span className="hidden lg:inline">ERP Transporte</span><span className="lg:hidden">ERP</span>
          </h2>
          <button onClick={closeSidebar} className="lg:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
             <X size={24} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            <li><Link onClick={closeSidebar} to="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><Home size={20} className="text-gray-500" /> Inicio</Link></li>
            <li><Link onClick={closeSidebar} to="/fleet" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><Truck size={20} className="text-gray-500" /> Flota</Link></li>
            
            {/* Inventory Accordion Menu */}
            <li>
              <button 
                onClick={toggleInventory} 
                className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <PackageOpen size={20} className="text-gray-500" />
                  <span>Inventario</span>
                </div>
                {isInventoryExpanded ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
              </button>
              
              {isInventoryExpanded && (
                <ul className="mt-1 space-y-1 pl-9 pr-3 pb-2 animate-in slide-in-from-top-2 duration-200">
                  <li><Link onClick={closeSidebar} to="/inventory" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"><List size={16} className="text-gray-400" /> Catálogo</Link></li>
                  <li><Link onClick={closeSidebar} to="/inventory/adjustments" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"><SlidersHorizontal size={16} className="text-gray-400" /> Ajustes</Link></li>
                  <li><Link onClick={closeSidebar} to="/inventory/categories" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"><Tags size={16} className="text-gray-400" /> Categorías</Link></li>
                  <li><Link onClick={closeSidebar} to="/inventory/units" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"><Scale size={16} className="text-gray-400" /> Unidades</Link></li>
                  <li><Link onClick={closeSidebar} to="/inventory/warehouses" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"><PackageOpen size={16} className="text-gray-400" /> Almacenes</Link></li>
                  <li><Link onClick={closeSidebar} to="/inventory/locations" className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"><MapPin size={16} className="text-gray-400" /> Ubicaciones</Link></li>
                </ul>
              )}
            </li>

            <li><Link onClick={closeSidebar} to="/workshop" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><Wrench size={20} className="text-gray-500" /> Taller</Link></li>
            <li><Link onClick={closeSidebar} to="/staff" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><Users size={20} className="text-gray-500" /> Personal</Link></li>
            <li><Link onClick={closeSidebar} to="/purchasing" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ShoppingCart size={20} className="text-gray-500" /> Compras</Link></li>
            <li><Link onClick={closeSidebar} to="/invoices" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><FileText size={20} className="text-gray-500" /> C. x P.</Link></li>
            
            {user?.isSuperAdmin && (
              <>
                <li className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Admin. Central
                </li>
                <li><Link onClick={closeSidebar} to="/admin/companies" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><Building2 size={20} className="text-gray-500" /> Empresas</Link></li>
                <li><Link onClick={closeSidebar} to="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><Shield size={20} className="text-gray-500" /> Usuarios</Link></li>
                <li><Link onClick={closeSidebar} to="/admin/audit" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><History size={20} className="text-gray-500" /> Auditoría</Link></li>
              </>
            )}
          </ul>
        </nav>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
         <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
           <div className="flex items-center gap-3">
             <button 
               onClick={toggleSidebar} 
               className="p-2 -ml-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden transition-colors"
             >
               <Menu size={24} />
             </button>
             <div className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2 sm:gap-4 flex-wrap">
               <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-200 truncate max-w-[120px] sm:max-w-xs">
                 🏢 {selectedCompany?.name}
               </span>
               <span className="hidden sm:inline">👤 {user?.fullName}</span>
             </div>
           </div>
           <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
             <LogOut size={18} /> <span className="hidden sm:inline">Salir</span>
           </button>
         </header>
         <div className="flex-1 overflow-y-auto">
           <Outlet />
         </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/select-company" element={<CompanySelect />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/fleet/vehicle/:id" element={<VehicleDetail type="vehicle" />} />
            <Route path="/fleet/trailer/:id" element={<VehicleDetail type="trailer" />} />

            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/adjustments" element={<InventoryAdjustments />} />
            <Route path="/inventory/categories" element={<InventoryCategories />} />
            <Route path="/inventory/units" element={<UnitsOfMeasure />} />
            <Route path="/inventory/warehouses" element={<Warehouses />} />
            <Route path="/inventory/locations" element={<Locations />} />
            <Route path="/workshop" element={<Workshop />} />
            <Route path="/workshop/:id" element={<ServiceExecutionDetail />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/purchasing" element={<Purchasing />} />
            <Route path="/invoices" element={<Invoices />} />
            
            <Route path="/admin/companies" element={<Companies />} />
            <Route path="/admin/users" element={<UsersAdmin />} />
            <Route path="/admin/audit" element={<AuditLogs />} />
          </Route>
          <Route path="/print/ticket/:id" element={<PrintServiceReport />} />
          <Route path="/print/order/:id" element={<PrintPurchaseOrder />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
