import { useState, useEffect } from 'react';
import { FileBarChart, PieChart, ClipboardList, Truck, Package, ShoppingCart, AlertCircle, Download, Printer, Search } from 'lucide-react';
import { fleetService } from '../services/fleetService';
import { inventoryService } from '../services/inventoryService';
import { workshopService } from '../services/workshopService';
import { Link } from 'react-router-dom';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalTrailers: 0,
    lowStockItems: 0,
    pendingServices: 0,
    totalStockValue: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [vehicles, trailers, spareParts, requests] = await Promise.all([
          fleetService.getVehicles(),
          fleetService.getTrailers(),
          inventoryService.getSpareParts(),
          workshopService.getRequests()
        ]);

        const lowStock = spareParts.filter(p => p.currentStock <= p.minStock).length;
        const pending = requests.filter(r => r.status !== 'Completado').length;
        const stockValue = spareParts.reduce((acc, p) => acc + (p.currentStock * (p.unitPrice || 0)), 0);

        setStats({
          totalVehicles: vehicles.length,
          totalTrailers: trailers.length,
          lowStockItems: lowStock,
          pendingServices: pending,
          totalStockValue: stockValue
        });
      } catch (error) {
        console.error('Error fetching report stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const reportCards = [
    {
      title: 'Reporte de Flota',
      description: 'Estado actual, mantenimientos preventivos y alertas de kilometraje.',
      icon: <Truck size={24} className="text-blue-500" />,
      link: '/fleet',
      action: 'Ver Detalle'
    },
    {
      title: 'Inventario Crítico',
      description: 'Artículos con stock por debajo del mínimo y necesidades de reposición.',
      icon: <Package size={24} className="text-amber-500" />,
      link: '/inventory',
      action: 'Ver Stock'
    },
    {
      title: 'Historial de Taller',
      description: 'Resumen de reparaciones, costos de mano de obra y repuestos utilizados.',
      icon: <ClipboardList size={24} className="text-indigo-500" />,
      link: '/workshop',
      action: 'Ver Tickets'
    },
    {
      title: 'Gestión de Compras',
      description: 'Análisis de órdenes de compra, proveedores y facturación pendiente.',
      icon: <ShoppingCart size={24} className="text-emerald-500" />,
      link: '/purchasing',
      action: 'Ver Compras'
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileBarChart className="text-indigo-600 dark:text-indigo-400" size={32} />
            Centro de Reportes
          </h1>
          <p className="text-gray-500 mt-1">Análisis operativo y financiero detallado de la empresa.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors">
             <Download size={18} /> Exportar Excel
           </button>
        </div>
      </div>

      {/* KPI Ribbons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase">Capacidad de Flota</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalVehicles + stats.totalTrailers}</h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">Unidades Totales</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase">Alertas Stock</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.lowStockItems}</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${stats.lowStockItems > 0 ? 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
              Bajo Mínimo
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase">Servicios Activos</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingServices}</h3>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full">En Proceso</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-sm font-medium text-gray-500 uppercase">Valor Inventario</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">${stats.totalStockValue.toLocaleString()}</h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-full">USD Estimado</span>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <PieChart size={22} className="text-indigo-500" /> Disponibles para Generar
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {reportCards.map((card, i) => (
          <div key={i} className="group bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all hover:border-indigo-300 dark:hover:border-indigo-700 flex items-start gap-5">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-colors">
              {card.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{card.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{card.description}</p>
              <Link to={card.link} className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                {card.action} →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Audit Quick View */}
      <div className="bg-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Trazabilidad Total</h2>
            <p className="text-indigo-100 max-w-md">Todos los movimientos del sistema son auditados en tiempo real. Puede consultar quién realizó cambios críticos en el log de auditoría.</p>
          </div>
          <Link to="/admin/audit" className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-900/20 hover:bg-indigo-50 transition-colors">
            Ver Logs de Auditoría
          </Link>
        </div>
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
      </div>
    </div>
  );
}
