import { useState, useMemo, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Edit, Trash2, Save, FileText, Download, ArrowUpDown, CheckCircle, XCircle, FileSpreadsheet, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { generateMultipleItemsPDF } from "@/lib/pdf-utils";
import { exportToExcel } from "@/lib/excel-utils";
import { useToast } from "@/hooks/use-toast";
import type { InventoryItem } from "@shared/schema";

interface VirtualInventoryTableProps {
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

interface TableRowProps {
  index: number;
  style: any;
  data: {
    items: InventoryItem[];
    selectedItems: Set<number>;
    onSelectItem: (itemId: number, checked: boolean) => void;
    onItemSelect: (item: InventoryItem) => void;
    onItemEdit: (item: InventoryItem) => void;
    onItemDelete: (item: InventoryItem) => void;
    columnWidths: Record<string, number>;
  };
}

const TableRow = ({ index, style, data }: TableRowProps) => {
  const { items, selectedItems, onSelectItem, onItemSelect, onItemEdit, onItemDelete, columnWidths } = data;
  const item = items[index];

  if (!item) return null;

  const isSelected = selectedItems.has(item.id);

  return (
    <div style={style} className="flex items-center border-b border-border hover:bg-muted/50 px-4">
      <div style={{width: `${columnWidths.checkbox}px`}} className="flex justify-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectItem(item.id, checked as boolean)}
        />
      </div>
      
      <div style={{width: `${columnWidths.status}px`}} className="flex justify-center">
        {item.condition === 'Bon' ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
      
      <div style={{width: `${columnWidths.barcode}px`}} className="px-2 truncate">
        {item.code_barre}
      </div>
      
      <div style={{width: `${columnWidths.inventory}px`}} className="px-2 truncate">
        {item.num_inventaire}
      </div>
      
      <div style={{width: `${columnWidths.designation}px`}} className="px-2 truncate" title={item.designation}>
        {item.designation}
      </div>
      
      <div style={{width: `${columnWidths.description}px`}} className="px-2 truncate" title={item.description || ''}>
        {item.description || 'N/A'}
      </div>
      
      <div style={{width: `${columnWidths.department}px`}} className="px-2 truncate">
        {item.departement}
      </div>
      
      <div style={{width: `${columnWidths.office}px`}} className="text-center px-2">
        {item.num_bureau}
      </div>
      
      <div style={{width: `${columnWidths.beneficiary}px`}} className="px-2 truncate">
        {item.beneficiaire}
      </div>
      
      <div style={{width: `${columnWidths.quantity}px`}} className="text-center px-2">
        {item.quantite}
      </div>
      
      <div style={{width: `${columnWidths.price}px`}} className="text-right px-2">
        {parseFloat(item.prix).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DA
      </div>
      
      <div style={{width: `${columnWidths.condition}px`}} className="text-center px-2">
        <Badge variant={item.condition === 'Bon' ? 'default' : item.condition === 'Moyen' ? 'secondary' : 'destructive'}>
          {item.condition}
        </Badge>
      </div>
      
      <div style={{width: `${columnWidths.actions}px`}} className="flex justify-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onItemSelect(item)}
          className="h-7 w-7 p-0"
        >
          <Eye className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onItemEdit(item)}
          className="h-7 w-7 p-0"
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onItemDelete(item)}
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export function VirtualInventoryTable({
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
}: VirtualInventoryTableProps) {
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
  
  const { toast } = useToast();

  const items = data?.items || [];
  const totalItems = data?.total || 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked && items) {
      setSelectedItems(new Set(items.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = useCallback((itemId: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  }, [selectedItems]);

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(field, newOrder);
  };

  const handleExportSelected = () => {
    const selectedItemsData = items.filter(item => selectedItems.has(item.id));
    if (selectedItemsData.length === 0) {
      toast({
        title: "Aucun élément sélectionné",
        description: "Veuillez sélectionner au moins un élément à exporter.",
        variant: "destructive",
      });
      return;
    }
    exportToExcel(selectedItemsData, `inventaire_selection_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({
      title: "Export réussi",
      description: `${selectedItemsData.length} éléments exportés avec succès.`,
    });
  };

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) {
      toast({
        title: "Aucun élément sélectionné",
        description: "Veuillez sélectionner au moins un élément à supprimer.",
        variant: "destructive",
      });
      return;
    }
    onBulkDelete?.(Array.from(selectedItems));
    setSelectedItems(new Set());
  };

  const handleGeneratePDFSelected = async () => {
    const selectedItemsData = items.filter(item => selectedItems.has(item.id));
    if (selectedItemsData.length === 0) {
      toast({
        title: "Aucun élément sélectionné",
        description: "Veuillez sélectionner au moins un élément pour générer le PDF.",
        variant: "destructive",
      });
      return;
    }
    await generateMultipleItemsPDF(selectedItemsData, "FICHE DE BUREAU - SÉLECTION");
    toast({
      title: "PDF généré",
      description: `PDF généré pour ${selectedItemsData.length} éléments sélectionnés.`,
    });
  };

  const listData = useMemo(() => ({
    items,
    selectedItems,
    onSelectItem: handleSelectItem,
    onItemSelect,
    onItemEdit,
    onItemDelete,
    columnWidths
  }), [items, selectedItems, handleSelectItem, onItemSelect, onItemEdit, onItemDelete, columnWidths]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            Inventaire ({totalItems} articles)
            {selectedItems.size > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({selectedItems.size} sélectionnés)
              </span>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {selectedItems.size > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleExportSelected}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter sélection
                </Button>
                <Button variant="outline" size="sm" onClick={handleGeneratePDFSelected}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF sélection
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer ({selectedItems.size})
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Table Header */}
        <div className="flex items-center border-b border-border bg-muted/50 px-4 py-3 font-medium text-sm">
          <div style={{width: `${columnWidths.checkbox}px`}} className="flex justify-center">
            <Checkbox
              checked={selectedItems.size === items.length && items.length > 0}
              onCheckedChange={handleSelectAll}
            />
          </div>
          <div style={{width: `${columnWidths.status}px`}} className="text-center">Statut</div>
          <div style={{width: `${columnWidths.barcode}px`}} className="cursor-pointer hover:bg-muted/50 px-2" onClick={() => handleSort('code_barre')}>
            Code-barres <ArrowUpDown className="ml-1 h-4 w-4 inline" />
          </div>
          <div style={{width: `${columnWidths.inventory}px`}} className="cursor-pointer hover:bg-muted/50 px-2" onClick={() => handleSort('num_inventaire')}>
            N° Inv. <ArrowUpDown className="ml-1 h-4 w-4 inline" />
          </div>
          <div style={{width: `${columnWidths.designation}px`}} className="cursor-pointer hover:bg-muted/50 px-2" onClick={() => handleSort('designation')}>
            Désignation <ArrowUpDown className="ml-1 h-4 w-4 inline" />
          </div>
          <div style={{width: `${columnWidths.description}px`}} className="px-2">Description</div>
          <div style={{width: `${columnWidths.department}px`}} className="px-2">Dept.</div>
          <div style={{width: `${columnWidths.office}px`}} className="text-center px-2">Bureau</div>
          <div style={{width: `${columnWidths.beneficiary}px`}} className="px-2">Bénéficiaire</div>
          <div style={{width: `${columnWidths.quantity}px`}} className="text-center px-2">Qté</div>
          <div style={{width: `${columnWidths.price}px`}} className="text-right px-2">Prix (DA)</div>
          <div style={{width: `${columnWidths.condition}px`}} className="text-center px-2">État</div>
          <div style={{width: `${columnWidths.actions}px`}} className="text-center px-2">Actions</div>
        </div>

        {/* Virtual List */}
        {items.length > 0 ? (
          <List
            height={400}
            width={1200}
            itemCount={items.length}
            itemSize={50}
            itemData={listData}
            overscanCount={5}
          >
            {TableRow}
          </List>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Aucun article trouvé
          </div>
        )}

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} sur {Math.ceil(totalItems / pageSize)}
              </span>
              <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalItems / pageSize)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}