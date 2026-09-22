import React, { useState } from 'react';

// ==========================================
// 1. GAUGE CHART (Velocímetro Semafórico)
// ==========================================
interface GaugeChartProps {
  value: number; // 0 to 100
  size?: number;
  label?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({ value, size = 180, label }) => {
  const clamped = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
  // Needle angle from -90 deg (0%) to +90 deg (100%)
  const angle = -90 + (clamped / 100) * 180;
  
  // Color zone: <75 Red, 75-84 Yellow, >=85 Green
  const statusColor = clamped >= 85 ? '#10b981' : clamped >= 75 ? '#f59e0b' : '#ef4444';
  const statusText = clamped >= 85 ? 'Óptimo' : clamped >= 75 ? 'Precaución' : 'Crítico';

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Gauge Arc & Needle */}
      <div className="relative flex justify-center" style={{ width: size, height: size * 0.54 }}>
        <svg viewBox="0 15 200 105" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="45%" stopColor="#ef4444" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter id="gaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Background arc track */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            className="stroke-slate-200 dark:stroke-slate-700"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Colored arc segments */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            filter="url(#gaugeShadow)"
          />

          {/* Center pivot */}
          <circle cx="100" cy="110" r="10" className="fill-slate-800 dark:fill-slate-200" />
          <circle cx="100" cy="110" r="4" className="fill-white dark:fill-slate-900" />

          {/* Needle */}
          <g transform={`rotate(${angle} 100 110)`}>
            <polygon points="97,110 100,32 103,110" className="fill-slate-800 dark:fill-slate-200" />
            <circle cx="100" cy="32" r="3.5" fill={statusColor} />
          </g>
        </svg>
      </div>

      {/* Percentage and Status BELOW the gauge chart */}
      <div className="flex flex-col items-center mt-2">
        <span className="text-3xl font-black tracking-tight" style={{ color: statusColor }}>
          {clamped.toFixed(1)}%
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            {statusText}
          </span>
          {label && <span className="text-xs text-slate-400 dark:text-slate-500">({label})</span>}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. SPARKLINE (Tendencia MTTR)
// ==========================================
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data = [],
  width = 120,
  height = 36,
  color = '#3b82f6'
}) => {
  if (!data || data.length < 2) {
    return (
      <div className="text-xs text-slate-400 italic flex items-center justify-center" style={{ width, height }}>
        Sin histórico
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 4;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const firstX = padding;
  const lastX = width - padding;
  const areaD = `${pathD} L ${lastX},${height} L ${firstX},${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkGrad_${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#sparkGrad_${color.replace('#', '')})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].split(',')[0]}
          cy={points[points.length - 1].split(',')[1]}
          r="3.5"
          fill={color}
        />
      )}
    </svg>
  );
};

// ==========================================
// 3. DONUT CHART (Preventivo vs Correctivo)
// ==========================================
interface DonutChartProps {
  preventive: number;
  corrective: number;
  other?: number;
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  preventive = 0,
  corrective = 0,
  other = 0,
  size = 190
}) => {
  const total = preventive + corrective + other;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const prevPct = total > 0 ? (preventive / total) * 100 : 0;
  const corrPct = total > 0 ? (corrective / total) * 100 : 0;
  const otherPct = total > 0 ? (other / total) * 100 : 0;

  const prevStroke = (prevPct / 100) * circumference;
  const corrStroke = (corrPct / 100) * circumference;
  const otherStroke = (otherPct / 100) * circumference;

  const prevOffset = 0;
  const corrOffset = -prevStroke;
  const otherOffset = -(prevStroke + corrStroke);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
      {/* SVG Ring */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-slate-100 dark:stroke-slate-700/60"
            strokeWidth={strokeWidth}
          />
          {total > 0 && (
            <>
              {/* Preventive (Emerald) */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#10b981"
                strokeWidth={strokeWidth}
                strokeDasharray={`${prevStroke} ${circumference}`}
                strokeDashoffset={prevOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              {/* Corrective (Rose/Amber) */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#f43f5e"
                strokeWidth={strokeWidth}
                strokeDasharray={`${corrStroke} ${circumference}`}
                strokeDashoffset={corrOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              {other > 0 && (
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${otherStroke} ${circumference}`}
                  strokeDashoffset={otherOffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              )}
            </>
          )}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{total}</span>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Servicios</span>
        </div>
      </div>

      {/* Legend & Details */}
      <div className="flex flex-col gap-3 min-w-[150px]">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900" />
            <div>
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Preventivo</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">{prevPct.toFixed(1)}% del total</p>
            </div>
          </div>
          <span className="text-base font-black text-emerald-900 dark:text-emerald-200 ml-3">{preventive}</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-800/40">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-200 dark:ring-rose-900" />
            <div>
              <p className="text-xs font-bold text-rose-900 dark:text-rose-200">Correctivo</p>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">{corrPct.toFixed(1)}% del total</p>
            </div>
          </div>
          <span className="text-base font-black text-rose-900 dark:text-rose-200 ml-3">{corrective}</span>
        </div>

        {other > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Otros</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{otherPct.toFixed(1)}% del total</p>
              </div>
            </div>
            <span className="text-base font-black text-slate-700 dark:text-slate-300 ml-3">{other}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 4. HORIZONTAL BAR CHART (Top 5 Unidades con Mayor Gasto)
// ==========================================
interface HorizontalBarItem {
  id: number;
  licensePlate: string;
  unitType: string;
  brandModel: string;
  totalCost: number;
  servicesCount: number;
  partsCount: number;
}

interface HorizontalBarChartProps {
  data: HorizontalBarItem[];
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 text-sm italic">
        No hay registros de gasto en el período seleccionado
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.totalCost), 1);

  return (
    <div className="flex flex-col gap-3.5">
      {data.map((item, idx) => {
        const pct = Math.min(100, Math.max(10, (item.totalCost / maxVal) * 100));
        const isVehicle = item.unitType?.toLowerCase().includes('vehicle') || 
                          item.unitType?.toLowerCase().includes('chuto');
        const unitTypeLabel = isVehicle ? 'Chuto' : 'Remolque';

        return (
          <div key={item.id || idx} className="group">
            {/* Header info row */}
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Rank Badge */}
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-black flex items-center justify-center text-[10px]">
                  {idx + 1}
                </span>
                {/* Placa del vehículo (VISIBLE EN DARK MODE Y LIGHT MODE) */}
                <span className="font-mono font-black text-slate-900 dark:text-white tracking-wider text-sm">
                  {item.licensePlate || 'SIN PLACA'}
                </span>
                {/* Tipo de Unidad y Modelo */}
                <span className="text-slate-500 dark:text-slate-400 text-xs">
                  • {unitTypeLabel} {item.brandModel ? `(${item.brandModel})` : ''}
                </span>
              </div>

              {/* Conteo de servicios y Monto en Divisas (VISIBLE EN DARK Y LIGHT) */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 dark:text-slate-400 text-[11px]">
                  {item.servicesCount} serv. / {item.partsCount} rep.
                </span>
                <span className="font-mono font-black text-slate-900 dark:text-emerald-400 text-sm ml-1.5">
                  ${item.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Bar container */}
            <div className="w-full bg-slate-100 dark:bg-slate-700/60 rounded-full h-3.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-blue-500 to-indigo-600 group-hover:from-blue-600 group-hover:to-indigo-700 shadow-sm"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// 5. LINE TREND CHART (Evolución de Costo - 6 Meses)
// ==========================================
interface MonthlyPoint {
  monthLabel: string;
  year: number;
  totalCost: number;
  averageCost: number;
  servicedUnitsCount: number;
}

interface LineTrendChartProps {
  data: MonthlyPoint[];
}

export const LineTrendChart: React.FC<LineTrendChartProps> = ({ data = [] }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 text-sm italic">
        Sin datos históricos suficientes para los últimos 6 meses
      </div>
    );
  }

  const svgWidth = 560;
  const svgHeight = 200;
  const paddingX = 45;
  const paddingY = 30;

  const maxCost = Math.max(...data.map(d => d.totalCost), 100);
  const minCost = 0;
  const range = maxCost - minCost === 0 ? 1 : maxCost - minCost;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((d.totalCost - minCost) / range) * (svgHeight - paddingY * 2);
    return { x, y, data: d };
  });

  const pathD = `M ${points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)},${svgHeight - paddingY} L ${points[0].x.toFixed(1)},${svgHeight - paddingY} Z`;

  return (
    <div className="relative w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto overflow-visible select-none"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingY + ratio * (svgHeight - paddingY * 2);
          const val = maxCost * (1 - ratio);
          return (
            <g key={idx}>
              <line
                x1={paddingX}
                y1={y}
                x2={svgWidth - paddingX}
                y2={y}
                className="stroke-slate-200 dark:stroke-slate-700/60"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingX - 6}
                y={y + 3}
                textAnchor="end"
                className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
              >
                ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGradient)" />

        {/* Trend line */}
        <path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, idx) => (
          <g
            key={idx}
            className="cursor-pointer transition-transform"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Hover hit area */}
            <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === idx ? 6 : 4}
              className="fill-white dark:fill-slate-900"
              stroke="#3b82f6"
              strokeWidth="3"
            />

            {/* X-axis Month Label */}
            <text
              x={p.x}
              y={svgHeight - 10}
              textAnchor="middle"
              className={`text-[11px] font-bold transition-colors ${
                hoveredIndex === idx 
                  ? 'fill-blue-600 dark:fill-blue-400 font-black' 
                  : 'fill-slate-500 dark:fill-slate-400'
              }`}
            >
              {p.data.monthLabel}
            </text>
          </g>
        ))}
      </svg>

      {/* Floating tooltip for hovered point */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="absolute z-10 p-2.5 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 text-xs pointer-events-none transition-all transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
            top: `${(points[hoveredIndex].y / svgHeight) * 100 - 8}%`
          }}
        >
          <p className="font-black border-b border-slate-700 pb-1 mb-1 text-slate-200">
            {points[hoveredIndex].data.monthLabel} {points[hoveredIndex].data.year}
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-slate-400">Total Gasto:</span>
            <span className="font-mono font-black text-emerald-400">
              ${points[hoveredIndex].data.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-slate-400">Costo Promedio:</span>
            <span className="font-mono font-bold text-blue-300">
              ${points[hoveredIndex].data.averageCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-slate-400">Unidades Atendidas:</span>
            <span className="font-bold text-slate-200">
              {points[hoveredIndex].data.servicedUnitsCount}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 6. STACKED COLUMN CHART (Productividad Mecánico / Incidencias Chofer)
// ==========================================
interface StackedColumnItem {
  id: number | string;
  title: string;
  subtitle?: string;
  val1: number; // e.g. Preventive
  val2: number; // e.g. Corrective
}

interface StackedColumnChartProps {
  data: StackedColumnItem[];
  label1?: string;
  label2?: string;
  emptyText?: string;
}

export const StackedColumnChart: React.FC<StackedColumnChartProps> = ({
  data = [],
  label1 = 'Preventivos',
  label2 = 'Correctivos',
  emptyText = 'Sin registros para mostrar'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs italic">
        {emptyText}
      </div>
    );
  }

  const maxTotal = Math.max(...data.map(d => d.val1 + d.val2), 1);

  return (
    <div className="flex flex-col gap-3">
      {/* Legend */}
      <div className="flex items-center justify-end gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-blue-500" />
          <span className="text-slate-600 dark:text-slate-300 font-bold">{label1}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-rose-500" />
          <span className="text-slate-600 dark:text-slate-300 font-bold">{label2}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {data.slice(0, 5).map((item, idx) => {
          const total = item.val1 + item.val2;
          const pct1 = total > 0 ? (item.val1 / total) * 100 : 0;
          const pct2 = total > 0 ? (item.val2 / total) * 100 : 0;
          const barWidthPct = Math.max(15, (total / maxTotal) * 100);

          return (
            <div key={item.id || idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60 hover:border-slate-200 dark:hover:border-slate-600 transition-colors">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div>
                  <span className="font-black text-slate-800 dark:text-white text-xs">{item.title}</span>
                  {item.subtitle && (
                    <span className="text-slate-400 dark:text-slate-400 ml-1.5 text-[11px]">({item.subtitle})</span>
                  )}
                </div>
                <div className="font-mono font-bold text-slate-700 dark:text-slate-200">
                  {total} <span className="text-[10px] text-slate-400 font-normal">total</span>
                </div>
              </div>

              {/* Proportional Stacked Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-3 flex overflow-hidden" style={{ maxWidth: `${barWidthPct}%` }}>
                {item.val1 > 0 && (
                  <div
                    className="h-full bg-blue-500 hover:bg-blue-600 transition-all"
                    style={{ width: `${pct1}%` }}
                    title={`${label1}: ${item.val1}`}
                  />
                )}
                {item.val2 > 0 && (
                  <div
                    className="h-full bg-rose-500 hover:bg-rose-600 transition-all"
                    style={{ width: `${pct2}%` }}
                    title={`${label2}: ${item.val2}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
