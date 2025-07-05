import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, XCircle, FileSpreadsheet, Save, Trash2, Upload, Edit } from "lucide-react";
import { exportToExcel, importFromExcel } from "@/lib/excel-utils";
import { useToast } from "@/hooks/use-toast";
import type { InventoryItem } from "@shared/schema";

interface SearchResult extends InventoryItem {
  available: boolean;
  scanDate: Date;
}

interface SearchResultsTableProps {
  searchResults: SearchResult[];
  onRemoveItem: (id: number) => void;
  onClearAll: () => void;
  onImportResults?: (results: SearchResult[]) => void;
  onEditItem?: (item: SearchResult) => void;
}

export function SearchResultsTable({ searchResults, onRemoveItem, onClearAll, onImportResults, onEditItem }: SearchResultsTableProps) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(searchResults.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleExportExcel = () => {
    const itemsToExport = searchResults.filter(item => 
      selectedItems.size === 0 || selectedItems.has(item.id)
    );

    if (itemsToExport.length === 0) {
      toast({
        title: "Aucun élément à exporter",
        description: "Sélectionnez au moins un article à exporter.",
        variant: "destructive",
      });
      return;
    }

    const exportData = itemsToExport.map(item => ({
      ...item,
      statut: item.available ? "Disponible" : "Non disponible",
      date_scan: item.scanDate.toLocaleDateString('fr-FR'),
    }));

    exportToExcel(exportData, `recherche_codes_barres_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Export réussi",
      description: `${itemsToExport.length} article(s) exporté(s) vers Excel.`,
    });
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('fr-DZ', {
      minimumFractionDigits: 2,
    }).format(parseFloat(value)) + ' DA';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR');
  };

  const availableCount = searchResults.filter(item => item.available).length;
  const unavailableCount = searchResults.filter(item => !item.available).length;

  if (searchResults.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <CheckCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Aucun résultat de recherche</h3>
            <p>Scannez ou recherchez des codes-barres pour voir les résultats ici.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Résultats de recherche</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              {searchResults.length} code(s)-barres scanné(s) • 
              <span className="text-green-600 ml-1">{availableCount} disponible(s)</span> • 
              <span className="text-red-600 ml-1">{unavailableCount} non disponible(s)</span>
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exporter Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => {}}>
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder
            </Button>
            <Button variant="destructive" size="sm" onClick={onClearAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              Vider
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.size === searchResults.length && searchResults.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Code-barres</TableHead>
                <TableHead>Désignation</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Bureau</TableHead>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead>Prix (DA)</TableHead>
                <TableHead>Heure scan</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.available ? "default" : "destructive"} className="text-xs">
                      {item.available ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Disponible
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-1 h-3 w-3" />
                          Non disponible
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{item.code_barre}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-muted rounded mr-3 flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">IMG</span>
                      </div>
                      <div>
                        <p className="font-medium">{item.designation}</p>
                        <p className="text-sm text-muted-foreground">{item.categorie}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.departement}</TableCell>
                  <TableCell>{item.num_bureau}</TableCell>
                  <TableCell>{item.beneficiaire}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(item.prix)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatTime(item.scanDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {onEditItem && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditItem(item)}
                          title="Éditer l'article"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveItem(item.id)}
                        title="Supprimer de la liste"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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