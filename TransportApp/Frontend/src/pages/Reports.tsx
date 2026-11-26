import React, { useState, useEffect, useMemo } from 'react';
import {
  FileBarChart,
  Printer,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  RotateCcw,
  Wrench,
  ShoppingCart,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { workshopService } from '../services/workshopService';
import { purchasingService } from '../services/purchasingService';
import { useAuthStore } from '../store/authStore';
import type { ServiceRequest, PurchaseInvoice } from '../types';

export interface DailyReportRow {
  id: string;
  plate: string;
  activity: string;
  responsible: string;
  transportManager: string;
  observations: string;
  isManual?: boolean;
}

export interface DailyLogEvent {
  logId: number;
  ticketId: number;
  time: string;
  plate: string;
  responsible: string;
  mechanic: string;
  note: string;
}

export interface DailyTicketEvent {
  ticketId: number;
  eventType: 'CREADO' | 'COMPLETADO' | 'CREADO Y COMPLETADO';
  plate: string;
  responsible: string;
  repairType: string;
  summary: string;
  status: string;
}

export interface DailyPurchaseEvent {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  itemDescription: string;
  quantityTotal: number;
  unitCost: number;
  destinationType: 'VEHICULO' | 'INVENTARIO' | 'MIXTO';
  targetPlate?: string;
  targetOtId?: number;
  qtyToVehicle: number;
  qtyToInventory: number;
}

const getTodayYmd = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toLocalYmd = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr.substring(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const matchesSelectedDate = (dateStr: string | undefined | null, targetYmd: string): boolean => {
  if (!dateStr || !targetYmd) return false;
  const rawPrefix = dateStr.substring(0, 10);
  if (rawPrefix === targetYmd) return true;
  return toLocalYmd(dateStr) === targetYmd;
};

const formatDmy = (ymd: string): string => {
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

export default function Reports() {
  const { selectedCompany } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);

  const [selectedDate, setSelectedDate] = useState<string>(getTodayYmd());
  const [transportManager, setTransportManager] = useState<string>(
    () => localStorage.getItem('daily_report_manager') || 'RIZZY HEREDIA'
  );
  const [rows, setRows] = useState<DailyReportRow[]>([]);
  const [minPrintRows, setMinPrintRows] = useState<number>(20);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [reqsData, invsData] = await Promise.all([
          workshopService.getRequests(),
          purchasingService.getPurchaseInvoices()
        ]);
        setRequests(reqsData || []);
        setInvoices(invsData || []);
      } catch (err) {
        console.error('Error loading daily report data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [selectedCompany]);

  const handleManagerChange = (val: string) => {
    const upper = val.toUpperCase();
    setTransportManager(upper);
    localStorage.setItem('daily_report_manager', upper);
    setRows(prev => prev.map(r => ({ ...r, transportManager: upper })));
  };

  // Find the most recent date that has any activity (logs, tickets, or invoices)
  const latestActiveDate = useMemo(() => {
    const dates = new Set<string>();
    requests.forEach(r => {
      if (r.dateRequested) dates.add(toLocalYmd(r.dateRequested));
      if (r.execution?.dateCompleted) dates.add(toLocalYmd(r.execution.dateCompleted));
      r.logs?.forEach(l => {
        if (l.createdAt) dates.add(toLocalYmd(l.createdAt));
      });
    });
    invoices.forEach(inv => {
      if (!inv.isCancelled && inv.dateIssued) {
        dates.add(inv.dateIssued.substring(0, 10));
      }
    });
    const sorted = Array.from(dates).filter(Boolean).sort().reverse();
    return sorted[0] || getTodayYmd();
  }, [requests, invoices]);

  // Extract detailed breakdown & consolidated rows for selectedDate
  const dailyData = useMemo(() => {
    const logEvents: DailyLogEvent[] = [];
    const ticketEvents: DailyTicketEvent[] = [];
    const purchaseEvents: DailyPurchaseEvent[] = [];

    // Map by unit key (plate) to consolidate into the official Daily Work Report rows
    const unitMap = new Map<
      string,
      {
        plate: string;
        activities: Set<string>;
        responsible: string;
        observations: Set<string>;
      }
    >();

    const ensureUnit = (plate: string, responsibleFallback: string) => {
      const key = plate.trim().toUpperCase() || 'SIN PLACA';
      if (!unitMap.has(key)) {
        unitMap.set(key, {
          plate: key,
          activities: new Set<string>(),
          responsible: responsibleFallback.toUpperCase() || 'SIN CHOFER',
          observations: new Set<string>()
        });
      } else {
        const entry = unitMap.get(key)!;
        if (
          (entry.responsible === 'SIN CHOFER' || entry.responsible === 'ALMACÉN') &&
          responsibleFallback &&
          responsibleFallback.toUpperCase() !== 'SIN CHOFER'
        ) {
          entry.responsible = responsibleFallback.toUpperCase();
        }
      }
      return unitMap.get(key)!;
    };

    // 1. Process Service Requests (Tickets Created, Completed, Progress Logs, and Warehouse Parts Consumed)
    requests.forEach(req => {
      const plate = (req.vehicle?.licensePlate || req.trailer?.licensePlate || 'SIN PLACA').toUpperCase();
      const driverName = (
        req.driver?.name ||
        (req.vehicle?.brand ? `${req.vehicle.brand}` : req.trailer?.type || 'SIN CHOFER')
      ).toUpperCase();

      const createdToday = matchesSelectedDate(req.dateRequested, selectedDate);
      const completedToday = Boolean(
        req.execution?.dateCompleted && matchesSelectedDate(req.execution.dateCompleted, selectedDate)
      );

      // A. Bitácora de Progreso (Logs) on selectedDate
      const logsToday = (req.logs || []).filter(l => matchesSelectedDate(l.createdAt, selectedDate));
      logsToday.forEach(l => {
        const timeStr = new Date(l.createdAt).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
        logEvents.push({
          logId: l.id,
          ticketId: req.id,
          time: timeStr,
          plate,
          responsible: driverName,
          mechanic: req.mechanic?.name || 'Taller',
          note: l.note
        });

        const unit = ensureUnit(plate, driverName);
        if (l.note?.trim()) {
          unit.activities.add(l.note.trim().toUpperCase());
        }
      });

      // B. Ticket Created or Completed on selectedDate
      if (createdToday || completedToday) {
        const acts = (req.activities || []).map(a => a.description.trim()).filter(Boolean);
        const actSummary = acts.length > 0 ? acts.join(', ') : (req.description || 'MANTENIMIENTO GENERAL');

        ticketEvents.push({
          ticketId: req.id,
          eventType: createdToday && completedToday ? 'CREADO Y COMPLETADO' : createdToday ? 'CREADO' : 'COMPLETADO',
          plate,
          responsible: driverName,
          repairType: req.repairType || 'Correctiva',
          summary: actSummary,
          status: req.status
        });

        const unit = ensureUnit(plate, driverName);
        if (acts.length > 0) {
          acts.forEach(a => unit.activities.add(a.toUpperCase()));
        } else if (req.description?.trim()) {
          unit.activities.add(req.description.trim().toUpperCase());
        }

        if (completedToday) {
          const finalObs = req.execution?.finalObservations?.trim().toUpperCase() || 'OPERATIVO';
          unit.observations.add(finalObs);
        }
      }

      // C. Warehouse parts used on selectedDate (that were NOT from a purchase invoice already counted below)
      const usedPartsToday = (req.execution?.usedSpareParts || []).filter(
        usp =>
          !usp.purchaseInvoiceDetailId &&
          ((usp.createdAt && matchesSelectedDate(usp.createdAt, selectedDate)) ||
            (!usp.createdAt && completedToday))
      );

      usedPartsToday.forEach(usp => {
        const unit = ensureUnit(plate, driverName);
        const partLabel = (usp.description || usp.sparePart?.name || 'REPUESTO').trim().toUpperCase();
        const numQty = Number(usp.quantity);
        const qtyStr = Number.isInteger(numQty) ? String(numQty).padStart(2, '0') : String(numQty);
        const uAbbr = (usp.unitOfMeasure?.abbreviation || usp.sparePart?.unitOfMeasure?.abbreviation || '').trim().toUpperCase();
        const unitSuffix = uAbbr && uAbbr !== 'UND' && uAbbr !== 'UNI' ? ` ${uAbbr}` : '';
        unit.activities.add(`${qtyStr}${unitSuffix} ${partLabel}`);
      });
    });

    // 2. Process Purchase Invoices (Compras cargadas ese día -> Enviadas a Vehículo vs Inventario)
    invoices
      .filter(inv => !inv.isCancelled && matchesSelectedDate(inv.dateIssued, selectedDate))
      .forEach(inv => {
        const supName = inv.supplier?.name || 'Proveedor';
        (inv.details || []).forEach((d, idx) => {
          const itemDesc = (
            d.description ||
            d.sparePart?.name ||
            d.purchaseRequisition?.partNameOrDescription ||
            'ARTÍCULO COMPRADO'
          )
            .trim()
            .toUpperCase();

          const veh = d.vehicle || d.purchaseRequisition?.serviceRequest?.vehicle;
          const trl = d.trailer || d.purchaseRequisition?.serviceRequest?.trailer;
          const targetPlate = (veh?.licensePlate || trl?.licensePlate || '').toUpperCase();
          const targetOtId = d.purchaseRequisition?.serviceRequestId;

          // Look up driver/responsible if linked to a ticket
          const linkedTicket = targetOtId ? requests.find(r => r.id === targetOtId) : undefined;
          const driverName = (
            linkedTicket?.driver?.name ||
            veh?.brand ||
            trl?.type ||
            'SIN CHOFER'
          ).toUpperCase();

          const totalQty = Number(d.quantityReceived) || 0;
          const reqQty = Number(d.purchaseRequisition?.quantity) || 0;

          let destinationType: 'VEHICULO' | 'INVENTARIO' | 'MIXTO' = 'INVENTARIO';
          let qtyToVehicle = 0;
          let qtyToInventory = totalQty;

          if (targetPlate || targetOtId) {
            if (reqQty > 0 && totalQty > reqQty) {
              destinationType = 'MIXTO';
              qtyToVehicle = reqQty;
              qtyToInventory = totalQty - reqQty;
            } else {
              destinationType = 'VEHICULO';
              qtyToVehicle = totalQty;
              qtyToInventory = 0;
            }
          }

          purchaseEvents.push({
            id: `${inv.id}-${d.id || idx}`,
            invoiceNumber: inv.invoiceNumber,
            supplierName: supName,
            itemDescription: itemDesc,
            quantityTotal: totalQty,
            unitCost: Number(d.unitCost) || 0,
            destinationType,
            targetPlate: targetPlate || undefined,
            targetOtId: targetOtId || undefined,
            qtyToVehicle,
            qtyToInventory
          });

          // Add to unit row if sent to a vehicle
          if (qtyToVehicle > 0 && targetPlate) {
            const unit = ensureUnit(targetPlate, driverName);
            const qtyStr = String(qtyToVehicle).padStart(2, '0');
            unit.activities.add(`*${qtyStr} ${itemDesc} (COMPRAS)`);
          }

          // Add to INVENTARIO / ALMACÉN row if sent to warehouse stock
          if (qtyToInventory > 0) {
            const stockUnit = ensureUnit('INVENTARIO', 'ALMACÉN');
            const qtyStr = String(qtyToInventory).padStart(2, '0');
            stockUnit.activities.add(`*${qtyStr} ${itemDesc} (COMPRA P/ STOCK - FACT. #${inv.invoiceNumber})`);
          }
        });
      });

    // Build consolidated rows array
    const autoRows: DailyReportRow[] = Array.from(unitMap.values()).map((u, idx) => ({
      id: `auto-${idx}-${u.plate}`,
      plate: u.plate,
      activity: Array.from(u.activities).join(', '),
      responsible: u.responsible,
      transportManager: transportManager,
      observations: Array.from(u.observations).join(', ')
    }));

    return {
      logEvents,
      ticketEvents,
      purchaseEvents,
      autoRows
    };
  }, [requests, invoices, selectedDate, transportManager]);

  // Synchronize editable rows whenever selectedDate or autoRows change
  useEffect(() => {
    setRows(dailyData.autoRows);
  }, [dailyData.autoRows]);

  const shiftDate = (days: number) => {
    const parts = selectedDate.split('-').map(Number);
    if (parts.length !== 3) return;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const updateRowField = (index: number, field: keyof DailyReportRow, value: string) => {
    setRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addManualRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        plate: '',
        activity: '',
        responsible: '',
        transportManager: transportManager,
        observations: '',
        isManual: true
      }
    ]);
  };

  const removeRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  // Dedicated Landscape Print Function matching the user's physical sheet format
  const handlePrintDailyReport = () => {
    const totalRowsCount = Math.max(minPrintRows, rows.length);
    const paddedRows: Array<DailyReportRow | null> = [];
    for (let i = 0; i < totalRowsCount; i++) {
      paddedRows.push(rows[i] || null);
    }

    const escapeHtml = (str?: string | null) =>
      String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const dmy = formatDmy(selectedDate);

    const rowsHtml = paddedRows
      .map((r, idx) => {
        const itemNum = idx + 1;
        return `
          <tr>
            <td class="col-item">${itemNum}</td>
            <td class="col-plate">${escapeHtml(r?.plate || '')}</td>
            <td class="col-activity">${escapeHtml(r?.activity || '')}</td>
            <td class="col-resp">${escapeHtml(r?.responsible || '')}</td>
            <td class="col-mgr">${escapeHtml(r ? r.transportManager : '')}</td>
            <td class="col-obs">${escapeHtml(r?.observations || '')}</td>
          </tr>
        `;
      })
      .join('');

    const printWindow = window.open('', '_blank', 'width=1100,height=780');
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes para imprimir el Reporte Diario de Trabajo.');
      return;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Reporte Diario de Trabajo del ${dmy}</title>
  <style>
    @page {
      size: letter landscape;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #ffffff;
      color: #000000;
      padding: 16px;
    }
    .toolbar {
      background: #111827;
      color: #ffffff;
      padding: 10px 20px;
      margin-bottom: 16px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .toolbar button {
      background: #ffffff;
      color: #000000;
      border: none;
      padding: 7px 16px;
      border-radius: 6px;
      font-weight: 800;
      cursor: pointer;
    }
    .title-banner {
      background: #52525b;
      color: #ffffff;
      text-align: center;
      font-size: 11pt;
      font-weight: 900;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      padding: 5px 10px;
      border: 1.5px solid #000000;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000000;
      table-layout: fixed;
    }
    thead th {
      background: #52525b;
      color: #ffffff;
      font-size: 8.5pt;
      font-weight: 900;
      text-transform: uppercase;
      text-align: center;
      padding: 6px 4px;
      border: 1px solid #000000;
      line-height: 1.15;
    }
    tbody td {
      border: 1px solid #000000;
      padding: 4px 6px;
      font-size: 8.5pt;
      font-weight: 700;
      color: #000000;
      text-transform: uppercase;
      height: 22px;
      vertical-align: middle;
      overflow: hidden;
    }
    tbody tr:nth-child(even) {
      background: #fafafa;
    }
    .col-item {
      width: 38px;
      text-align: center;
      font-weight: 800;
    }
    .col-plate {
      width: 88px;
      text-align: center;
      font-weight: 900;
    }
    .col-activity {
      width: auto;
      text-align: center;
      word-break: break-word;
    }
    .col-resp {
      width: 145px;
      text-align: center;
    }
    .col-mgr {
      width: 135px;
      text-align: center;
    }
    .col-obs {
      width: 130px;
      text-align: center;
      font-weight: 800;
    }
    @media print {
      body {
        padding: 0;
      }
      .toolbar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div>
      <strong>Vista Previa Oficial: REPORTE DIARIO DE TRABAJO DEL ${dmy}</strong>
      <div style="font-size: 11px; color: #d1d5db;">Formato Horizontal (Carta Landscape) • Listo para imprimir</div>
    </div>
    <button onclick="window.print()">🖨️ Imprimir Reporte</button>
  </div>

  <div class="title-banner">
    REPORTE DIARIO DE TRABAJO DEL ${dmy}
  </div>

  <table>
    <thead>
      <tr>
        <th class="col-item">ITEM</th>
        <th class="col-plate">PLACA</th>
        <th class="col-activity">ACTIVIDAD</th>
        <th class="col-resp">RESPONSABLE DE LA<br/>UNIDAD</th>
        <th class="col-mgr">GERENTE TRANSPORTE</th>
        <th class="col-obs">OBSERVACIONES</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  const purchasesToVehicleCount = dailyData.purchaseEvents.filter(
    p => p.destinationType === 'VEHICULO' || p.destinationType === 'MIXTO'
  ).length;
  const purchasesToInventoryCount = dailyData.purchaseEvents.filter(
    p => p.destinationType === 'INVENTARIO' || p.destinationType === 'MIXTO'
  ).length;

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileBarChart className="text-indigo-600 dark:text-indigo-400" size={32} />
            Reporte Diario de Trabajo
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Consolidado diario de bitácoras de taller, tickets creados/cerrados y compras (enviadas a vehículos o a inventario).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={addManualRow}
            className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus size={15} /> Agregar Fila Manual
          </button>

          <button
            type="button"
            onClick={() => setRows(dailyData.autoRows)}
            className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Restablecer filas con los datos automáticos de la fecha seleccionada"
          >
            <RotateCcw size={14} /> Sincronizar Datos
          </button>

          <button
            type="button"
            onClick={handlePrintDailyReport}
            className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Printer size={17} /> Imprimir Reporte Diario
          </button>
        </div>
      </div>

      {/* Date & Manager Control Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mr-1">
            <Calendar size={15} className="text-indigo-600 dark:text-indigo-400" /> Fecha del Reporte:
          </span>

          <button
            type="button"
            onClick={() => shiftDate(-1)}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
            title="Día anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          <button
            type="button"
            onClick={() => shiftDate(1)}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
            title="Día siguiente"
          >
            <ChevronRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(getTodayYmd())}
            className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold hover:bg-indigo-100 cursor-pointer"
          >
            Hoy
          </button>

          {latestActiveDate && latestActiveDate !== selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(latestActiveDate)}
              className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold hover:bg-amber-100 flex items-center gap-1.5 cursor-pointer"
              title="Saltar a la fecha más reciente con actividad registrada"
            >
              <Sparkles size={13} /> Ir a última fecha con actividad ({formatDmy(latestActiveDate)})
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Gerente Transporte:
            </label>
            <input
              type="text"
              value={transportManager}
              onChange={e => handleManagerChange(e.target.value)}
              placeholder="Ej. RIZZY HEREDIA"
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs font-bold text-gray-900 dark:text-white uppercase focus:ring-2 focus:ring-indigo-500 outline-none w-44"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Mín. Filas Impresión:
            </label>
            <select
              value={minPrintRows}
              onChange={e => setMinPrintRows(Number(e.target.value))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-xs font-bold text-gray-900 dark:text-white outline-none"
            >
              <option value={15}>15 filas</option>
              <option value={20}>20 filas (Estándar)</option>
              <option value={25}>25 filas</option>
              <option value={30}>30 filas</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 Daily Activity Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Wrench size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Bitácora del Día
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {dailyData.logEvents.length}
            </p>
            <p className="text-[11px] text-gray-500">Avances registrados en tickets</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Tickets Nuevos / Cerrados
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {dailyData.ticketEvents.length}
            </p>
            <p className="text-[11px] text-gray-500">Órdenes de servicio del día</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Truck size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Compras ➔ A Vehículos
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {purchasesToVehicleCount}
            </p>
            <p className="text-[11px] text-gray-500">Renglones asignados a unidades</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Package size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Compras ➔ A Inventario
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {purchasesToInventoryCount}
            </p>
            <p className="text-[11px] text-gray-500">Renglones enviados a stock almacén</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center text-gray-500 border border-gray-200 dark:border-gray-700">
          <Loader2 className="animate-spin mx-auto mb-2" size={28} />
          Cargando movimientos del día...
        </div>
      ) : (
        <>
          {/* OFFICIAL EDITABLE DAILY WORK REPORT SHEET */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-300 dark:border-gray-700 overflow-hidden">
            {/* Dark Banner Title matching physical sheet */}
            <div className="bg-zinc-600 dark:bg-zinc-700 text-white text-center py-2.5 px-4 font-black text-sm tracking-wider uppercase border-b border-gray-300 dark:border-gray-600 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-200 hidden sm:inline">
                Planilla Editable • Puedes ajustar cualquier celda antes de imprimir
              </span>
              <span className="mx-auto">REPORTE DIARIO DE TRABAJO DEL {formatDmy(selectedDate)}</span>
              <span className="text-[11px] font-semibold text-zinc-200 hidden sm:inline">
                {rows.length} {rows.length === 1 ? 'unidad activa' : 'unidades activas'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-600/90 dark:bg-zinc-800 text-white text-xs font-extrabold uppercase tracking-wider border-b border-gray-300 dark:border-gray-700">
                    <th className="py-2.5 px-2 text-center border-r border-zinc-500 w-12">ITEM</th>
                    <th className="py-2.5 px-3 text-center border-r border-zinc-500 w-32">PLACA</th>
                    <th className="py-2.5 px-3 text-center border-r border-zinc-500 min-w-[320px]">ACTIVIDAD</th>
                    <th className="py-2.5 px-3 text-center border-r border-zinc-500 w-48">
                      RESPONSABLE DE LA UNIDAD
                    </th>
                    <th className="py-2.5 px-3 text-center border-r border-zinc-500 w-44">
                      GERENTE TRANSPORTE
                    </th>
                    <th className="py-2.5 px-3 text-center border-r border-zinc-500 w-40">
                      OBSERVACIONES
                    </th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-500 dark:text-gray-400 space-y-2">
                        <p className="font-semibold">
                          No se registraron movimientos en bitácora, tickets nuevos ni compras en la fecha{' '}
                          <strong>{formatDmy(selectedDate)}</strong>.
                        </p>
                        <div className="flex items-center justify-center gap-3 pt-1">
                          {latestActiveDate && latestActiveDate !== selectedDate && (
                            <button
                              type="button"
                              onClick={() => setSelectedDate(latestActiveDate)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                            >
                              Ver última fecha con movimientos ({formatDmy(latestActiveDate)})
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={addManualRow}
                            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            + Agregar fila manual
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, index) => (
                      <tr
                        key={r.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                      >
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                          {index + 1}
                        </td>
                        <td className="p-1 border-r border-gray-200 dark:border-gray-700">
                          <input
                            type="text"
                            value={r.plate}
                            onChange={e => updateRowField(index, 'plate', e.target.value.toUpperCase())}
                            placeholder="PLACA"
                            className="w-full text-center font-mono font-black text-gray-900 dark:text-white bg-transparent focus:bg-white dark:focus:bg-gray-900 rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                          />
                        </td>
                        <td className="p-1 border-r border-gray-200 dark:border-gray-700">
                          <input
                            type="text"
                            value={r.activity}
                            onChange={e => updateRowField(index, 'activity', e.target.value.toUpperCase())}
                            placeholder="DESCRIPCIÓN DE LA ACTIVIDAD REALIZADA / COMPRAS..."
                            className="w-full text-center font-bold text-gray-900 dark:text-white bg-transparent focus:bg-white dark:focus:bg-gray-900 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                          />
                        </td>
                        <td className="p-1 border-r border-gray-200 dark:border-gray-700">
                          <input
                            type="text"
                            value={r.responsible}
                            onChange={e => updateRowField(index, 'responsible', e.target.value.toUpperCase())}
                            placeholder="CHOFER / RESPONSABLE"
                            className="w-full text-center font-semibold text-gray-800 dark:text-gray-200 bg-transparent focus:bg-white dark:focus:bg-gray-900 rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                          />
                        </td>
                        <td className="p-1 border-r border-gray-200 dark:border-gray-700">
                          <input
                            type="text"
                            value={r.transportManager}
                            onChange={e => updateRowField(index, 'transportManager', e.target.value.toUpperCase())}
                            placeholder="GERENTE"
                            className="w-full text-center font-semibold text-gray-800 dark:text-gray-200 bg-transparent focus:bg-white dark:focus:bg-gray-900 rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                          />
                        </td>
                        <td className="p-1 border-r border-gray-200 dark:border-gray-700">
                          <input
                            type="text"
                            value={r.observations}
                            onChange={e => updateRowField(index, 'observations', e.target.value.toUpperCase())}
                            placeholder="OBSERVACIONES..."
                            className="w-full text-center font-bold text-gray-900 dark:text-white bg-transparent focus:bg-white dark:focus:bg-gray-900 rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                          />
                        </td>
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                            title="Quitar fila del reporte"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DETAILED BREAKDOWN BY SOURCE (3 SECTIONS) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Bitácora de Progreso en esa fecha */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Wrench size={15} className="text-indigo-600 dark:text-indigo-400" />
                  1. Bitácora de Progreso ({dailyData.logEvents.length})
                </h3>
              </div>
              <div className="p-4 flex-1 divide-y divide-gray-100 dark:divide-gray-700/60 max-h-80 overflow-y-auto">
                {dailyData.logEvents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-6">
                    Sin notas cargadas en la bitácora de progreso en esta fecha.
                  </p>
                ) : (
                  dailyData.logEvents.map(ev => (
                    <div key={ev.logId} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                          {ev.plate} •{' '}
                          <Link to={`/workshop/${ev.ticketId}`} className="hover:underline">
                            OT #{String(ev.ticketId).padStart(4, '0')}
                          </Link>
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock size={11} /> {ev.time}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white uppercase">
                        {ev.note}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Mecánico: {ev.mechanic} • Resp: {ev.responsible}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Tickets Creados o Cerrados en esa fecha */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <FileText size={15} className="text-blue-600 dark:text-blue-400" />
                  2. Tickets del Día ({dailyData.ticketEvents.length})
                </h3>
              </div>
              <div className="p-4 flex-1 divide-y divide-gray-100 dark:divide-gray-700/60 max-h-80 overflow-y-auto">
                {dailyData.ticketEvents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-6">
                    No se abrieron ni cerraron tickets en esta fecha.
                  </p>
                ) : (
                  dailyData.ticketEvents.map(t => (
                    <div key={`${t.ticketId}-${t.eventType}`} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-extrabold text-gray-900 dark:text-white">
                          {t.plate} •{' '}
                          <Link
                            to={`/workshop/${t.ticketId}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            OT #{String(t.ticketId).padStart(4, '0')}
                          </Link>
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            t.eventType.includes('COMPLETADO')
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {t.eventType}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase">
                        {t.summary}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Tipo: {t.repairType} • Resp: {t.responsible}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Compras Cargadas y Destino (Vehículo vs Inventario) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <ShoppingCart size={15} className="text-emerald-600 dark:text-emerald-400" />
                  3. Compras y Destino ({dailyData.purchaseEvents.length})
                </h3>
              </div>
              <div className="p-4 flex-1 divide-y divide-gray-100 dark:divide-gray-700/60 max-h-80 overflow-y-auto">
                {dailyData.purchaseEvents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-6">
                    No se registraron facturas de compra en esta fecha.
                  </p>
                ) : (
                  dailyData.purchaseEvents.map(p => (
                    <div key={p.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {p.quantityTotal}x {p.itemDescription}
                        </span>
                        <span className="font-mono text-[11px] text-gray-500">
                          Fact. #{p.invoiceNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">
                        Proveedor: <strong>{p.supplierName}</strong> (${p.unitCost.toFixed(2)} c/u)
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {p.qtyToVehicle > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <Truck size={11} /> ➔ Enviado a Vehículo {p.targetPlate || ''}{' '}
                            {p.targetOtId ? `(OT #${String(p.targetOtId).padStart(4, '0')})` : ''} ({p.qtyToVehicle} und)
                          </span>
                        )}
                        {p.qtyToInventory > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Package size={11} /> ➔ Enviado a Inventario / Stock ({p.qtyToInventory} und)
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
