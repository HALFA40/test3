import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

import { InventoryTable } from "@/components/inventory-table";
import { AdvancedFilters } from "@/components/advanced-filters";
import { ItemDetailsModal } from "@/components/item-details-modal";
import { AddItemModal } from "@/components/add-item-modal";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { ScanHistoryTable, type ScanHistoryItem } from "@/components/scan-history-table";
import { SearchModeTable } from "@/components/search-mode-table";
import { OnboardingTour, useOnboarding } from "@/components/onboarding-tour";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileSpreadsheet, Package, CheckCircle, XCircle, DollarSign, Search, History, Upload, HelpCircle, Smartphone } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link } from "wouter";
import { importFromExcel } from "@/lib/excel-utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { DeletedItemsTable } from "@/components/deleted-items-table";
import type { InventoryItem, SearchFilters, DeletedItem, InsertInventoryItem } from "@shared/schema";

export default function InventoryPage() {
  const { toast } = useToast();
  const { showOnboarding, startOnboarding, closeOnboarding } = useOnboarding();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState<Partial<InsertInventoryItem>>({});
  const [showScanner, setShowScanner] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState("date_ajouter");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState("inventory");
  const [isSearchMode, setIsSearchMode] = useState(false);



  // Fetch inventory data
  const { data: inventoryData, isLoading, refetch } = useQuery({
    queryKey: ["/api/inventory", { filters: searchFilters, page: currentPage, limit: pageSize, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      });
      
      if (Object.keys(searchFilters).length > 0) {
        params.append('filters', JSON.stringify(searchFilters));
      }
      
      const response = await fetch(`/api/inventory?${params}`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return response.json();
    },
  });

  // Fetch inventory stats with improved caching
  const { data: stats } = useQuery({
    queryKey: ["/api/inventory-stats"],
    staleTime: 2 * 60 * 1000, // 2 minutes - stats change when items are added/removed
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
  });

  // Fetch filter options with long-term caching (rarely changes)
  const { data: filterOptions } = useQuery({
    queryKey: ["/api/filter-options"],
    staleTime: 30 * 60 * 1000, // 30 minutes - departments/categories change infrequently
    gcTime: 60 * 60 * 1000, // 1 hour garbage collection
  }) as { data: { departments: string[]; categories: string[]; conditions: string[]; } | undefined };

  // Fetch search results data  
  const { data: searchResultsData } = useQuery({
    queryKey: ['/api/search-results'],
  });

  // Fetch deleted items data
  const { data: deletedItemsData, isLoading: deletedItemsLoading } = useQuery({
    queryKey: ['/api/deleted-items'],
  });

  const handleExportExcel = async () => {
    try {
      const response = await fetch("/api/inventory/export/excel");
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventaire_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export réussi",
        description: "Le fichier Excel a été téléchargé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le fichier Excel.",
        variant: "destructive",
      });
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      toast({
        title: "Import en cours...",
        description: "Traitement du fichier Excel en cours.",
      });

      const data = await importFromExcel(file);
      
      let successCount = 0;
      let errorCount = 0;

      for (const row of data) {
        try {
          // Mapping plus flexible pour supporter différents formats de colonnes
          const itemData = {
            code_barre: String(row['Code-barres'] || row['code_barre'] || row['Code barres'] || row['CODEBARRE'] || '').trim(),
            num_inventaire: String(row['N° Inventaire'] || row['Numéro d\'inventaire'] || row['num_inventaire'] || row['Num Inventaire'] || '').trim(),
            old_num_inventaire: String(row['Ancien N° Inventaire'] || row['old_num_inventaire'] || row['Ancien Num'] || '').trim() || null,
            designation: String(row['Désignation'] || row['designation'] || row['DESIGNATION'] || '').trim(),
            departement: String(row['Département'] || row['departement'] || row['Bureau'] || row['DEPARTEMENT'] || '').trim(),
            num_bureau: String(row['N° Bureau'] || row['num_bureau'] || row['Bureau'] || row['Numero Bureau'] || '').trim(),
            beneficiaire: String(row['Bénéficiaire'] || row['beneficiaire'] || row['BENEFICIAIRE'] || '').trim(),
            quantite: Math.max(1, parseInt(String(row['Quantité'] || row['quantite'] || row['QTE'] || '1')) || 1),
            prix: String(row['Prix (DA)'] || row['Prix'] || row['prix'] || row['PRIX'] || '0').replace(/[^\d.,]/g, '').replace(',', '.') || '0',
            categorie: String(row['Catégorie'] || row['categorie'] || row['CATEGORIE'] || '').trim(),
            num_serie: String(row['N° Série'] || row['Numéro de série'] || row['num_serie'] || row['Serie'] || '').trim() || null,
            description: String(row['Description'] || row['description'] || row['DESC'] || '').trim() || null,
            condition: String(row['Condition'] || row['État'] || row['condition'] || row['CONDITION'] || 'Bon').trim()
          };

          // Validation des champs requis
          if (!itemData.code_barre || !itemData.designation || !itemData.num_inventaire || !itemData.departement || !itemData.num_bureau || !itemData.beneficiaire) {
            console.log('Ligne ignorée - champs requis manquants:', {
              code_barre: itemData.code_barre,
              designation: itemData.designation,
              num_inventaire: itemData.num_inventaire,
              departement: itemData.departement,
              num_bureau: itemData.num_bureau,
              beneficiaire: itemData.beneficiaire
            });
            errorCount++;
            continue;
          }

          // Validation du prix
          const prixValue = parseFloat(itemData.prix);
          if (isNaN(prixValue) || prixValue < 0) {
            itemData.prix = '0';
          }

          const response = await fetch('/api/inventory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData),
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            console.error('Erreur création article:', errorData);
            errorCount++;
          }
        } catch (error) {
          console.error('Erreur traitement ligne:', error);
          errorCount++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory-stats'] });

      if (successCount > 0) {
        toast({
          title: "Import réussi",
          description: `${successCount} article(s) importé(s) avec succès${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}.`,
          variant: errorCount > successCount ? "destructive" : "default"
        });
      } else {
        toast({
          title: "Échec de l'import",
          description: `Aucun article importé. ${errorCount} erreur(s). Vérifiez le format de votre fichier Excel.`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Erreur import Excel:', error);
      toast({
        title: "Erreur d'import",
        description: "Impossible de traiter le fichier Excel. Vérifiez que le fichier n'est pas corrompu et contient les bonnes colonnes.",
        variant: "destructive",
      });
    }

    event.target.value = '';
  };

  const handleBarcodeScanned = async (barcode: string, deps?: string, numbs?: string) => {
    try {
      // Rechercher l'article par code-barres
      const response = await fetch(`/api/inventory/barcode/${barcode}`);
      const data = await response.json();
      
      const now = new Date();
      
      if (response.ok) {
        // Article trouvé - mettre à jour l'historique
        const existingHistoryItem = scanHistory.find(item => item.codeBarre === barcode);
        
        if (existingHistoryItem) {
          // Incrémenter le nombre de scans
          setScanHistory(prev => prev.map(item => 
            item.codeBarre === barcode 
              ? { ...item, nombreScanne: item.nombreScanne + 1, derniereDate: now }
              : item
          ));
        } else {
          // Ajouter un nouvel élément à l'historique
          const newHistoryItem: ScanHistoryItem = {
            id: `${barcode}-${Date.now()}`,
            codeBarre: barcode,
            designation: data.designation,
            disponible: data.quantite > 0,
            nombreScanne: 1,
            dateScanne: now,
            derniereDate: now,
            departement: data.departement,
            bureau: data.num_bureau,
            beneficiaire: data.beneficiaire,
            prix: parseFloat(data.prix),
            deps: deps || '-',
            numbs: numbs || '-'
          };
          setScanHistory(prev => [...prev, newHistoryItem]);
        }
        
        // Save found result to database
        try {
          await fetch('/api/search-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              code_barre: barcode, 
              found: true,
              designation: data.designation 
            })
          });
          
          // Refresh search results data
          queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
        } catch (error) {
          console.error("Error saving search result:", error);
        }

        // Switch to appropriate tab
        if (!isSearchMode) {
          setActiveTab("history");
        }
        
        toast({
          title: "Code scanné",
          description: `${data.designation} - ${data.quantite > 0 ? 'Disponible' : 'Non disponible'}`,
        });
      } else {
        // Article non trouvé - ajouter à l'historique comme non disponible
        const existingHistoryItem = scanHistory.find(item => item.codeBarre === barcode);
        
        if (existingHistoryItem) {
          setScanHistory(prev => prev.map(item => 
            item.codeBarre === barcode 
              ? { ...item, nombreScanne: item.nombreScanne + 1, derniereDate: now }
              : item
          ));
        } else {
          const newHistoryItem: ScanHistoryItem = {
            id: `${barcode}-${Date.now()}`,
            codeBarre: barcode,
            designation: 'Article non trouvé',
            disponible: false,
            nombreScanne: 1,
            dateScanne: now,
            derniereDate: now,
            departement: 'Inconnu',
            bureau: 'Inconnu',
            beneficiaire: 'Inconnu',
            prix: 0,
            deps: deps || '-',
            numbs: numbs || '-'
          };
          setScanHistory(prev => [...prev, newHistoryItem]);
        }

        // Save not found result to database
        try {
          await fetch('/api/search-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code_barre: barcode, found: false })
          });
          
          // Refresh search results data
          queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
          
          if (!isSearchMode) {
            setActiveTab("search");
          }
        } catch (error) {
          console.error("Error saving search result:", error);
        }
        
        toast({
          title: "Code non trouvé",
          description: `Code-barres ${barcode} sauvegardé dans les résultats de recherche.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher l'article.",
        variant: "destructive",
      });
    }
    
    if (!isSearchMode) {
      setShowScanner(false);
    }
  };



  const handleRemoveNotFoundResult = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/search-results/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete search result');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
      toast({
        title: "Résultat supprimé",
        description: "Le résultat de recherche a été supprimé.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le résultat.",
        variant: "destructive",
      });
    },
  });

  const handleClearNotFoundResults = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/search-results', {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to clear search results');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
      toast({
        title: "Résultats effacés",
        description: "Tous les résultats de recherche ont été supprimés.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'effacer les résultats.",
        variant: "destructive",
      });
    },
  });

  const handleClearFoundResults = useMutation({
    mutationFn: async () => {
      const foundResults = (searchResultsData || []).filter((result: any) => result.found);
      const deletePromises = foundResults.map((result: any) => 
        fetch(`/api/search-results/${result.id}`, {
          method: 'DELETE',
        })
      );
      const responses = await Promise.all(deletePromises);
      
      for (const response of responses) {
        if (!response.ok) {
          throw new Error('Failed to delete found results');
        }
      }
      
      return { deletedCount: foundResults.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
      toast({
        title: "Articles trouvés effacés",
        description: `${data.deletedCount} article(s) trouvé(s) supprimé(s).`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'effacer les articles trouvés.",
        variant: "destructive",
      });
    },
  });

  // Handle restore deleted item
  const handleRestoreItem = useMutation({
    mutationFn: async (item: DeletedItem) => {
      const response = await fetch(`/api/deleted-items/${item.id}/restore`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to restore item');
      return response.json();
    },
    onSuccess: (restoredItem) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deleted-items'] });
      toast({
        title: "Article restauré",
        description: `${restoredItem.designation} a été restauré avec succès.`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de restaurer l'article.",
        variant: "destructive",
      });
    },
  });

  // Handle permanent delete
  const handlePermanentDelete = useMutation({
    mutationFn: async (item: DeletedItem) => {
      const response = await fetch(`/api/deleted-items/${item.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to permanently delete item');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deleted-items'] });
      toast({
        title: "Article supprimé définitivement",
        description: "L'article a été supprimé définitivement.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer définitivement l'article.",
        variant: "destructive",
      });
    },
  });

  // Handle bulk delete
  const handleBulkDelete = useMutation({
    mutationFn: async (itemIds: number[]) => {
      const response = await fetch('/api/inventory/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds }),
      });
      if (!response.ok) throw new Error('Failed to bulk delete items');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deleted-items'] });
      toast({
        title: "Articles supprimés",
        description: `${data.deletedCount} article(s) supprimé(s) avec succès.`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les articles sélectionnés.",
        variant: "destructive",
      });
    },
  });

  // Handle bulk restore deleted items
  const handleBulkRestore = useMutation({
    mutationFn: async (items: DeletedItem[]) => {
      const response = await fetch('/api/deleted-items/bulk-restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds: items.map(item => item.id) }),
      });
      if (!response.ok) throw new Error('Failed to bulk restore items');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deleted-items'] });
      toast({
        title: "Articles restaurés",
        description: `${data.restoredCount} article(s) restauré(s) avec succès.`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de restaurer les articles sélectionnés.",
        variant: "destructive",
      });
    },
  });

  // Handle bulk permanent delete
  const handleBulkPermanentDelete = useMutation({
    mutationFn: async (items: DeletedItem[]) => {
      const response = await fetch('/api/deleted-items/bulk-permanent-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds: items.map(item => item.id) }),
      });
      if (!response.ok) throw new Error('Failed to bulk permanent delete items');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/deleted-items'] });
      toast({
        title: "Articles supprimés définitivement",
        description: `${data.deletedCount} article(s) supprimé(s) définitivement.`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer définitivement les articles sélectionnés.",
        variant: "destructive",
      });
    },
  });

  const handleClearScanHistory = () => {
    setScanHistory([]);
    toast({
      title: "Historique vidé",
      description: "Tout l'historique des scans a été supprimé.",
    });
  };

  const handleRemoveScanHistoryItem = (id: string) => {
    setScanHistory(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Élément supprimé",
      description: "L'élément a été retiré de l'historique.",
    });
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Use global search across all fields
      setSearchFilters({
        fullTextSearch: query.trim()
      });
      setCurrentPage(1); // Reset to first page
      setActiveTab("inventory");
    } else {
      // Clear filters when search is empty
      setSearchFilters({});
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value);
  };



  return (
    <div className="min-h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card shadow-sm border-b border-border px-6 py-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Gestion d'Inventaire</h2>
                <p className="text-muted-foreground mt-1">Recherche avancée et scanner de codes-barres</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button onClick={() => setShowAddModal(true)} data-tour="add-button">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Article
                </Button>
                
                <Button variant="outline" onClick={handleExportExcel} data-tour="export-button">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exporter Excel
                </Button>
                
                <div className="relative" data-tour="import-button">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="excel-import-header"
                  />
                  <Button variant="outline" asChild>
                    <label htmlFor="excel-import-header" className="cursor-pointer flex items-center">
                      <Upload className="mr-2 h-4 w-4" />
                      Importer Excel
                    </label>
                  </Button>
                </div>

                <Link href="/mobile-scan">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center lg:hidden"
                    title="Scanner Mobile"
                    data-tour="mobile-button"
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    Scanner Mobile
                  </Button>
                </Link>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={startOnboarding}
                  className="flex items-center"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Tour guidé
                </Button>

                <ThemeToggle />
                
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Dernière synchronisation</p>
                  <p className="text-sm font-medium">Il y a 2 minutes</p>
                </div>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex items-center space-x-4" data-tour="search-bar">
              <div className="flex-1 flex items-center space-x-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Rechercher un article (code-barres, désignation, département...)"
                    className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowScanner(true)}
                  className="flex items-center"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Scanner
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">


          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="inventory" className="flex items-center" data-tour="inventory-tab">
                <Package className="mr-2 h-4 w-4" />
                Inventaire complet
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center" data-tour="search-tab">
                <Search className="mr-2 h-4 w-4" />
                Résultats de recherche ({(searchResultsData as any[])?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center" data-tour="history-tab">
                <History className="mr-2 h-4 w-4" />
                Historique des scans ({scanHistory.length})
              </TabsTrigger>
              <TabsTrigger value="deleted" className="flex items-center" data-tour="deleted-tab">
                <XCircle className="mr-2 h-4 w-4" />
                Corbeille ({(deletedItemsData as any[])?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="space-y-6">
              {/* Advanced Filters */}
              <div data-tour="filters-section">
                <AdvancedFilters
                  filters={searchFilters}
                  onFiltersChange={setSearchFilters}
                  filterOptions={filterOptions as any}
                />
              </div>

              {/* Inventory Table */}
              <InventoryTable
                data={inventoryData}
                isLoading={isLoading}
                onItemSelect={setSelectedItem}
                onItemEdit={(item) => {
                  setEditingItem(item);
                  setShowAddModal(true);
                }}
                onItemDelete={async (item) => {
                  try {
                    const response = await fetch(`/api/inventory/${item.id}`, {
                      method: "DELETE",
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to delete item');
                    }
                    
                    // Invalidate and refetch inventory data
                    queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/inventory-stats"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/deleted-items"] });
                    
                    toast({
                      title: "Article supprimé",
                      description: `${item.designation} a été supprimé avec succès. Vous pouvez le restaurer depuis la corbeille.`,
                    });
                  } catch (error) {
                    console.error("Error deleting item:", error);
                    toast({
                      title: "Erreur",
                      description: "Impossible de supprimer l'article. Veuillez réessayer.",
                      variant: "destructive",
                    });
                  }
                }}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={(field, order) => {
                  setSortBy(field);
                  setSortOrder(order);
                }}
                onExportExcel={handleExportExcel}
                onImportExcel={handleImportExcel}
                onBulkDelete={(itemIds) => handleBulkDelete.mutate(itemIds)}
              />
            </TabsContent>

            <TabsContent value="search" className="space-y-6">
              <SearchModeTable
                searchResults={(searchResultsData as any[]) || []}
                onRemoveItem={(id) => handleRemoveNotFoundResult.mutate(id)}
                onClearAll={() => handleClearNotFoundResults.mutate()}
                onClearFound={() => handleClearFoundResults.mutate()}
                isSearchMode={isSearchMode}
                onToggleSearchMode={() => {
                  setIsSearchMode(!isSearchMode);
                  // Disable camera when search mode is active
                  setShowScanner(false);
                }}
                onManualBarcodeSearch={(barcode, deps, numbs) => handleBarcodeScanned(barcode, deps, numbs)}
                onOpenScanner={() => setShowScanner(true)}
                onImportResults={(results) => {
                  // Process each imported barcode
                  results.forEach(result => {
                    handleBarcodeScanned(result.code_barre);
                  });
                }}
                onEditItem={async (searchResult) => {
                  // For found items, we can get the full inventory item by barcode
                  if (searchResult.found) {
                    try {
                      const response = await fetch(`/api/inventory/barcode/${searchResult.code_barre}`);
                      if (response.ok) {
                        const inventoryItem = await response.json();
                        setEditingItem(inventoryItem);
                        setShowAddModal(true);
                      }
                    } catch (error) {
                      toast({
                        title: "Erreur",
                        description: "Impossible de charger les détails de l'article",
                        variant: "destructive",
                      });
                    }
                  } else {
                    // For not found items, create a new item with the barcode pre-filled
                    setEditingItem(null);
                    setInitialFormValues({ code_barre: searchResult.code_barre });
                    setShowAddModal(true);
                  }
                }}
                filterOptions={filterOptions || { departments: [], categories: [], conditions: [] }}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <ScanHistoryTable
                scanHistory={scanHistory}
                onClearHistory={handleClearScanHistory}
                onRemoveItem={handleRemoveScanHistoryItem}
              />
            </TabsContent>

            <TabsContent value="deleted" className="space-y-6">
              <DeletedItemsTable
                deletedItems={(deletedItemsData as any[]) || []}
                onRestore={(item) => handleRestoreItem.mutate(item)}
                onPermanentDelete={(item) => handlePermanentDelete.mutate(item)}
                onBulkRestore={(items) => handleBulkRestore.mutate(items)}
                onBulkPermanentDelete={(items) => handleBulkPermanentDelete.mutate(items)}
                isLoading={deletedItemsLoading}
              />
            </TabsContent>
          </Tabs>

          {/* Onboarding Tour */}
          <OnboardingTour 
            isOpen={showOnboarding} 
            onClose={closeOnboarding} 
          />

          {/* Stats Cards - Always visible */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Package className="text-blue-600 dark:text-blue-400 text-xl" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">Total Articles</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats ? formatNumber((stats as any).totalItems) : '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="text-green-600 dark:text-green-400 text-xl" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">Disponibles</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats ? formatNumber((stats as any).availableItems) : '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                    <XCircle className="text-red-600 dark:text-red-400 text-xl" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">Non Disponibles</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats ? formatNumber((stats as any).unavailableItems) : '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <DollarSign className="text-yellow-600 dark:text-yellow-400 text-xl" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">Valeur Totale</p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats ? formatCurrency((stats as any).totalValue) : '0 DA'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Modals */}
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={() => {
            refetch();
            setSelectedItem(null);
          }}
          onEdit={(item) => {
            setEditingItem(item);
            setSelectedItem(null);
            setShowAddModal(true);
          }}
        />
      )}

      {showAddModal && (
        <AddItemModal
          open={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
            setInitialFormValues({});
          }}
          onSuccess={() => {
            refetch();
            setShowAddModal(false);
            setEditingItem(null);
            toast({
              title: editingItem ? "Article modifié" : "Article ajouté",
              description: editingItem 
                ? "L'article a été modifié avec succès." 
                : "L'article a été ajouté avec succès à l'inventaire.",
            });
          }}
          filterOptions={filterOptions || { departments: [], categories: [], conditions: [] }}
          editingItem={editingItem}
          initialValues={initialFormValues}
        />
      )}

      {showScanner && (
        <BarcodeScanner
          open={showScanner}
          onClose={() => setShowScanner(false)}
          onBarcodeScanned={handleBarcodeScanned}
        />
      )}
    </div>
  );
}
