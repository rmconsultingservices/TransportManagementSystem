import React, { useRef } from 'react';
import { Printer, X } from 'lucide-react';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  src: string;
  footerText?: string;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  src,
  footerText = 'Documento oficial generado digitalmente por el Sistema de Flota y Mantenimiento.'
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
      } catch {
        window.open(src, '_blank');
      }
    } else {
      window.open(src, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
              <Printer size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm shadow-indigo-600/20 active:scale-95 cursor-pointer"
              title="Imprimir / Abrir PDF"
            >
              <Printer size={15} />
              <span>Imprimir / Abrir PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-xl transition-all cursor-pointer"
              title="Cerrar vista previa"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body: Embedded Print View iframe */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 overflow-hidden flex justify-center">
          <iframe
            ref={iframeRef}
            src={src}
            title={title}
            className="w-full h-full rounded-xl bg-white border border-slate-200 shadow-sm"
          />
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="truncate mr-4">{footerText}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
};
export default ReportPreviewModal;
