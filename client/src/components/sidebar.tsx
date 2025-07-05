import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, QrCode, Warehouse, BarChart3, FileSpreadsheet, FileText, Layers } from "lucide-react";
import { useDebounce } from "use-debounce";

interface SidebarProps {
  onOpenScanner: () => void;
  onSearch: (query: string) => void;
  onBarcodeSearch: (barcode: string, deps?: string, numbs?: string) => void;
}

export function Sidebar({ onOpenScanner, onSearch, onBarcodeSearch }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // Effect to trigger search when debounced value changes
  useEffect(() => {
    onSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const navItems = [
    { icon: BarChart3, label: "Tableau de bord", active: true },
    { icon: Layers, label: "Inventaire", active: false },
    { icon: Search, label: "Recherche avancée", active: false },
    { icon: FileSpreadsheet, label: "Import/Export", active: false },
    { icon: FileText, label: "Fiches bureau", active: false },
    { icon: BarChart3, label: "Rapports", active: false },
  ];

  return (
    <div className="w-64 bg-card shadow-lg border-r border-border">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary flex items-center">
          <Warehouse className="mr-2 h-5 w-5" />
          Inventaire Pro
        </h1>
      </div>
      
      <nav className="mt-6">
        <div className="px-6 mb-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-12"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1 p-1"
              onClick={onOpenScanner}
              title="Scanner code-barres"
            >
              <QrCode className="h-4 w-4 text-primary" />
            </Button>
          </div>
        </div>

        <ul className="space-y-2 px-3">
          {navItems.map((item, index) => (
            <li key={index}>
              <a
                href="#"
                className={`flex items-center px-3 py-3 rounded-lg font-medium transition-colors ${
                  item.active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
