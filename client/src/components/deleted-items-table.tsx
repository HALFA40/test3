import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Undo2, Trash2, AlertTriangle } from "lucide-react";
import { DeletedItem } from "@shared/schema";

interface DeletedItemsTableProps {
  deletedItems: DeletedItem[];
  onRestore: (item: DeletedItem) => void;
  onPermanentDelete: (item: DeletedItem) => void;
  onBulkRestore?: (items: DeletedItem[]) => void;
  onBulkPermanentDelete?: (items: DeletedItem[]) => void;
  isLoading?: boolean;
}

export function DeletedItemsTable({ 
  deletedItems, 
  onRestore, 
  onPermanentDelete,
  onBulkRestore,
  onBulkPermanentDelete,
  isLoading = false 
}: DeletedItemsTableProps) {
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showBulkRestoreDialog, setShowBulkRestoreDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const handleRestore = async (item: DeletedItem) => {
    setRestoringId(item.id);
    try {
      await onRestore(item);
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (item: DeletedItem) => {
    setDeletingId(item.id);
    try {
      await onPermanentDelete(item);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectItem = (itemId: number, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(deletedItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleBulkRestore = () => {
    if (onBulkRestore) {
      const itemsToRestore = deletedItems.filter(item => selectedItems.includes(item.id));
      onBulkRestore(itemsToRestore);
      setSelectedItems([]);
    }
    setShowBulkRestoreDialog(false);
  };

  const handleBulkPermanentDelete = () => {
    if (onBulkPermanentDelete) {
      const itemsToDelete = deletedItems.filter(item => selectedItems.includes(item.id));
      onBulkPermanentDelete(itemsToDelete);
      setSelectedItems([]);
    }
    setShowBulkDeleteDialog(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (deletedItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trash2 className="mr-2 h-5 w-5" />
            Articles Supprimés
          </CardTitle>
          <CardDescription>
            Gérez les articles supprimés - restaurez ou supprimez définitivement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trash2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Aucun article supprimé</p>
            <p className="text-sm">Les articles supprimés apparaîtront ici</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Trash2 className="mr-2 h-5 w-5" />
            Articles Supprimés ({deletedItems.length})
          </div>
          <Badge variant="secondary">
            {deletedItems.length} article{deletedItems.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription>
          Gérez les articles supprimés - restaurez ou supprimez définitivement
        </CardDescription>
        {selectedItems.length > 0 && (
          <div className="flex gap-2 mt-4">
            <AlertDialog open={showBulkRestoreDialog} onOpenChange={setShowBulkRestoreDialog}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  Restaurer ({selectedItems.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Restaurer les articles sélectionnés</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir restaurer {selectedItems.length} article{selectedItems.length > 1 ? 's' : ''} sélectionné{selectedItems.length > 1 ? 's' : ''} ? 
                    {selectedItems.length > 1 ? 'Ils' : 'Il'} {selectedItems.length > 1 ? 'seront' : 'sera'} remis dans l'inventaire principal.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkRestore}>
                    Restaurer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer ({selectedItems.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center text-red-600">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Supprimer définitivement
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    ⚠️ Cette action est irréversible ! Êtes-vous sûr de vouloir supprimer définitivement {selectedItems.length} article{selectedItems.length > 1 ? 's' : ''} sélectionné{selectedItems.length > 1 ? 's' : ''} ? 
                    Ces données seront perdues à jamais.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleBulkPermanentDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Supprimer définitivement
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 mb-1">Attention</p>
              <p className="text-yellow-700">
                Les articles supprimés peuvent être restaurés ou supprimés définitivement. 
                La suppression définitive est irréversible.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.length === deletedItems.length && deletedItems.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Sélectionner tous les articles"
                  />
                </TableHead>
                <TableHead>Code-barres</TableHead>
                <TableHead>Désignation</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Bureau</TableHead>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead>Date Suppression</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deletedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      aria-label={`Sélectionner ${item.designation}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.code_barre}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.designation}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.departement}</Badge>
                  </TableCell>
                  <TableCell>{item.num_bureau}</TableCell>
                  <TableCell>{item.beneficiaire}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatDate(item.date_suppression)}</div>
                      <div className="text-muted-foreground">{formatTime(item.date_suppression)}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(item)}
                        disabled={restoringId === item.id || isLoading}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Undo2 className="h-4 w-4 mr-1" />
                        {restoringId === item.id ? "Restauration..." : "Restaurer"}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deletingId === item.id || isLoading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {deletingId === item.id ? "Suppression..." : "Supprimer"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Suppression définitive</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer définitivement "{item.designation}" ?
                              Cette action est irréversible et l'article ne pourra plus être restauré.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handlePermanentDelete(item)}
                              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            >
                              Supprimer définitivement
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}