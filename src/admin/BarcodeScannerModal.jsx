import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Camera, ScanBarcode, AlertCircle } from 'lucide-react';
import { Button, Input } from '../components/ui';

function BarcodeScannerDialog({
  onClose,
  onScan,
  products = [],
  mode = 'lookup',
  title = 'Pindai Barcode Produk',
}) {
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCameraSupported, setIsCameraSupported] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleBarcodeFound = useCallback(
    (code) => {
      const clean = String(code || '').trim();
      if (!clean) return;

      if (mode === 'raw') {
        onScan(clean);
        onClose();
        return;
      }

      const match = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === clean.toLowerCase()) ||
          p.name.toLowerCase() === clean.toLowerCase() ||
          (p.id && p.id.toLowerCase() === clean.toLowerCase())
      );

      if (match) {
        onScan(match);
        onClose();
      } else {
        setErrorMsg(`Barcode "${clean}" tidak cocok dengan produk katalog.`);
      }
    },
    [products, onScan, onClose, mode]
  );

  useEffect(() => {
    let active = true;

    async function startCamera() {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        if (active) setIsCameraSupported(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setIsScanning(true);

        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            const barcodeDetector = new window.BarcodeDetector({
              formats: [
                'code_128',
                'code_39',
                'ean_13',
                'ean_8',
                'qr_code',
                'upc_a',
                'upc_e',
              ],
            });

            scanIntervalRef.current = setInterval(async () => {
              if (!videoRef.current || videoRef.current.readyState < 2) return;
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0) {
                  const detectedValue = barcodes[0].rawValue;
                  if (detectedValue) {
                    stopCamera();
                    handleBarcodeFound(detectedValue);
                  }
                }
              } catch {
                // Ignore detector frame failure
              }
            }, 300);
          } catch {
            // Fallback to manual if BarcodeDetector fails constructor
          }
        }
      } catch {
        if (active) {
          setIsCameraSupported(false);
          setErrorMsg('Kamera tidak dapat diakses atau izin kamera ditolak.');
        }
      }
    }

    startCamera();

    return () => {
      active = false;
      stopCamera();
    };
  }, [stopCamera, handleBarcodeFound]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!manualCode.trim()) return;
    handleBarcodeFound(manualCode.trim());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="barcode-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text/50 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5 text-primary-700" aria-hidden="true" />
            <h2 id="barcode-modal-title" className="text-sm font-bold text-text md:text-base">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="h-9 w-9 rounded-lg inline-flex items-center justify-center text-text-3 hover:bg-surface-3 hover:text-text transition-colors"
            aria-label="Tutup pemindai"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-xl border border-primary-700/20 bg-primary-50 p-3 text-xs font-semibold text-primary-700 flex items-start gap-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Camera Viewport */}
        {isCameraSupported ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-border flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="h-full w-full object-cover"
            />
            {/* Viewfinder Target Frame (Warna Merah Solid) */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <div className="h-32 w-48 border-2 border-primary-700 rounded-lg relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary-700/80 animate-pulse" />
              </div>
            </div>
            {isScanning && (
              <span className="absolute bottom-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
                Arahkan barcode ke dalam kotak merah
              </span>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-4 text-center space-y-1 bg-surface-3/40">
            <Camera className="mx-auto h-6 w-6 text-text-3" />
            <p className="text-xs font-medium text-text-2">
              Kamera tidak tersedia atau tidak didukung peramban.
            </p>
            <p className="text-[11px] text-text-3">
              Gunakan barcode scanner USB / Bluetooth, atau ketik kode barcode di bawah.
            </p>
          </div>
        )}

        {/* Manual Barcode Input Fallback */}
        <form onSubmit={handleManualSubmit} className="space-y-2 border-t border-border pt-3">
          <label htmlFor="manual-barcode-input" className="text-xs font-semibold text-text">
            Input Kode Barcode Manual
          </label>
          <div className="flex gap-2">
            <Input
              id="manual-barcode-input"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Contoh: 899100100001"
              className="min-h-11 flex-1 text-xs md:text-sm font-mono tabular-nums"
              autoFocus={!isCameraSupported}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!manualCode.trim()}
              className="min-h-11 shrink-0 px-4 font-semibold"
            >
              {mode === 'raw' ? 'Gunakan Kode' : 'Cari & Tambah'}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end border-t border-border pt-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="min-h-11 w-full sm:w-auto"
          >
            Batal
          </Button>
        </div>
      </div>
    </div>
  );
}

export function BarcodeScannerModal({
  open,
  onClose,
  onScan,
  products = [],
  mode = 'lookup',
  title = 'Pindai Barcode Produk',
}) {
  if (!open) return null;
  return (
    <BarcodeScannerDialog
      onClose={onClose}
      onScan={onScan}
      products={products}
      mode={mode}
      title={title}
    />
  );
}

export default BarcodeScannerModal;
