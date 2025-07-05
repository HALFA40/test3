import { useToast } from "@/hooks/use-toast";

export interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  variant?: "default" | "destructive" | "success";
}

export const useNotifications = () => {
  const { toast } = useToast();

  const showSuccess = (message: string, options?: NotificationOptions) => {
    toast({
      title: options?.title || "Succès",
      description: message,
      duration: options?.duration || 3000,
      variant: "default",
      className: "border-green-500 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300",
    });
  };

  const showError = (message: string, options?: NotificationOptions) => {
    toast({
      title: options?.title || "Erreur",
      description: message,
      duration: options?.duration || 5000,
      variant: "destructive",
    });
  };

  const showInfo = (message: string, options?: NotificationOptions) => {
    toast({
      title: options?.title || "Information",
      description: message,
      duration: options?.duration || 4000,
      variant: "default",
      className: "border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300",
    });
  };

  const showWarning = (message: string, options?: NotificationOptions) => {
    toast({
      title: options?.title || "Attention",
      description: message,
      duration: options?.duration || 4000,
      variant: "default",
      className: "border-yellow-500 text-yellow-700 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-300",
    });
  };

  // Operation-specific notifications
  const notifyItemCreated = (itemName?: string) => {
    showSuccess(`Article ${itemName ? `"${itemName}"` : ""} créé avec succès`);
  };

  const notifyItemUpdated = (itemName?: string) => {
    showSuccess(`Article ${itemName ? `"${itemName}"` : ""} modifié avec succès`);
  };

  const notifyItemDeleted = (count: number = 1) => {
    showSuccess(`${count} article${count > 1 ? 's' : ''} supprimé${count > 1 ? 's' : ''} avec succès`);
  };

  const notifyItemRestored = (count: number = 1) => {
    showSuccess(`${count} article${count > 1 ? 's' : ''} restauré${count > 1 ? 's' : ''} avec succès`);
  };

  const notifyBulkUpdate = (count: number) => {
    showSuccess(`${count} articles modifiés en lot avec succès`);
  };

  const notifyExportComplete = (format: string, count?: number) => {
    showSuccess(`Export ${format} terminé${count ? ` (${count} articles)` : ""}`);
  };

  const notifyImportComplete = (count: number) => {
    showSuccess(`Import terminé avec succès (${count} articles importés)`);
  };

  const notifySearchComplete = (count: number, searchTerm?: string) => {
    showInfo(`${count} résultat${count !== 1 ? 's' : ''} trouvé${count !== 1 ? 's' : ''}${searchTerm ? ` pour "${searchTerm}"` : ""}`);
  };

  const notifyBarcodeScanned = (barcode: string, found: boolean) => {
    if (found) {
      showSuccess(`Code-barres ${barcode} trouvé dans l'inventaire`);
    } else {
      showWarning(`Code-barres ${barcode} non trouvé dans l'inventaire`);
    }
  };

  const notifyNetworkStatus = (online: boolean) => {
    if (online) {
      showInfo("Connexion rétablie - Synchronisation en cours");
    } else {
      showWarning("Connexion perdue - Mode hors ligne activé");
    }
  };

  const notifyBackupCreated = () => {
    showSuccess("Sauvegarde automatique créée avec succès");
  };

  const notifyOperationError = (operation: string, error?: string) => {
    showError(`Erreur lors de ${operation}${error ? `: ${error}` : ""}`);
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    notifyItemCreated,
    notifyItemUpdated,
    notifyItemDeleted,
    notifyItemRestored,
    notifyBulkUpdate,
    notifyExportComplete,
    notifyImportComplete,
    notifySearchComplete,
    notifyBarcodeScanned,
    notifyNetworkStatus,
    notifyBackupCreated,
    notifyOperationError,
  };
};