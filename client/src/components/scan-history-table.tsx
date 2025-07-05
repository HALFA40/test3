import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, XCircle, FileSpreadsheet, Trash2, RotateCcw } from "lucide-react";
import { exportToExcel } from "@/lib/excel-utils";
import { useToast } from "@/hooks/use-toast";

export interface ScanHistoryItem {
  id: string;
  codeBarre: string;
  designation: string;
  disponible: boolean;
  nombreScanne: number;
  dateScanne: Date;
  derniereDate: Date;
  departement: string;
  bureau: string;
  beneficiaire: string;
  prix: number;
  deps: string;
  numbs: string;
}

interface ScanHistoryTableProps {
  scanHistory: ScanHistoryItem[];
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
}

export function ScanHistoryTable({ scanHistory, onClearHistory, onRemoveItem }: ScanHistoryTableProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(scanHistory.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleExportExcel = () => {
    const itemsToExport = scanHistory.filter(item => 
      selectedItems.size === 0 || selectedItems.has(item.id)
    );

    if (itemsToExport.length === 0) {
      toast({
        title: "Aucun élément à exporter",
        description: "Sélectionnez au moins un scan à exporter.",
        variant: "destructive",
      });
      return;
    }

    const exportData = itemsToExport.map(item => ({
      "Code-barres": item.codeBarre,
      "Désignation": item.designation,
      "Statut": item.disponible ? "Disponible" : "Non disponible",
      "Nombre de scans": item.nombreScanne,
      "Premier scan": item.dateScanne.toLocaleDateString('fr-FR'),
      "Dernier scan": item.derniereDate.toLocaleDateString('fr-FR'),
      "Heure dernier scan": item.derniereDate.toLocaleTimeString('fr-FR'),
      "Département": item.departement,
      "Bureau": item.bureau,
      "Bénéficiaire": item.beneficiaire,
      "Prix (DA)": item.prix,
      "DEPS": item.deps || '-',
      "NUMBS": item.numbs || '-',
    }));

    try {
      exportToExcel(exportData as any, `historique_scans_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Export réussi",
        description: `${itemsToExport.length} scan(s) exporté(s) vers Excel.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le fichier Excel.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      minimumFractionDigits: 2,
    }).format(value) + ' DA';
  };

  const totalScans = scanHistory.reduce((sum, item) => sum + item.nombreScanne, 0);
  const availableCount = scanHistory.filter(item => item.disponible).length;
  const unavailableCount = scanHistory.filter(item => !item.disponible).length;

  if (scanHistory.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <RotateCcw className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Aucun historique de scan</h3>
            <p>Commencez à scanner des codes-barres pour voir l'historique ici.</p>
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
            <CardTitle>Historique des scans</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              {scanHistory.length} code(s) unique(s) • {totalScans} scan(s) total • 
              <span className="text-green-600 ml-1">{availableCount} disponible(s)</span> • 
              <span className="text-red-600 ml-1">{unavailableCount} non disponible(s)</span>
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exporter Excel
            </Button>
            <Button variant="destructive" size="sm" onClick={onClearHistory}>
              <Trash2 className="mr-2 h-4 w-4" />
              Vider historique
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
                    checked={selectedItems.size === scanHistory.length && scanHistory.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Code-barres</TableHead>
                <TableHead>Désignation</TableHead>
                <TableHead>Nb. scans</TableHead>
                <TableHead>Premier scan</TableHead>
                <TableHead>Dernier scan</TableHead>
                <TableHead>Heure</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Prix (DA)</TableHead>
                <TableHead>DEPS</TableHead>
                <TableHead>NUMBS</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scanHistory.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.disponible ? "default" : "destructive"} className="text-xs">
                      {item.disponible ? (
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
                  <TableCell className="font-mono text-sm">{item.codeBarre}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.designation}</p>
                      <p className="text-sm text-muted-foreground">{item.bureau} - {item.beneficiaire}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-semibold">
                      {item.nombreScanne}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(item.dateScanne)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(item.derniereDate)}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {formatTime(item.derniereDate)}
                  </TableCell>
                  <TableCell>{item.departement}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(item.prix)}</TableCell>
                  <TableCell>{item.deps || '-'}</TableCell>
                  <TableCell>{item.numbs || '-'}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveItem(item.id)}
                      title="Supprimer de l'historique"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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