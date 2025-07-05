import { useCallback, useRef, useState } from "react";

interface UseBarcodeeScannerProps {
  videoElement: HTMLVideoElement | null;
  onDetected: (code: string) => void;
  onError: (error: string) => void;
}

export function useBarcodeScanner({ videoElement, onDetected, onError }: UseBarcodeeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const startScanner = useCallback(async () => {
    if (!videoElement || isScanning) return;

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      videoElement.srcObject = stream;
      setIsScanning(true);

      // Wait for video to load
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = resolve;
      });

      // Start scanning process
      scanIntervalRef.current = window.setInterval(() => {
        scanFrame();
      }, 100);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Camera access denied";
      onError(`Impossible d'accéder à la caméra: ${errorMessage}`);
    }
  }, [videoElement, isScanning, onError]);

  const stopScanner = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoElement) {
      videoElement.srcObject = null;
    }

    setIsScanning(false);
  }, [videoElement]);

  const scanFrame = () => {
    if (!videoElement || !isScanning) return;

    try {
      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) return;

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      context.drawImage(videoElement, 0, 0);

      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Simple barcode detection simulation
      // In a real implementation, you would use a library like QuaggaJS or ZXing
      simulateBarcodeDetection(imageData, onDetected);

    } catch (err) {
      console.error('Error scanning frame:', err);
    }
  };

  return {
    startScanner,
    stopScanner,
    isScanning,
  };
}

// Simulate barcode detection for demo purposes
// In production, replace with actual barcode scanning library
function simulateBarcodeDetection(imageData: ImageData, onDetected: (code: string) => void) {
  // This is a simplified simulation
  // In practice, you would analyze the imageData for barcode patterns
  
  // Simulate random detection after some time
  if (Math.random() > 0.98) { // 2% chance per frame
    const simulatedCodes = [
      "1234567890123",
      "9876543210987",
      "5555666677778",
      "1111222233334",
      "9999888877776"
    ];
    const randomCode = simulatedCodes[Math.floor(Math.random() * simulatedCodes.length)];
    onDetected(randomCode);
  }
}
