import { SmartInventoryTable } from './smart-inventory-table';
import { ErrorBoundary } from './error-boundary';
import { Card, CardContent } from './ui/card';
import { AlertTriangle } from 'lucide-react';
import type { InventoryItem } from '@shared/schema';

interface EnhancedInventoryTableProps {
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

const TableErrorFallback = () => (
  <Card className="p-8">
    <CardContent className="flex items-center justify-center gap-3 text-muted-foreground">
      <AlertTriangle className="h-5 w-5 text-destructive" />
      <span>Erreur lors du chargement du tableau. Veuillez recharger la page.</span>
    </CardContent>
  </Card>
);

export function EnhancedInventoryTable(props: EnhancedInventoryTableProps) {
  return (
    <ErrorBoundary fallback={<TableErrorFallback />}>
      <SmartInventoryTable {...props} />
    </ErrorBoundary>
  );
}