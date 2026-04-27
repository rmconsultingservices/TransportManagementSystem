import { useEffect, useState, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
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
  
  const selectedPart = spareParts.find(p => p.id === value);
  
  const filteredParts = spareParts.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.location?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative spare-part-selector w-full ${isOpen ? 'z-50' : ''}`} ref={containerRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer shadow-sm'}`}
      >
        <span className="truncate mr-2">
          {selectedPart ? (
            <span>
              <span className="font-bold">{selectedPart.code}</span> - {selectedPart.name}
            </span>
          ) : <span className="text-gray-400">{placeholder}</span>}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[300px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl max-h-80 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-2">
            <Search size={14} className="text-gray-400" />
            <input 
              type="text"
              autoFocus
              className="w-full text-xs bg-transparent outline-none dark:text-white"
              placeholder="Buscar nombre, código o rack..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredParts.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-gray-500">No se encontraron resultados</div>
            ) : (
              filteredParts.map(p => (
                <div 
                  key={p.id}
                  onClick={() => {
                    onChange(p.id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-50 dark:border-gray-700/50 last:border-0 ${p.id === value ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <div className="flex justify-between items-start mb-0.5">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{p.code}</span>
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1 rounded text-gray-500 uppercase font-medium">Stock: {p.stockQuantity}</span>
                  </div>
                  <div className="text-gray-900 dark:text-gray-200 font-medium truncate">{p.name}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Rack: {p.location?.name || 'N/A'}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
