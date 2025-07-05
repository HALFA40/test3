import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { Camera, AlertCircle } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onBarcodeScanned: (barcode: string) => void;
}

export function BarcodeScanner({ open, onClose, onBarcodeScanned }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { startScanner, stopScanner, isScanning } = useBarcodeScanner({
    videoElement: videoRef.current,
    onDetected: (code) => {
      setScannedCode(code);
    },
    onError: (err) => {
      setError(err);
    },
  });

  useEffect(() => {
    if (open && videoRef.current) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open, startScanner, stopScanner]);

  const handleUseCode = () => {
    if (scannedCode) {
      onBarcodeScanned(scannedCode);
      onClose();
    }
  };

  const handleClose = () => {
    stopScanner();
    setScannedCode(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full mx-4">
        <DialogHeader>
          <DialogTitle>Scanner Code-barres</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Camera preview */}
          <div className="bg-muted rounded-lg h-64 flex items-center justify-center relative overflow-hidden">
            {error ? (
              <div className="text-center p-4">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-sm text-destructive">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Vérifiez que votre caméra est connectée et autorisée
                </p>
              </div>
            ) : isScanning ? (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
            ) : (
              <div className="text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Initialisation de la caméra...</p>
              </div>
            )}
            
            {/* Scanning overlay */}
            {isScanning && !scannedCode && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-primary bg-primary/10 rounded-lg w-48 h-32">
                  <div className="w-full h-full border border-dashed border-primary/50 rounded-lg flex items-center justify-center">
                    <p className="text-xs text-primary font-medium">Dirigez vers le code-barres</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Scanned code display */}
          {scannedCode && (
            <div className="text-center p-4 bg-accent rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Code-barres détecté:</p>
              <p className="font-mono bg-background px-3 py-2 rounded border text-sm">
                {scannedCode}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Annuler
            </Button>
            {scannedCode && (
              <Button onClick={handleUseCode} className="flex-1">
                Rechercher
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
