import React, { useEffect, useState } from 'react';
import type { SparePart, UnitOfMeasure } from '../types';
import { unitsOfMeasureService } from '../services/unitsOfMeasureService';

interface UnitSelectorProps {
  sparePartId: number | string;
  spareParts: SparePart[];
  value: number | '';
  onChange: (unitOfMeasureId: number) => void;
  className?: string;
}

// Module-level cache so all rows share a single fetch
let cachedUnits: UnitOfMeasure[] | null = null;
let cachedUnitsPromise: Promise<UnitOfMeasure[]> | null = null;

const getGlobalUnits = async (): Promise<UnitOfMeasure[]> => {
  if (cachedUnits) return cachedUnits;
  if (!cachedUnitsPromise) {
    cachedUnitsPromise = unitsOfMeasureService.getUnits().then(data => {
      cachedUnits = data || [];
      return cachedUnits;
    }).catch(() => {
      cachedUnitsPromise = null;
      return [];
    });
  }
  return cachedUnitsPromise;
};

export default function UnitSelector({ sparePartId, spareParts, value, onChange, className = '' }: UnitSelectorProps) {
  const [allUnits, setAllUnits] = useState<UnitOfMeasure[]>(cachedUnits || []);
  const part = spareParts.find(p => p.id === Number(sparePartId));

  useEffect(() => {
    if (!cachedUnits) {
      getGlobalUnits().then(units => {
        setAllUnits(units);
      });
    }
  }, []);

  const baseUnitId = part?.unitOfMeasureId || part?.unitOfMeasure?.id;
  const baseUnitObj = part?.unitOfMeasure || allUnits.find(u => u.id === baseUnitId);
  const baseUnitAbbrev = baseUnitObj?.abbreviation || 'UND';

  useEffect(() => {
    // If we have a part but no value is selected, auto-select the base unit
    if (part && !value && baseUnitId) {
      onChange(baseUnitId);
    }
  }, [part, value, baseUnitId, onChange]);

  if (!part) {
    return (
      <select disabled className={`w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-650 text-gray-400 px-0 py-1 text-sm ${className}`}>
        <option>--</option>
      </select>
    );
  }

  const alternativeUnits = part.sparePartUnits || [];

  // Build the options list:
  // 1. Base unit (marked as Base)
  // 2. Alternative units configured on this spare part
  // 3. All other active catalog units (so the select is never empty and user can pick other units)
  interface OptionItem {
    id: number;
    label: string;
  }
  
  const optionsMap = new Map<number, OptionItem>();

  if (baseUnitId) {
    optionsMap.set(baseUnitId, {
      id: baseUnitId,
      label: `${baseUnitAbbrev} (Base)`
    });
  }

  alternativeUnits.forEach(u => {
    const uId = u.unitOfMeasure?.id || u.unitOfMeasureId;
    const uAbbrev = u.unitOfMeasure?.abbreviation || allUnits.find(x => x.id === uId)?.abbreviation || 'ALT';
    if (uId) {
      optionsMap.set(uId, {
        id: uId,
        label: uAbbrev
      });
    }
  });

  allUnits.filter(u => u.isActive).forEach(u => {
    if (!optionsMap.has(u.id)) {
      optionsMap.set(u.id, {
        id: u.id,
        label: u.abbreviation || u.name
      });
    }
  });

  const optionsList = Array.from(optionsMap.values());

  return (
    <select 
      value={value || baseUnitId || ''} 
      onChange={e => onChange(Number(e.target.value))}
      className={`w-full bg-transparent border-0 border-b border-gray-300 dark:border-gray-650 focus:border-blue-500 focus:ring-0 px-0 py-1 text-sm dark:text-white ${className}`}
    >
      {optionsList.length === 0 && (
        <option value="">--</option>
      )}
      {optionsList.map(opt => (
        <option key={opt.id} value={opt.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
