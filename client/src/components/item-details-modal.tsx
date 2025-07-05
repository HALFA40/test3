import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, FileText, X } from "lucide-react";
import { generateItemPDF } from "@/lib/pdf-utils";
import { useToast } from "@/hooks/use-toast";
import type { InventoryItem } from "@shared/schema";

interface ItemDetailsModalProps {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onEdit: (item: InventoryItem) => void;
}

export function ItemDetailsModal({ item, open, onClose, onUpdate, onEdit }: ItemDetailsModalProps) {
  const { toast } = useToast();

  if (!item) return null;

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('fr-DZ', {
      minimumFractionDigits: 2,
    }).format(parseFloat(value)) + ' DA';
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const handleGeneratePDF = async () => {
    try {
      await generateItemPDF(item);
      toast({
        title: "PDF généré",
        description: "La fiche PDF a été téléchargée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF.",
        variant: "destructive",
      });
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'bon':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'moyen':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'défaillant':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Détails de l'article
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Item Image Placeholder */}
          <div className="space-y-4">
            <div className="bg-muted rounded-lg h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted-foreground/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">IMG</span>
                </div>
                <p className="text-muted-foreground">Image de l'article</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-muted rounded h-16 flex items-center justify-center">
                  <span className="text-muted-foreground text-xs">IMG</span>
                </div>
              ))}
            </div>
          </div>

          {/* Item Details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{item.designation}</h3>
              <Badge 
                variant={item.quantite > 0 ? "default" : "destructive"}
                className="mb-4"
              >
                {item.quantite > 0 ? "Disponible" : "Non disponible"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Code-barres</label>
                <p className="font-mono mt-1">{item.code_barre}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">N° Inventaire</label>
                <p className="font-semibold mt-1">{item.num_inventaire}</p>
              </div>
            </div>

            {item.old_num_inventaire && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ancien N° Inventaire</label>
                <p className="mt-1">{item.old_num_inventaire}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Département</label>
                <p className="mt-1">{item.departement}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Bureau</label>
                <p className="mt-1">{item.num_bureau}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Bénéficiaire</label>
              <p className="mt-1">{item.beneficiaire}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Quantité</label>
                <p className="mt-1">{item.quantite}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Prix</label>
                <p className="font-semibold text-lg mt-1">{formatCurrency(item.prix)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Catégorie</label>
                <p className="mt-1">{item.categorie}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Condition</label>
                <Badge className={`mt-1 ${getConditionColor(item.condition)}`}>
                  {item.condition}
                </Badge>
              </div>
            </div>

            {item.num_serie && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">N° Série</label>
                <p className="font-mono mt-1">{item.num_serie}</p>
              </div>
            )}

            {item.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm mt-1">{item.description}</p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <label className="font-medium">Date d'ajout</label>
                <p className="mt-1">{formatDate(item.date_ajouter)}</p>
              </div>
              <div>
                <label className="font-medium">Dernière modification</label>
                <p className="mt-1">{formatDate(item.date_modification)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button variant="outline" onClick={() => onEdit(item)}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          <Button onClick={handleGeneratePDF}>
            <FileText className="mr-2 h-4 w-4" />
            Fiche PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
