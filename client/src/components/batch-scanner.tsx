import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Square, 
  Camera, 
  Check, 
  X, 
  Clock, 
  Package,
  BarChart3,
  Download
} from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { useNotifications } from '@/lib/toast-notifications';
import type { InventoryItem } from '@shared/schema';

interface BatchScanResult {
  id: string;
  barcode: string;
  timestamp: Date;
  status: 'pending' | 'found' | 'not-found' | 'processed';
  item?: InventoryItem;
  error?: string;
}

interface BatchScannerProps {
  onBatchComplete?: (results: BatchScanResult[]) => void;
  onItemFound?: (item: InventoryItem, barcode: string) => void;
  onItemNotFound?: (barcode: string) => void;
  maxBatchSize?: number;
  autoProcess?: boolean;
}

export function BatchScanner({
  onBatchComplete,
  onItemFound,
  onItemNotFound,
  maxBatchSize = 50,
  autoProcess = true
}: BatchScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchScanResult[]>([]);
  const [currentBatch, setCurrentBatch] = useState<string[]>([]);
  const [scanCount, setScanCount] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    found: 0,
    notFound: 0,
    processed: 0
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const { isOnline, queueAction } = useOfflineSync();
  const { showSuccess, showWarning, showError } = useNotifications();
  
  const { startScanning, stopScanning, isActive } = useBarcodeScanner({
    videoRef,
    onBarcodeDetected: handleBarcodeScanned,
    constraints: {
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    }
  });

  function handleBarcodeScanned(barcode: string) {
    if (!isScanning) return;

    // Avoid duplicate scans within 2 seconds
    const recentScan = batchResults.find(
      result => result.barcode === barcode && 
      Date.now() - result.timestamp.getTime() < 2000
    );
    
    if (recentScan) return;

    const newResult: BatchScanResult = {
      id: crypto.randomUUID(),
      barcode,
      timestamp: new Date(),
      status: 'pending'
    };

    setBatchResults(prev => [...prev, newResult]);
    setCurrentBatch(prev => [...prev, barcode]);
    setScanCount(prev => prev + 1);

    // Process immediately if auto-processing is enabled
    if (autoProcess) {
      processBarcode(newResult.id, barcode);
    }

    // Check if batch is full
    if (currentBatch.length + 1 >= maxBatchSize) {
      handlePauseScan();
      showWarning(`Lot maximum atteint (${maxBatchSize} articles). Traitez le lot avant de continuer.`);
    }
  }

  const processBarcode = useCallback(async (resultId: string, barcode: string) => {
    try {
      const response = await fetch(`/api/inventory/barcode/${encodeURIComponent(barcode)}`);
      
      if (response.ok) {
        const item: InventoryItem = await response.json();
        
        setBatchResults(prev => prev.map(result => 
          result.id === resultId ? 
          { ...result, status: 'found', item } : 
          result
        ));
        
        setSessionStats(prev => ({
          ...prev,
          found: prev.found + 1,
          processed: prev.processed + 1
        }));

        onItemFound?.(item, barcode);
      } else {
        setBatchResults(prev => prev.map(result => 
          result.id === resultId ? 
          { ...result, status: 'not-found' } : 
          result
        ));
        
        setSessionStats(prev => ({
          ...prev,
          notFound: prev.notFound + 1,
          processed: prev.processed + 1
        }));

        // Add to search results if offline
        if (!isOnline) {
          queueAction({
            type: 'CREATE',
            endpoint: '/api/search-results',
            data: {
              code_barre: barcode,
              designation: null,
              found: false
            }
          });
        }

        onItemNotFound?.(barcode);
      }
    } catch (error) {
      setBatchResults(prev => prev.map(result => 
        result.id === resultId ? 
        { ...result, status: 'not-found', error: 'Erreur réseau' } : 
        result
      ));
      
      setSessionStats(prev => ({
        ...prev,
        processed: prev.processed + 1
      }));
    }
  }, [isOnline, queueAction, onItemFound, onItemNotFound]);

  const handleStartScan = useCallback(async () => {
    try {
      await startScanning();
      setIsScanning(true);
      showSuccess('Scanner par lot démarré');
    } catch (error) {
      showError('Impossible de démarrer le scanner');
    }
  }, [startScanning, showSuccess, showError]);

  const handlePauseScan = useCallback(() => {
    setIsScanning(false);
    showSuccess('Scanner mis en pause');
  }, [showSuccess]);

  const handleStopScan = useCallback(() => {
    stopScanning();
    setIsScanning(false);
    
    if (batchResults.length > 0) {
      onBatchComplete?.(batchResults);
      showSuccess(`Lot terminé: ${batchResults.length} articles scannés`);
    }
  }, [stopScanning, batchResults, onBatchComplete, showSuccess]);

  const handleProcessAll = useCallback(async () => {
    const pendingResults = batchResults.filter(result => result.status === 'pending');
    
    for (const result of pendingResults) {
      await processBarcode(result.id, result.barcode);
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    showSuccess(`${pendingResults.length} codes-barres traités`);
  }, [batchResults, processBarcode, showSuccess]);

  const handleClearBatch = useCallback(() => {
    setBatchResults([]);
    setCurrentBatch([]);
    setScanCount(0);
    setSessionStats({ total: 0, found: 0, notFound: 0, processed: 0 });
    showSuccess('Lot vidé');
  }, [showSuccess]);

  const handleExportResults = useCallback(() => {
    const csvContent = [
      ['Code-barres', 'Statut', 'Désignation', 'Département', 'Horodatage'],
      ...batchResults.map(result => [
        result.barcode,
        result.status === 'found' ? 'Trouvé' : 'Non trouvé',
        result.item?.designation || '',
        result.item?.departement || '',
        result.timestamp.toLocaleString('fr-FR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-lot-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showSuccess('Résultats exportés en CSV');
  }, [batchResults, showSuccess]);

  // Update session stats
  useEffect(() => {
    setSessionStats({
      total: batchResults.length,
      found: batchResults.filter(r => r.status === 'found').length,
      notFound: batchResults.filter(r => r.status === 'not-found').length,
      processed: batchResults.filter(r => r.status !== 'pending').length
    });
  }, [batchResults]);

  const completionPercentage = batchResults.length > 0 ? 
    (sessionStats.processed / batchResults.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Scanner Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scanner par Lot
            {!isOnline && <Badge variant="secondary">Hors ligne</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Preview */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            {isScanning && (
              <div className="absolute inset-0 border-4 border-green-500 animate-pulse rounded-lg pointer-events-none" />
            )}
            <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {scanCount} scannés
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleStartScan} 
              disabled={isActive && isScanning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Démarrer
            </Button>
            <Button 
              onClick={handlePauseScan} 
              disabled={!isScanning}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
            <Button 
              onClick={handleStopScan} 
              disabled={!isActive}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
            <Button 
              onClick={handleProcessAll} 
              disabled={batchResults.filter(r => r.status === 'pending').length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Traiter tout
            </Button>
            <Button 
              onClick={handleClearBatch} 
              disabled={batchResults.length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Vider
            </Button>
            <Button 
              onClick={handleExportResults} 
              disabled={batchResults.length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress and Stats */}
      {batchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Progression du Lot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={completionPercentage} className="w-full" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{sessionStats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{sessionStats.found}</div>
                <div className="text-sm text-muted-foreground">Trouvés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{sessionStats.notFound}</div>
                <div className="text-sm text-muted-foreground">Non trouvés</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{sessionStats.processed}</div>
                <div className="text-sm text-muted-foreground">Traités</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Batch Results */}
      {batchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats du Lot ({batchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {batchResults.map((result, index) => (
                  <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{result.barcode}</div>
                        {result.item && (
                          <div className="text-sm text-muted-foreground">
                            {result.item.designation} - {result.item.departement}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {result.timestamp.toLocaleTimeString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {result.status === 'pending' && (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          En attente
                        </Badge>
                      )}
                      {result.status === 'found' && (
                        <Badge variant="default" className="bg-green-500">
                          <Check className="h-3 w-3 mr-1" />
                          Trouvé
                        </Badge>
                      )}
                      {result.status === 'not-found' && (
                        <Badge variant="destructive">
                          <X className="h-3 w-3 mr-1" />
                          Non trouvé
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Help Alert */}
      {batchResults.length === 0 && (
        <Alert>
          <AlertDescription>
            Utilisez le scanner par lot pour numériser plusieurs codes-barres rapidement. 
            Les résultats sont traités automatiquement et peuvent être exportés.
            Le mode hors-ligne est supporté avec synchronisation automatique.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}