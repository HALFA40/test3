import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Edit, Trash2, Save, FileText, Download, ArrowUpDown, CheckCircle, XCircle, FileSpreadsheet, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { generateMultipleItemsPDF } from "@/lib/pdf-utils";
import { exportToExcel } from "@/lib/excel-utils";
import { useToast } from "@/hooks/use-toast";
import type { InventoryItem } from "@shared/schema";

interface InventoryTableProps {
  data?: { items: InventoryItem[]; total: number };
  isLoading: boolean;
  onItemSelect: (item: InventoryItem) => void;
  onItemEdit: (item: InventoryItem) => void;
  onItemDelete: (item: InventoryItem) => void;
  onBulkDelete?: (itemIds: number[]) => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string, order: 'asc' | 'desc') => void;
  onExportExcel?: () => void;
  onImportExcel?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onGeneratePDF?: () => void;
  onSaveSelection?: () => void;
}

export function InventoryTable({
  data,
  isLoading,
  onItemSelect,
  onItemEdit,
  onItemDelete,
  onBulkDelete,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortBy,
  sortOrder,
  onSort,
  onExportExcel,
  onImportExcel,
  onGeneratePDF,
  onSaveSelection,
}: InventoryTableProps) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [columnWidths, setColumnWidths] = useState({
    checkbox: 40,
    status: 100,
    barcode: 130,
    inventory: 110,
    designation: 200,
    description: 150,
    department: 100,
    office: 80,
    beneficiary: 120,
    quantity: 60,
    price: 100,
    condition: 80,
    actions: 100
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const tableRef = useRef<HTMLTableElement>(null);
  const { toast } = useToast();

  const handleMouseDown = useCallback((e: React.MouseEvent, column: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingColumn(column);
    setStartX(e.clientX);
    setStartWidth(columnWidths[column as keyof typeof columnWidths]);
  }, [columnWidths]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizingColumn) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff); // Minimum width of 50px
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }));
  }, [isResizing, resizingColumn, startX, startWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizingColumn(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.items) {
      setSelectedItems(new Set(data.items.map(item => item.id)));
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

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(field, newOrder);
  };

  const handleExportSelected = () => {
    const selectedItemsList = items.filter(item => selectedItems.has(item.id));
    if (selectedItemsList.length === 0) {
      toast({
        title: "Aucun élément sélectionné",
        description: "Veuillez sélectionner au moins un article à exporter.",
        variant: "destructive",
      });
      return;
    }
    exportToExcel(selectedItemsList, `inventaire_selection_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({
      title: "Export réussi",
      description: `${selectedItemsList.length} article(s) exporté(s) vers Excel.`,
    });
  };

  const handleGeneratePDFSelected = async () => {
    const selectedItemsList = items.filter(item => selectedItems.has(item.id));
    if (selectedItemsList.length === 0) {
      toast({
        title: "Aucun élément sélectionné",
        description: "Veuillez sélectionner au moins un article pour générer la fiche bureau.",
        variant: "destructive",
      });
      return;
    }
    try {
      await generateMultipleItemsPDF(selectedItemsList, "FICHE DE BUREAU - SÉLECTION");
      toast({
        title: "PDF généré",
        description: `Fiche bureau créée pour ${selectedItemsList.length} article(s).`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer la fiche bureau.",
        variant: "destructive",
      });
    }
  };

  const handleSaveSelected = () => {
    const selectedItemsList = items.filter(item => selectedItems.has(item.id));
    if (selectedItemsList.length === 0) {
      toast({
        title: "Aucun élément sélectionné",
        description: "Veuillez sélectionner au moins un article à sauvegarder.",
        variant: "destructive",
      });
      return;
    }
    if (onSaveSelection) {
      onSaveSelection();
    } else {
      // Default behavior - save as JSON
      const dataStr = JSON.stringify(selectedItemsList, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `inventaire_selection_${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      toast({
        title: "Sauvegarde réussie",
        description: `${selectedItemsList.length} article(s) sauvegardé(s).`,
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;
    
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${selectedItems.size} article(s) sélectionné(s) ? Cette action peut être annulée depuis l'onglet Corbeille.`
    );
    
    if (confirmed && onBulkDelete) {
      const itemIds = Array.from(selectedItems);
      onBulkDelete(itemIds);
      setSelectedItems(new Set());
      toast({
        title: "Articles supprimés",
        description: `${itemIds.length} article(s) supprimé(s) avec succès.`,
      });
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('fr-DZ', {
      minimumFractionDigits: 2,
    }).format(parseFloat(value)) + ' DA';
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);
  const availableCount = items.filter(item => item.quantite > 0).length;
  const unavailableCount = items.filter(item => item.quantite === 0).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>Résultats de recherche</CardTitle>
            <p className="text-muted-foreground text-sm">
              {total.toLocaleString('fr-FR')} articles trouvés
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleGeneratePDFSelected}
              disabled={selectedItems.size === 0}
            >
              <FileText className="mr-2 h-4 w-4" />
              Fiche bureau ({selectedItems.size})
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSaveSelected}
              disabled={selectedItems.size === 0}
            >
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder ({selectedItems.size})
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onExportExcel || handleExportSelected}
              disabled={selectedItems.size === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Exporter ({selectedItems.size})
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteSelected}
              disabled={selectedItems.size === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer ({selectedItems.size})
            </Button>
            
            {onImportExcel && (
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={onImportExcel}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="excel-import-table"
                />
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="excel-import-table" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Importer Excel
                  </label>
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Table Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 par page</SelectItem>
                <SelectItem value="50">50 par page</SelectItem>
                <SelectItem value="100">100 par page</SelectItem>
                <SelectItem value="250">250 par page</SelectItem>
                <SelectItem value="500">500 par page</SelectItem>
                <SelectItem value="1000">1000 par page</SelectItem>
                <SelectItem value="9999">Tout afficher</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Statut:</span>
              <span className="flex items-center">
                <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                Disponible ({availableCount})
              </span>
              <span className="flex items-center">
                <XCircle className="w-3 h-3 text-red-500 mr-1" />
                Non disponible ({unavailableCount})
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Trier par:</span>
            <Select value={`${sortBy}_${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('_');
              onSort(field, order as 'asc' | 'desc');
            }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_ajouter_desc">Date ajout (récent)</SelectItem>
                <SelectItem value="date_ajouter_asc">Date ajout (ancien)</SelectItem>
                <SelectItem value="designation_asc">Nom (A-Z)</SelectItem>
                <SelectItem value="designation_desc">Nom (Z-A)</SelectItem>
                <SelectItem value="prix_asc">Prix (croissant)</SelectItem>
                <SelectItem value="prix_desc">Prix (décroissant)</SelectItem>
                <SelectItem value="departement_asc">Département</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table ref={tableRef} className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead style={{width: `${columnWidths.checkbox}px`}} className="text-center relative group">
                  <Checkbox
                    checked={selectedItems.size === items.length && items.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <div 
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 transition-opacity"
                    onMouseDown={(e) => handleMouseDown(e, 'checkbox')}
                  />
                </TableHead>
                <TableHead style={{width: `${columnWidths.status}px`}} className="text-center relative group">
                  Statut
                  <div 
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 transition-opacity"
                    onMouseDown={(e) => handleMouseDown(e, 'status')}
                  />
                </TableHead>
                <TableHead style={{width: `${columnWidths.barcode}px`}} className="cursor-pointer hover:bg-muted/50 relative group" onClick={() => handleSort('code_barre')}>
                  Code-barres <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                  <div 
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 transition-opacity"
                    onMouseDown={(e) => handleMouseDown(e, 'barcode')}
                  />
                </TableHead>
                <TableHead style={{width: `${columnWidths.inventory}px`}} className="cursor-pointer hover:bg-muted/50 relative group" onClick={() => handleSort('num_inventaire')}>
                  N° Inv. <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                  <div 
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 transition-opacity"
                    onMouseDown={(e) => handleMouseDown(e, 'inventory')}
                  />
                </TableHead>
                <TableHead style={{width: `${columnWidths.designation}px`}} className="cursor-pointer hover:bg-muted/50 relative group" onClick={() => handleSort('designation')}>
                  Désignation <ArrowUpDown className="ml-1 h-4 w-4 inline" />
                  <div 
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 transition-opacity"
                    onMouseDown={(e) => handleMouseDown(e, 'designation')}
                  />
                </TableHead>
                <TableHead style={{width: `${columnWidths.description}px`}} className="relative group">
                  Description
                  <div 
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 transition-opacity"
                    onMouseDown={(e) => handleMouseDown(e, 'description')}
                  />
                </TableHead>
                <TableHead style={{width: `${columnWidths.department}px`}} className="relative group">
                  Dept.
                  <div 
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 transition-opacity"
                    onMouseDown={(e) => handleMouseDown(e, 'department')}
                  />
                </TableHead>
                <TableHead style={{width: `${columnWidths.office}px`}} className="text-center relative group">
                  Bureau
                  <div 
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 transition-opacity"
                    onMouseDown={(e) => handleMouseDown(e, 'office')}
                  />
                </TableHead>
                <TableHead style={{width: `${columnWidths.beneficiary}px`}} className="relative group">
                  Bénéficiaire
                  <div 
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 transition-opacity"
                    onMouseDown={(e) => handleMouseDown(e, 'beneficiary')}
                  />
                </TableHead>
                <TableHead style={{width: `${columnWidths.quantity}px`}} className="text-center relative group">
                  Qté
                  <div 
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 transition-opacity"
                    onMouseDown={(e) => handleMouseDown(e, 'quantity')}
                  />
                </TableHead>
                <TableHead style={{width: `${columnWidths.price}px`}} className="text-right relative group">
                  Prix (DA)
                  <div 
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 transition-opacity"
                    onMouseDown={(e) => handleMouseDown(e, 'price')}
                  />
                </TableHead>
                <TableHead style={{width: `${columnWidths.condition}px`}} className="text-center relative group">
                  État
                  <div 
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 transition-opacity"
                    onMouseDown={(e) => handleMouseDown(e, 'condition')}
                  />
                </TableHead>
                <TableHead style={{width: `${columnWidths.actions}px`}} className="text-center relative group">
                  Actions
                  <div 
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 transition-opacity"
                    onMouseDown={(e) => handleMouseDown(e, 'actions')}
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50 h-12">
                  <TableCell className="text-center px-1">
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="text-center px-1">
                    <Badge variant={item.quantite > 0 ? "default" : "destructive"} className="text-xs px-1">
                      {item.quantite > 0 ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Disp.
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-1 h-3 w-3" />
                          Indis.
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs px-1" title={item.code_barre}>
                    <div className="truncate">{item.code_barre}</div>
                  </TableCell>
                  <TableCell className="font-semibold text-sm px-1" title={item.num_inventaire}>
                    <div className="truncate">{item.num_inventaire}</div>
                  </TableCell>
                  <TableCell className="px-1">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-muted rounded mr-1 flex items-center justify-center flex-shrink-0">
                        <span className="text-muted-foreground text-xs">IMG</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate" title={item.designation}>{item.designation}</p>
                        {item.num_serie && (
                          <p className="text-xs text-muted-foreground truncate" title={`S/N: ${item.num_serie}`}>S/N: {item.num_serie}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-1">
                    <p className="text-xs text-muted-foreground truncate" title={item.description || ""}>
                      {item.description || "-"}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm px-1 truncate" title={item.departement}>{item.departement}</TableCell>
                  <TableCell className="text-sm px-1 text-center">{item.num_bureau}</TableCell>
                  <TableCell className="text-sm px-1 truncate" title={item.beneficiaire}>{item.beneficiaire}</TableCell>
                  <TableCell className="text-center px-1">{item.quantite}</TableCell>
                  <TableCell className="font-semibold text-sm px-1 text-right">{formatCurrency(item.prix)}</TableCell>
                  <TableCell className="px-1 text-center">
                    <Badge variant="outline" className="text-xs px-1">
                      {item.condition}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-1 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onItemSelect(item)}
                        title="Voir détails"
                        className="h-7 w-7 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onItemEdit(item)}
                        title="Modifier"
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onItemDelete(item)}
                        title="Supprimer"
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Affichage de <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> à{" "}
            <span className="font-medium">{Math.min(currentPage * pageSize, total)}</span> sur{" "}
            <span className="font-medium">{total.toLocaleString('fr-FR')}</span> résultats
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </Button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="text-muted-foreground">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
