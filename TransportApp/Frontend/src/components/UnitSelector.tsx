import React, { useEffect } from 'react';
import type { SparePart } from '../types';

interface UnitSelectorProps {
  sparePartId: number | string;
  spareParts: SparePart[];
  value: number | '';
  onChange: (unitOfMeasureId: number) => void;
  className?: string;
}

export default function UnitSelector({ sparePartId, spareParts, value, onChange, className = '' }: UnitSelectorProps) {
  const part = spareParts.find(p => p.id === Number(sparePartId));

  useEffect(() => {
    // If we have a part but no value is selected, auto-select the base unit
    if (part && !value && part.unitOfMeasure?.id) {
      onChange(part.unitOfMeasure.id);
    }
  }, [part, value, onChange]);

  if (!part) {
    return (
      <select disabled className={`w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-650 text-gray-400 px-0 py-1 text-sm ${className}`}>
        <option>--</option>
      </select>
    );
  }

  const baseUnitId = part.unitOfMeasure?.id;
  const baseUnitAbbrev = part.unitOfMeasure?.abbreviation || 'UND';

  const alternativeUnits = part.sparePartUnits || [];

  return (
    <select 
      value={value || baseUnitId || ''} 
      onChange={e => onChange(Number(e.target.value))}
      className={`w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-650 focus:border-blue-500 focus:ring-0 px-0 py-1 text-sm dark:text-white ${className}`}
    >
      {baseUnitId && (
        <option value={baseUnitId} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{baseUnitAbbrev} (Base)</option>
      )}
      {alternativeUnits.map(u => (
        <option key={u.id} value={u.unitOfMeasure?.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          {u.unitOfMeasure?.abbreviation}
        </option>
      ))}
    </select>
  );
}

