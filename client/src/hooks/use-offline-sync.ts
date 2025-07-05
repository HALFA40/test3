import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '@/lib/toast-notifications';

interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();
  const { notifyNetworkStatus, showSuccess, showError } = useNotifications();

  // Load pending actions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('offline-actions');
    if (saved) {
      try {
        setPendingActions(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load pending actions:', error);
        localStorage.removeItem('offline-actions');
      }
    }
  }, []);

  // Save pending actions to localStorage
  useEffect(() => {
    localStorage.setItem('offline-actions', JSON.stringify(pendingActions));
  }, [pendingActions]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      notifyNetworkStatus(true);
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      notifyNetworkStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [notifyNetworkStatus]);

  // Add action to offline queue
  const queueAction = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    setPendingActions(prev => [...prev, newAction]);
    
    if (isOnline) {
      syncPendingActions();
    }
  }, [isOnline]);

  // Sync pending actions when online
  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0 || isSyncing) return;

    setIsSyncing(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;
      const failedActions: OfflineAction[] = [];

      for (const action of pendingActions) {
        try {
          const response = await fetch(action.endpoint, {
            method: action.type === 'CREATE' ? 'POST' : 
                   action.type === 'UPDATE' ? 'PUT' : 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: action.data ? JSON.stringify(action.data) : null,
          });

          if (response.ok) {
            successCount++;
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          failedActions.push(action);
          errorCount++;
        }
      }

      // Update pending actions (keep only failed ones)
      setPendingActions(failedActions);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory-stats'] });

      if (successCount > 0) {
        showSuccess(`${successCount} action${successCount > 1 ? 's' : ''} synchronisée${successCount > 1 ? 's' : ''}`);
      }

      if (errorCount > 0) {
        showError(`${errorCount} action${errorCount > 1 ? 's' : ''} en échec - nouvel essai plus tard`);
      }

    } catch (error) {
      console.error('Sync failed:', error);
      showError('Erreur de synchronisation');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, pendingActions, isSyncing, queryClient, showSuccess, showError]);

  // Trigger sync when coming online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      const timer = setTimeout(syncPendingActions, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingActions.length, syncPendingActions]);

  return {
    isOnline,
    pendingActions: pendingActions.length,
    isSyncing,
    queueAction,
    syncPendingActions,
  };
}