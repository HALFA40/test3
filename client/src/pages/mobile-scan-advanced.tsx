import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Wifi, WifiOff, Mic, MicOff, Layers, ScanLine, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MobileQuickScan } from '@/components/mobile-quick-scan';
import { BatchScanner } from '@/components/batch-scanner';
import { ErrorBoundary } from '@/components/error-boundary';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { useVoiceInput } from '@/hooks/use-voice-input';
import { useNotifications } from '@/lib/toast-notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { InventoryItem, InsertSearchResult } from '@shared/schema';

export default function MobileScanAdvancedPage() {
  const [activeTab, setActiveTab] = useState('quick');
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  const isMobile = useIsMobile();
  const { isOnline, pendingActions, isSyncing } = useOfflineSync();
  const { showSuccess, showInfo } = useNotifications();
  const queryClient = useQueryClient();

  const {
    isListening,
    isSupported: voiceSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    processVoiceCommand
  } = useVoiceInput({
    lang: 'fr-FR',
    continuous: false,
    interimResults: true
  });

  // Add search result for items not found
  const addSearchResultMutation = useMutation({
    mutationFn: async (searchResult: InsertSearchResult) => {
      return apiRequest('/api/search-results', 'POST', searchResult);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
    },
  });

  const handleItemNotFound = (barcode: string) => {
    addSearchResultMutation.mutate({
      code_barre: barcode,
      designation: null,
      found: false,
    });
  };

  const handleItemFound = (item: InventoryItem, barcode: string) => {
    showSuccess(`Article trouvé: ${item.designation}`);
  };

  // Handle voice commands
  useEffect(() => {
    if (transcript && voiceEnabled) {
      const command = processVoiceCommand(transcript);
      
      if (command) {
        switch (command.action) {
          case 'navigate':
            if (command.target === 'inventory') {
              window.location.href = '/';
            }
            break;
          case 'search':
            if (command.query) {
              setSearchQuery(command.query);
            }
            break;
          case 'input':
            if (command.value) {
              setSearchQuery(command.value);
            }
            break;
          case 'clear':
            setSearchQuery('');
            break;
          case 'scan':
            setActiveTab('quick');
            break;
        }
        resetTranscript();
      }
    }
  }, [transcript, voiceEnabled, processVoiceCommand, resetTranscript]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b p-4 sticky top-0 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <ScanLine className="h-5 w-5" />
                <h1 className="text-lg font-semibold">Scanner Mobile Avancé</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Network Status */}
              <Badge variant={isOnline ? "default" : "secondary"} className="text-xs">
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    En ligne
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Hors ligne
                  </>
                )}
              </Badge>

              {/* Pending Sync Badge */}
              {pendingActions > 0 && (
                <Badge variant="outline" className="text-xs">
                  {pendingActions} en attente
                </Badge>
              )}

              {/* Voice Control */}
              {voiceSupported && (
                <Button
                  variant={isListening ? "default" : "outline"}
                  size="sm"
                  onClick={handleVoiceToggle}
                  className="relative"
                >
                  {isListening ? (
                    <Volume2 className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Voice Feedback */}
          {(transcript || interimTranscript) && (
            <div className="mt-2 p-2 bg-muted rounded text-sm">
              <span className="font-medium">{transcript}</span>
              <span className="text-muted-foreground">{interimTranscript}</span>
            </div>
          )}

          {/* Search Bar with Voice */}
          <div className="mt-4 relative">
            <Input
              placeholder="Recherche vocale ou manuelle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-20"
            />
            {voiceSupported && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoiceToggle}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </header>

        {/* Sync Status */}
        {isSyncing && (
          <Alert className="m-4">
            <AlertDescription>
              Synchronisation en cours... {pendingActions} actions en attente
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <main className="p-4 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quick" className="flex items-center gap-2">
                <ScanLine className="h-4 w-4" />
                Scan Rapide
              </TabsTrigger>
              <TabsTrigger value="batch" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Scan par Lot
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quick" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ScanLine className="h-5 w-5" />
                    Scanner Rapide
                    {!isOnline && <Badge variant="secondary">Mode hors ligne</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MobileQuickScan 
                    onItemFound={handleItemFound}
                    onItemNotFound={handleItemNotFound}
                  />
                </CardContent>
              </Card>

              {/* Voice Commands Help */}
              {voiceSupported && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Commandes Vocales</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <div>"Rechercher [terme]" - Lance une recherche</div>
                    <div>"Scanner" - Active le scanner</div>
                    <div>"Effacer" - Vide le champ de recherche</div>
                    <div>"Aller à inventaire" - Retour à l'inventaire</div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="batch" className="space-y-4">
              <BatchScanner
                onBatchComplete={(results) => {
                  showInfo(`Lot terminé: ${results.length} articles scannés`);
                }}
                onItemFound={handleItemFound}
                onItemNotFound={handleItemNotFound}
                maxBatchSize={100}
                autoProcess={true}
              />
            </TabsContent>
          </Tabs>

          {/* Mobile Optimization Notice */}
          {!isMobile && (
            <Alert>
              <AlertDescription>
                Cette interface est optimisée pour les appareils mobiles. 
                Utilisez un smartphone ou une tablette pour une meilleure expérience.
              </AlertDescription>
            </Alert>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}