import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Search, Calendar, CheckCircle, AlertCircle, Scan, StopCircle, Keyboard, Upload, FileSpreadsheet, Building2, MapPin, Edit } from "lucide-react";
import { useState, useRef } from "react";
import { importFromExcel, exportToExcel } from "@/lib/excel-utils";
import { useToast } from "@/hooks/use-toast";
import { NotFoundResultsTable } from "@/components/not-found-results-table";
import type { SearchResult } from "@shared/schema";

interface SearchModeTableProps {
  searchResults: SearchResult[];
  onRemoveItem: (id: number) => void;
  onClearAll: () => void;
  onClearFound: () => void;
  isSearchMode: boolean;
  onToggleSearchMode: () => void;
  onManualBarcodeSearch: (barcode: string, deps?: string, numbs?: string) => void;
  onImportResults?: (results: SearchResult[]) => void;
  onEditItem?: (item: SearchResult) => void;
  onOpenScanner?: () => void;
  filterOptions?: {
    departments: string[];
    categories: string[];
    conditions: string[];
  };
}

export function SearchModeTable({ 
  searchResults, 
  onRemoveItem, 
  onClearAll, 
  onClearFound,
  isSearchMode, 
  onToggleSearchMode,
  onManualBarcodeSearch,
  onImportResults,
  onEditItem,
  onOpenScanner,
  filterOptions
}: SearchModeTableProps) {
  const [manualBarcode, setManualBarcode] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [officeNumber, setOfficeNumber] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(date));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  };

  // Separate found and not found results
  const foundResults = searchResults.filter(result => result.found);
  const notFoundResults = searchResults.filter(result => !result.found);

  const handleManualSearch = () => {
    if (manualBarcode.trim()) {
      onManualBarcodeSearch(manualBarcode.trim(), selectedDepartment, officeNumber);
      setManualBarcode("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await importFromExcel(file);
      
      // Convert imported data to SearchResult format
      const searchResults: SearchResult[] = importedData.map((row: any, index: number) => ({
        id: Date.now() + index,
        code_barre: row["Code-barres"] || row.code_barre || "",
        date_recherche: new Date(),
        found: false // Default to not found, user can verify
      }));

      if (onImportResults) {
        onImportResults(searchResults);
      }

      toast({
        title: "Import réussi",
        description: `${searchResults.length} code(s)-barres importé(s) depuis Excel.`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erreur d'import",
        description: "Impossible d'importer le fichier Excel. Vérifiez le format du fichier.",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportNotFound = () => {
    const exportData = notFoundResults.map(item => ({
      "Code-barres": item.code_barre,
      "Date de recherche": formatDate(new Date(item.date_recherche)),
      "Heure de recherche": formatTime(new Date(item.date_recherche)),
      "Statut": "Non trouvé"
    }));

    if (exportData.length === 0) {
      toast({
        title: "Aucun élément à exporter",
        description: "Aucun code-barres non trouvé à exporter.",
        variant: "destructive",
      });
      return;
    }

    try {
      exportToExcel(exportData, `codes_barres_non_trouves_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast({
        title: "Export réussi",
        description: `${exportData.length} code(s)-barres non trouvé(s) exporté(s) vers Excel.`,
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

  return (
    <div className="space-y-6">
      {/* Search Mode Control */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center">
            <Scan className="mr-2 h-5 w-5 text-blue-500" />
            Mode Recherche Continue
          </CardTitle>
          <Button 
            onClick={onToggleSearchMode}
            variant={isSearchMode ? "destructive" : "default"}
            className={isSearchMode ? "bg-red-500 hover:bg-red-600" : ""}
          >
            {isSearchMode ? (
              <>
                <StopCircle className="mr-2 h-4 w-4" />
                Arrêter la recherche
              </>
            ) : (
              <>
                <Scan className="mr-2 h-4 w-4" />
                Mode recherche
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search Configuration */}
          {isSearchMode && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-blue-800 dark:text-blue-200">
                <MapPin className="mr-2 h-5 w-5" />
                Configuration de recherche
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department" className="text-sm font-medium">
                    DEPS *
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="department"
                      type="text"
                      placeholder="Ex: Informatique, Comptabilité, etc."
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="pl-10"
                    />
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="office" className="text-sm font-medium">
                    NUMBS *
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="office"
                      type="text"
                      placeholder="Ex: 101, A-205, etc."
                      value={officeNumber}
                      onChange={(e) => setOfficeNumber(e.target.value)}
                      className="pl-10"
                    />
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  </div>
                </div>
              </div>
              {(!selectedDepartment || !officeNumber) && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 flex items-center">
                  <AlertCircle className="mr-1 h-4 w-4" />
                  Veuillez renseigner le DEPS et le NUMBS pour commencer la recherche
                </p>
              )}
            </div>
          )}

          {/* Manual Barcode Input */}
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Saisir un code-barres manuellement..."
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pr-10"
                  disabled={isSearchMode && (!selectedDepartment || !officeNumber)}
                />
                <Keyboard className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              {onOpenScanner && (
                <Button 
                  onClick={onOpenScanner}
                  disabled={isSearchMode && (!selectedDepartment || !officeNumber)}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800"
                >
                  <Scan className="mr-2 h-4 w-4" />
                  Scanner
                </Button>
              )}
              <Button 
                onClick={handleManualSearch}
                disabled={!manualBarcode.trim() || (isSearchMode && (!selectedDepartment || !officeNumber))}
                variant="outline"
              >
                <Search className="mr-2 h-4 w-4" />
                Rechercher
              </Button>
            </div>
          </div>

          {isSearchMode ? (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-blue-800 dark:text-blue-200 font-medium">
                🔍 Mode recherche actif pour {selectedDepartment} - Bureau {officeNumber}
              </p>
              <p className="text-blue-600 dark:text-blue-300 text-sm mt-1">
                Utilisez la saisie manuelle ci-dessus pour rechercher vos codes-barres. Chaque recherche sera sauvegardée dans le tableau ci-dessous.
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Cliquez sur "Mode recherche" pour activer la recherche continue avec configuration de département et bureau
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results Tables */}
      {searchResults.length > 0 && (
        <>
          {/* Found Results */}
          {foundResults.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  Articles trouvés ({foundResults.length})
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onClearFound}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Vider tous
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code-barres</TableHead>
                        <TableHead>Désignation</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Nb. scans</TableHead>
                        <TableHead>Premier scan</TableHead>
                        <TableHead>Dernier scan</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {foundResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-mono font-medium">
                            {result.code_barre}
                          </TableCell>
                          <TableCell>
                            {result.designation || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Trouvé
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {result.scan_count}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDate(result.date_recherche)}</div>
                              <div className="text-muted-foreground">{formatTime(result.date_recherche)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDate(result.last_scan_date)}</div>
                              <div className="text-muted-foreground">{formatTime(result.last_scan_date)}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {onEditItem && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onEditItem(result)}
                                  title="Éditer l'article"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemoveItem(result.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
          )}

          {/* Not Found Results */}
          {notFoundResults.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                  Articles non trouvés ({notFoundResults.length})
                </CardTitle>
                {searchResults.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onClearAll}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Vider tout
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code-barres</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Nb. scans</TableHead>
                        <TableHead>Premier scan</TableHead>
                        <TableHead>Dernier scan</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notFoundResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-mono font-medium">
                            {result.code_barre}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="flex w-fit items-center">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Non trouvé
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {result.scan_count}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDate(result.date_recherche)}</div>
                              <div className="text-muted-foreground">{formatTime(result.date_recherche)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDate(result.last_scan_date)}</div>
                              <div className="text-muted-foreground">{formatTime(result.last_scan_date)}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {onEditItem && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onEditItem(result)}
                                  title="Éditer l'article"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemoveItem(result.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
          )}
        </>
      )}

      {searchResults.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Aucun résultat de recherche</p>
              <p className="text-sm">
                Activez le mode recherche pour commencer à scanner des codes-barres
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}