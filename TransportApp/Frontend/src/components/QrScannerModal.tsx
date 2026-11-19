import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Camera, Flashlight, X, CheckCircle2, QrCode, RotateCcw, MapPin, PackageOpen, Keyboard } from 'lucide-react';
import type { PhysicalInventoryDetail } from '../types/inventory';
import { formatSparePartName } from '../types/inventory';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: PhysicalInventoryDetail[];
  onCountConfirmed: (sparePartId: number, countedQuantity: number) => void;
  initialScannedDetail?: PhysicalInventoryDetail | null;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  details,
  onCountConfirmed,
  initialScannedDetail = null
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countInputRef = useRef<HTMLInputElement | null>(null);

  const [matchedDetail, setMatchedDetail] = useState<PhysicalInventoryDetail | null>(null);
  const [countInput, setCountInput] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  // Play a crisp acoustic beep using Web Audio API
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1080, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.11);
    } catch {
      // Ignore audio errors
    }
    try {
      if (navigator.vibrate) navigator.vibrate(80);
    } catch {
      // Ignore vibration errors
    }
  };

  useEffect(() => {
    if (isOpen && initialScannedDetail) {
      setMatchedDetail(initialScannedDetail);
      setCountInput(initialScannedDetail.realStock != null ? String(initialScannedDetail.realStock) : '');
    } else if (!isOpen) {
      setMatchedDetail(null);
      setCountInput('');
      setCameraError(null);
      setScanNotice(null);
      setTorchOn(false);
    }
  }, [isOpen, initialScannedDetail]);

  // Focus numeric input immediately when an item is matched
  useEffect(() => {
    if (matchedDetail) {
      setTimeout(() => {
        countInputRef.current?.focus();
        countInputRef.current?.select();
      }, 80);
    }
  }, [matchedDetail]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setTorchOn(false);
    setTorchSupported(false);
  };

  const handleCodeDetected = (rawCode: string) => {
    const cleaned = rawCode.trim().replace(/^#/, '').toUpperCase();
    if (!cleaned) return;

    const found = details.find(
      d => (d.sparePart?.code || '').trim().toUpperCase() === cleaned
    );

    if (found) {
      playBeep();
      stopCamera();
      setScanNotice(null);
      setMatchedDetail(found);
      setCountInput(found.realStock != null ? String(found.realStock) : '');
    } else {
      setScanNotice(`Código "${cleaned}" no encontrado en esta toma física.`);
    }
  };

  // Start camera when modal is open and no item is currently matched
  useEffect(() => {
    if (!isOpen || matchedDetail) {
      stopCamera();
      return;
    }

    let animationFrameId: number;
    let isCancelled = false;

    const startCamera = async () => {
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (isCancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
          const caps = videoTrack.getCapabilities() as any;
          if (caps && caps.torch) {
            setTorchSupported(true);
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const scanFrame = () => {
          if (isCancelled) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
            const w = video.videoWidth;
            const h = video.videoHeight;
            if (w > 0 && h > 0) {
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(video, 0, 0, w, h);
                const imgData = ctx.getImageData(0, 0, w, h);
                const qr = jsQR(imgData.data, imgData.width, imgData.height, {
                  inversionAttempts: 'dontInvert'
                });
                if (qr && qr.data) {
                  handleCodeDetected(qr.data);
                  return;
                }
              }
            }
          }
          animationFrameId = requestAnimationFrame(scanFrame);
        };

        animationFrameId = requestAnimationFrame(scanFrame);
      } catch (err: any) {
        console.warn('Camera access error:', err);
        setCameraError('No se pudo acceder a la cámara. Verifica los permisos del navegador o ingresa el código abajo.');
      }
    };

    startCamera();

    return () => {
      isCancelled = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      stopCamera();
    };
  }, [isOpen, matchedDetail, details]);

  if (!isOpen) return null;

  const toggleTorch = async () => {
    const stream = streamRef.current;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextState = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: nextState } as any] });
      setTorchOn(nextState);
    } catch {
      // Ignore if unsupported
    }
  };

  const handleConfirmCount = (keepScanning: boolean) => {
    if (!matchedDetail) return;
    const num = countInput === '' ? 0 : Number(countInput);
    if (isNaN(num) || num < 0) return;

    onCountConfirmed(matchedDetail.sparePartId, num);
    if (keepScanning) {
      setMatchedDetail(null);
      setCountInput('');
    } else {
      onClose();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode);
    setManualCode('');
  };

  const unitAbbr = matchedDetail?.sparePart?.unitOfMeasure?.abbreviation || 'UND';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-4 py-3.5 bg-gray-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <QrCode className="text-amber-400" size={20} />
            <div>
              <h3 className="text-sm font-extrabold">
                {matchedDetail ? 'Ingreso Rápido de Conteo' : 'Escáner QR de Toma Física'}
              </h3>
              <p className="text-[11px] text-gray-400">
                {matchedDetail ? 'Ingresa la cantidad física contada' : 'Apunta la cámara al QR de la caja o del estante'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!matchedDetail && torchSupported && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-lg transition ${
                  torchOn ? 'bg-amber-400 text-black font-bold' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                title="Encender / Apagar Linterna"
              >
                <Flashlight size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content: Either Camera Viewfinder OR Rapid Count Entry Card */}
        {!matchedDetail ? (
          <div className="p-4 space-y-3">
            {/* Camera Viewport */}
            <div className="relative bg-black rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-gray-800">
              {!cameraError ? (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {/* Scanning Target Frame */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-amber-400/90 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.40)] relative">
                      <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
                      <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
                      <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-xs text-gray-300 space-y-2">
                  <Camera className="mx-auto text-amber-400" size={32} />
                  <p>{cameraError}</p>
                </div>
              )}
            </div>

            {scanNotice && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-xs font-semibold text-center">
                {scanNotice}
              </div>
            )}

            {/* Manual Code Fallback / Pistol input */}
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  placeholder="O escribe el código manual (ej. SSR-00707)..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none font-mono uppercase"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-xs font-bold hover:bg-black cursor-pointer"
              >
                Buscar
              </button>
            </form>
          </div>
        ) : (
          /* Rapid Count Entry Card */
          <div className="p-5 space-y-4">
            <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-base text-amber-900 dark:text-amber-300">
                  {matchedDetail.sparePart?.code}
                </span>
                {(matchedDetail.sparePart?.location?.name || matchedDetail.sparePart?.warehouse?.name) && (
                  <span className="text-xs font-bold bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <MapPin size={12} className="text-amber-600" />
                    {matchedDetail.sparePart?.location?.name || matchedDetail.sparePart?.warehouse?.name}
                  </span>
                )}
              </div>
              <div className="text-sm font-extrabold text-gray-900 dark:text-white leading-snug">
                {formatSparePartName(matchedDetail.sparePart)}
              </div>
              <div className="flex items-center justify-between pt-1 text-xs text-gray-600 dark:text-gray-400 border-t border-amber-200/60 dark:border-amber-800/50">
                <span className="flex items-center gap-1">
                  <PackageOpen size={13} /> Stock Teórico en Sistema:
                </span>
                <strong className="text-sm font-black text-gray-900 dark:text-white font-mono">
                  {matchedDetail.theoreticalStock} {unitAbbr}
                </strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Cantidad Física Contada ({unitAbbr})
              </label>
              <input
                ref={countInputRef}
                type="number"
                inputMode="numeric"
                min="0"
                step="any"
                value={countInput}
                onChange={e => setCountInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirmCount(true);
                  }
                }}
                placeholder="0"
                className="w-full text-center text-3xl font-black font-mono py-3 px-4 rounded-xl border-2 border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/20 outline-none"
              />

              {/* Quick increment pills for fast mobile tapping */}
              <div className="flex items-center justify-between gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => setCountInput(String(matchedDetail.theoreticalStock))}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 cursor-pointer"
                >
                  = Teórico ({matchedDetail.theoreticalStock})
                </button>
                <button
                  type="button"
                  onClick={() => setCountInput(String((Number(countInput) || 0) + 1))}
                  className="py-1.5 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-xs font-extrabold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setCountInput(String((Number(countInput) || 0) + 5))}
                  className="py-1.5 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-xs font-extrabold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                >
                  +5
                </button>
                <button
                  type="button"
                  onClick={() => setCountInput('0')}
                  className="py-1.5 px-3 rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 text-xs font-bold text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 cursor-pointer"
                >
                  0
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleConfirmCount(true)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer"
              >
                <CheckCircle2 size={18} />
                Confirmar y Seguir Escaneando
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMatchedDetail(null);
                    setCountInput('');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={14} /> Escanear otro
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmCount(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                >
                  Confirmar y Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
