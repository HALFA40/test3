import { useState } from "react";
import { InventoryTable } from "./inventory-table";
import { VirtualInventoryTable } from "./virtual-inventory-table";
import { Button } from "@/components/ui/button";
import { Zap, Table } from "lucide-react";
import type { InventoryItem } from "@shared/schema";

interface SmartInventoryTableProps {
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

export function SmartInventoryTable(props: SmartInventoryTableProps) {
  const [forceVirtual, setForceVirtual] = useState(false);
  const totalItems = props.data?.total || 0;
  
  // Automatically use virtual scrolling for large datasets (>500 items) or when forced
  const useVirtualScrolling = forceVirtual || totalItems > 500;

  const toggleVirtualMode = () => {
    setForceVirtual(!forceVirtual);
  };

  if (useVirtualScrolling) {
    return (
      <div>
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            Mode haute performance activé ({totalItems.toLocaleString()} articles)
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleVirtualMode}
            className="gap-2"
          >
            <Table className="h-4 w-4" />
            Mode normal
          </Button>
        </div>
        <VirtualInventoryTable {...props} />
      </div>
    );
  }

  return (
    <div>
      {totalItems > 200 && (
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Dataset important détecté ({totalItems.toLocaleString()} articles)
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleVirtualMode}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            Mode haute performance
          </Button>
        </div>
      )}
      <InventoryTable {...props} />
    </div>
  );
}