import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { QrCode, Printer, X, Search, CheckSquare, Square, MapPin, PackageOpen, Plus, Minus } from 'lucide-react';
import type { SparePart } from '../types';
import { formatSparePartName } from '../types';

interface QrLabelPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  spareParts: SparePart[];
  initialSelectedPart?: SparePart | null;
  companyName?: string;
}

export const QrLabelPrintModal: React.FC<QrLabelPrintModalProps> = ({
  isOpen,
  onClose,
  spareParts,
  initialSelectedPart,
  companyName = 'TRANSPORMETALS'
}) => {
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'with_stock'>('all');
  // Map of sparePartId -> number of label copies to print
  const [selectedQuantities, setSelectedQuantities] = useState<Record<number, number>>({});
  // Starting slot on the first 15-label sheet (1 to 15) to reuse partially used sheets
  const [startSlot, setStartSlot] = useState<number>(1);
  // Pre-rendered SVG strings by code
  const [qrSvgMap, setQrSvgMap] = useState<Record<string, string>>({});

  // Only physical products (exclude services unless explicitly clicked)
  const eligibleParts = useMemo(() => {
    return spareParts.filter(p => p.itemType !== 'Servicio');
  }, [spareParts]);

  const warehouses = useMemo(() => {
    return Array.from(new Set(eligibleParts.map(p => p.warehouse?.name || 'Sin Almacén'))).sort();
  }, [eligibleParts]);

  const locations = useMemo(() => {
    return Array.from(new Set(eligibleParts.map(p => p.location?.name || 'Sin Rack'))).sort();
  }, [eligibleParts]);

  useEffect(() => {
    if (isOpen) {
      if (initialSelectedPart) {
        setSelectedQuantities({ [initialSelectedPart.id]: 1 });
        setSearch(initialSelectedPart.code);
      } else {
        setSearch('');
      }
    }
  }, [isOpen, initialSelectedPart]);

  const filteredParts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return eligibleParts.filter(p => {
      const wName = p.warehouse?.name || 'Sin Almacén';
      const lName = p.location?.name || 'Sin Rack';
      if (warehouseFilter !== 'all' && wName !== warehouseFilter) return false;
      if (locationFilter !== 'all' && lName !== locationFilter) return false;
      if (stockFilter === 'with_stock' && (p.stockQuantity || 0) <= 0) return false;

      if (q) {
        const full = `${p.code} ${p.name} ${p.brand || ''} ${p.model || ''} ${lName} ${wName}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [eligibleParts, search, warehouseFilter, locationFilter, stockFilter]);

  // Expand selected items into flat array of labels according to copy count
  const expandedLabels = useMemo(() => {
    const list: SparePart[] = [];
    for (const part of spareParts) {
      const count = selectedQuantities[part.id] || 0;
      for (let i = 0; i < count; i++) {
        list.push(part);
      }
    }
    return list;
  }, [spareParts, selectedQuantities]);

  // Generate SVG QR codes for any selected parts
  useEffect(() => {
    let active = true;
    const uniqueCodes = Array.from(new Set(expandedLabels.map(p => p.code).filter(Boolean)));
    const missingCodes = uniqueCodes.filter(code => !qrSvgMap[code]);
    if (missingCodes.length === 0) return;

    Promise.all(
      missingCodes.map(async code => {
        try {
          const svg = await QRCode.toString(code, {
            type: 'svg',
            errorCorrectionLevel: 'M',
            margin: 0,
            color: { dark: '#000000', light: '#ffffff' }
          });
          return [code, svg] as const;
        } catch {
          return [code, ''] as const;
        }
      })
    ).then(entries => {
      if (!active) return;
      setQrSvgMap(prev => {
        const next = { ...prev };
        for (const [c, svg] of entries) {
          if (svg) next[c] = svg;
        }
        return next;
      });
    });

    return () => {
      active = false;
    };
  }, [expandedLabels, qrSvgMap]);

  if (!isOpen) return null;

  const togglePart = (partId: number) => {
    setSelectedQuantities(prev => {
      const next = { ...prev };
      if (next[partId] && next[partId] > 0) {
        delete next[partId];
      } else {
        next[partId] = 1;
      }
      return next;
    });
  };

  const setPartCopies = (partId: number, copies: number) => {
    setSelectedQuantities(prev => {
      const next = { ...prev };
      if (copies <= 0) {
        delete next[partId];
      } else {
        next[partId] = Math.min(99, copies);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const allSelected = filteredParts.length > 0 && filteredParts.every(p => (selectedQuantities[p.id] || 0) > 0);
    if (allSelected) {
      setSelectedQuantities(prev => {
        const next = { ...prev };
        filteredParts.forEach(p => delete next[p.id]);
        return next;
      });
    } else {
      setSelectedQuantities(prev => {
        const next = { ...prev };
        filteredParts.forEach(p => {
          if (!next[p.id]) next[p.id] = 1;
        });
        return next;
      });
    }
  };

  const totalLabelsCount = expandedLabels.length;
  const offsetBlanks = Math.max(0, Math.min(14, startSlot - 1));
  const totalSlotsUsed = offsetBlanks + totalLabelsCount;
  const totalSheets = Math.max(1, Math.ceil(totalSlotsUsed / 15));

  // Open dedicated clean print window calibrated for 6.40 cm x 3.80 cm (15 per Letter page: 3 cols x 5 rows)
  const handlePrintLabels = async () => {
    if (expandedLabels.length === 0) return;

    // Ensure all SVGs are ready
    const localSvgMap: Record<string, string> = { ...qrSvgMap };
    for (const part of expandedLabels) {
      if (part.code && !localSvgMap[part.code]) {
        localSvgMap[part.code] = await QRCode.toString(part.code, {
          type: 'svg',
          errorCorrectionLevel: 'M',
          margin: 0,
          color: { dark: '#000000', light: '#ffffff' }
        });
      }
    }

    // Build pages of 15 slots each
    const allSlots: Array<SparePart | null> = [
      ...Array(offsetBlanks).fill(null),
      ...expandedLabels
    ];

    const pages: Array<Array<SparePart | null>> = [];
    for (let i = 0; i < allSlots.length; i += 15) {
      const chunk = allSlots.slice(i, i + 15);
      while (chunk.length < 15) chunk.push(null);
      pages.push(chunk);
    }

    const escapeHtml = (str?: string | null) =>
      String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const pagesHtml = pages
      .map(
        (pageSlots) => `
        <div class="sheet">
          ${pageSlots
            .map(part => {
              if (!part) {
                return `<div class="label-cell empty-cell"></div>`;
              }
              const svg = localSvgMap[part.code] || '';
              const rackText = part.location?.name || part.warehouse?.name || 'ALMACÉN';
              const brandModel = [part.brand, part.model, part.presentation].filter(Boolean).join(' • ');
              const unitText = part.unitOfMeasure?.abbreviation || part.unitOfMeasure?.name || 'UND';
              return `
                <div class="label-cell">
                  <div class="label-header">
                    <span class="company-name">${escapeHtml(companyName)}</span>
                    <span class="rack-name">${escapeHtml(rackText)}</span>
                  </div>
                  <div class="label-body">
                    <div class="qr-box">${svg}</div>
                    <div class="info-box">
                      <div class="part-code">${escapeHtml(part.code)}</div>
                      <div class="part-name">${escapeHtml(part.name)}</div>
                      ${brandModel ? `<div class="part-meta">${escapeHtml(brandModel)}</div>` : ''}
                      <div class="part-unit">${escapeHtml(unitText)}</div>
                    </div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      `
      )
      .join('');

    const printWindow = window.open('', '_blank', 'width=900,height=750');
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes para imprimir las etiquetas.');
      return;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Etiquetas QR (6,40 cm x 3,80 cm - 15 por Hoja)</title>
  <style>
    @page {
      size: letter portrait;
      margin: 0;
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
      background: #f1f5f9;
      color: #000000;
    }
    .print-toolbar {
      background: #111827;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .print-toolbar button {
      background: #f59e0b;
      color: #000000;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
    }
    .sheet {
      width: 215.9mm;
      height: 279.4mm;
      background: #ffffff;
      margin: 12px auto;
      /* 3 cols x 64mm = 192mm (left/right margin ~11.95mm) */
      /* 5 rows x 38mm = 190mm (centered vertically or standard precut margin) */
      padding: 13mm 11.95mm;
      display: grid;
      grid-template-columns: repeat(3, 64mm);
      grid-template-rows: repeat(5, 38mm);
      column-gap: 0mm;
      row-gap: 0mm;
      page-break-after: always;
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    }
    .label-cell {
      width: 64mm;
      height: 38mm;
      padding: 2.2mm 2.8mm;
      border: 0.25mm dashed #d1d5db;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      background: #ffffff;
      color: #000000;
    }
    .empty-cell {
      border-color: transparent;
    }
    .label-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 0.4mm solid #000000;
      padding-bottom: 0.8mm;
      margin-bottom: 1.2mm;
      font-size: 6.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }
    .company-name {
      max-width: 28mm;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rack-name {
      max-width: 30mm;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: right;
    }
    .label-body {
      display: flex;
      align-items: center;
      gap: 2.5mm;
      flex: 1;
      min-height: 0;
    }
    .qr-box {
      width: 24mm;
      height: 24mm;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-box svg {
      width: 24mm !important;
      height: 24mm !important;
      display: block;
    }
    .info-box {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.7mm;
    }
    .part-code {
      font-family: "Courier New", Courier, monospace;
      font-size: 11pt;
      font-weight: 900;
      color: #000000;
      line-height: 1.05;
      letter-spacing: -0.2px;
    }
    .part-name {
      font-size: 7.5pt;
      font-weight: 800;
      color: #000000;
      line-height: 1.15;
      text-transform: uppercase;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
    }
    .part-meta {
      font-size: 6.5pt;
      font-weight: 700;
      color: #1f2937;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .part-unit {
      display: inline-block;
      align-self: flex-start;
      margin-top: 0.4mm;
      font-size: 6.5pt;
      font-weight: 900;
      color: #000000;
      border: 0.35mm solid #000000;
      padding: 0.2mm 1.4mm;
      border-radius: 1mm;
      text-transform: uppercase;
    }
    @media print {
      body {
        background: #ffffff;
      }
      .print-toolbar {
        display: none !important;
      }
      .sheet {
        margin: 0 !important;
        box-shadow: none !important;
      }
      .label-cell {
        border: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-toolbar">
    <div>
      <strong>Vista de Impresión: Formato 6,40 cm × 3,80 cm (15 etiquetas por hoja Carta)</strong>
      <div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">
        Sugerencia: En el cuadro de impresión del navegador selecciona "Tamaño real / Escala 100%" y "Márgenes: Ninguno".
      </div>
    </div>
    <button onclick="window.print()">🖨️ Imprimir Ahora (${totalLabelsCount} etiqueta${totalLabelsCount === 1 ? '' : 's'})</button>
  </div>
  ${pagesHtml}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 350);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <QrCode size={24} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
                Generador de Etiquetas QR para Almacén y Racks
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Formato calibrado: <strong>6,40 cm × 3,80 cm</strong> (15 etiquetas por hoja Carta — 3 columnas × 5 filas, QR de 2,4 cm)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: Filter & Select Articles (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por código SSR/ART, nombre, marca o rack..."
                  className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <select
                value={warehouseFilter}
                onChange={e => setWarehouseFilter(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white outline-none"
              >
                <option value="all">Todos los almacenes</option>
                {warehouses.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>

              <select
                value={locationFilter}
                onChange={e => setLocationFilter(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white outline-none"
              >
                <option value="all">Todos los racks / ubic.</option>
                {locations.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>

              <select
                value={stockFilter}
                onChange={e => setStockFilter(e.target.value as 'all' | 'with_stock')}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-xs text-gray-900 dark:text-white outline-none"
              >
                <option value="all">Todos (con o sin stock)</option>
                <option value="with_stock">Solo con Stock &gt; 0</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <CheckSquare size={14} />
                {filteredParts.length > 0 && filteredParts.every(p => (selectedQuantities[p.id] || 0) > 0)
                  ? `Quitar visibles (${filteredParts.length})`
                  : `Seleccionar todos los visibles (${filteredParts.length})`}
              </button>
              {Object.keys(selectedQuantities).length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedQuantities({})}
                  className="text-red-500 hover:underline font-semibold cursor-pointer"
                >
                  Limpiar selección
                </button>
              )}
            </div>

            {/* Parts list */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-y-auto max-h-[370px] divide-y divide-gray-100 dark:divide-gray-700/60">
              {filteredParts.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No se encontraron repuestos con esos filtros.
                </div>
              ) : (
                filteredParts.slice(0, 150).map(part => {
                  const copies = selectedQuantities[part.id] || 0;
                  const isSelected = copies > 0;
                  return (
                    <div
                      key={part.id}
                      className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                        isSelected
                          ? 'bg-amber-50/70 dark:bg-amber-950/25'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/40'
                      }`}
                    >
                      <div
                        onClick={() => togglePart(part.id)}
                        className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer"
                      >
                        <button type="button" className="mt-0.5 text-amber-600 dark:text-amber-400">
                          {isSelected ? <CheckSquare size={17} /> : <Square size={17} className="text-gray-400" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-extrabold text-xs text-gray-900 dark:text-white">
                              {part.code}
                            </span>
                            {(part.location?.name || part.warehouse?.name) && (
                              <span className="text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <MapPin size={10} />
                                {part.location?.name || part.warehouse?.name}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-500">
                              Stock: <strong>{part.stockQuantity}</strong> {part.unitOfMeasure?.abbreviation || 'UND'}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {formatSparePartName(part)}
                          </div>
                        </div>
                      </div>

                      {/* Copies counter */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPartCopies(part.id, copies - 1)}
                          className="p-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Menos copias"
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={copies}
                          onChange={e => setPartCopies(part.id, parseInt(e.target.value) || 0)}
                          className="w-11 text-center text-xs font-bold border border-gray-300 dark:border-gray-600 rounded py-1 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          title="Cantidad de etiquetas para este artículo"
                        />
                        <button
                          type="button"
                          onClick={() => setPartCopies(part.id, copies + 1)}
                          className="p-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Más copias"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right column: Sheet Configuration & Live Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  1. Posición Inicial en la Hoja (Aprovechar Hojas Parciales)
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                  Si tu hoja adhesiva de 15 etiquetas ya tiene algunas usadas, haz clic en la casilla donde quieres que empiece a imprimir:
                </p>

                {/* 3x5 Interactive Sheet Mini-Grid */}
                <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 shadow-inner">
                  {Array.from({ length: 15 }, (_, i) => i + 1).map(slotNum => {
                    const isSkipped = slotNum < startSlot;
                    const isUsed = slotNum >= startSlot && slotNum < startSlot + totalLabelsCount;
                    const isStart = slotNum === startSlot;
                    return (
                      <button
                        key={slotNum}
                        type="button"
                        onClick={() => setStartSlot(slotNum)}
                        className={`h-7 rounded text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center ${
                          isStart
                            ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400/50'
                            : isUsed
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                              : isSkipped
                                ? 'bg-gray-100 dark:bg-gray-900 text-gray-400 border-dashed border-gray-300 dark:border-gray-700 line-through'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-amber-400'
                        }`}
                        title={`Empezar a imprimir desde la etiqueta #${slotNum}`}
                      >
                        #{slotNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Sample Preview of First Selected Label */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  2. Vista Previa de Etiqueta (6,40 cm × 3,80 cm)
                </h3>
                {expandedLabels.length > 0 ? (
                  <div className="bg-white text-black border-2 border-gray-900 rounded-md p-2.5 shadow-sm max-w-[300px] mx-auto">
                    <div className="flex justify-between items-center border-b border-black pb-0.5 mb-1.5 text-[9px] font-black uppercase">
                      <span className="truncate max-w-[130px]">{companyName}</span>
                      <span className="truncate max-w-[130px] text-right">
                        {expandedLabels[0].location?.name || expandedLabels[0].warehouse?.name || 'ALMACÉN'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-16 h-16 shrink-0 flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: qrSvgMap[expandedLabels[0].code] || '' }}
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="font-mono font-black text-sm leading-none text-black">
                          {expandedLabels[0].code}
                        </div>
                        <div className="text-[10px] font-extrabold uppercase leading-tight text-black line-clamp-2">
                          {expandedLabels[0].name}
                        </div>
                        {(expandedLabels[0].brand || expandedLabels[0].model) && (
                          <div className="text-[9px] font-bold text-gray-800 truncate">
                            {[expandedLabels[0].brand, expandedLabels[0].model].filter(Boolean).join(' • ')}
                          </div>
                        )}
                        <span className="inline-block text-[8px] font-black border border-black px-1.5 py-0.2 rounded uppercase">
                          {expandedLabels[0].unitOfMeasure?.abbreviation || 'UND'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center text-xs text-gray-400">
                    <PackageOpen className="mx-auto mb-1 text-gray-400" size={22} />
                    Selecciona uno o más artículos a la izquierda para previsualizar su etiqueta QR.
                  </div>
                )}
              </div>
            </div>

            {/* Summary Box */}
            <div className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Total de etiquetas a imprimir:</span>
                <span className="font-extrabold text-gray-900 dark:text-white">{totalLabelsCount} etiqueta(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Empezando en casilla:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">Casilla #{startSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Hojas Carta requeridas (15/hoja):</span>
                <span className="font-extrabold text-gray-900 dark:text-white">{totalSheets} hoja(s)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            disabled={totalLabelsCount === 0}
            onClick={handlePrintLabels}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Printer size={16} />
            Imprimir Etiquetas QR ({totalLabelsCount})
          </button>
        </div>
      </div>
    </div>
  );
};
