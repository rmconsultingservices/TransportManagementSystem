import React, { useEffect, useState, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import type { SparePart } from '../types';

interface SparePartSelectorProps {
  value: number | '';
  onChange: (id: number) => void;
  spareParts: SparePart[];
  placeholder?: string;
  disabled?: boolean;
}

export default function SparePartSelector({ 
  value, 
  onChange, 
  spareParts, 
  placeholder = '-- Seleccione --',
  disabled = false
}: SparePartSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const selectedPart = spareParts.find(p => p.id === value);
  
  const filteredParts = spareParts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.location?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative spare-part-selector w-full ${isOpen ? 'z-50' : 'z-0'}`} ref={containerRef}>
      <div 
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full text-xs rounded-xl border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex items-center justify-between transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer shadow-sm hover:border-indigo-400'
        } ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''}`}
      >
        <span className="truncate mr-2 font-medium">
          {selectedPart ? (
            <span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedPart.code}</span>
              <span className="text-gray-400 mx-1.5">•</span>
              <span>{selectedPart.name}</span>
            </span>
          ) : <span className="text-gray-400">{placeholder}</span>}
        </span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
      </div>
      
      {isOpen && (
        <div 
          className="absolute left-0 top-full mt-1.5 w-full min-w-[340px] z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl max-h-72 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-75"
        >
          {/* Header de Búsqueda */}
          <div className="p-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-900/70 flex items-center gap-2">
            <Search size={14} className="text-indigo-500 flex-shrink-0" />
            <input 
              ref={inputRef}
              type="text"
              className="w-full text-xs font-medium bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400"
              placeholder="Buscar por código, nombre o rack..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }}
                className="text-[11px] font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-1"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Listado de Artículos */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-700/50">
            {filteredParts.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-gray-400 italic">
                No se encontraron repuestos con "{searchTerm}"
              </div>
            ) : (
              filteredParts.map(p => {
                const isSelected = p.id === value;
                return (
                  <div 
                    key={p.id}
                    onClick={() => {
                      onChange(p.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`px-3.5 py-2.5 text-xs hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/90 dark:bg-indigo-950/50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs">
                          {p.code}
                        </span>
                        {isSelected && <Check size={12} className="text-indigo-600 dark:text-indigo-400 font-bold" />}
                      </div>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 font-bold">
                        Stock: {p.stockQuantity}
                      </span>
                    </div>

                    <div className="text-gray-900 dark:text-gray-100 font-semibold truncate text-[11px]">
                      {p.name}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                      <span>Rack: <strong className="text-gray-600 dark:text-gray-300">{p.location?.name || 'N/A'}</strong></span>
                      {p.unitCost != null && p.unitCost > 0 && (
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          Costo Ref: ${p.unitCost.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
