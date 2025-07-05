import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronUp, ChevronDown, Filter, Search, RotateCcw, X } from "lucide-react";
import type { SearchFilters } from "@shared/schema";

interface AdvancedFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  filterOptions?: {
    departments: string[];
    categories: string[];
    conditions: string[];
  };
}

export function AdvancedFilters({ filters, onFiltersChange, filterOptions }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === "__all__" ? undefined : value,
    });
  };

  const updateBarcodeFilter = (operator: 'equals' | 'contains' | 'startsWith', value: string) => {
    onFiltersChange({
      ...filters,
      code_barre: value ? { operator, value } : undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const removeFilter = (filterKey: string) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey as keyof SearchFilters];
    onFiltersChange(newFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.keys(filters).filter(key => (filters as any)[key] !== undefined).length;
  };

  const getFilterDisplayValue = (key: string, value: any) => {
    switch (key) {
      case 'code_barre':
        return `Code: ${value.operator === 'equals' ? '=' : value.operator === 'contains' ? '∋' : '^'} "${value.value}"`;
      case 'departement':
        return `Dépt: ${value}`;
      case 'categorie':
        return `Cat: ${value}`;
      case 'condition':
        return `Cond: ${value}`;
      case 'designation':
        return `Désig: "${value}"`;
      case 'beneficiaire':
        return `Bénéf: "${value}"`;
      case 'num_bureau':
        return `Bureau: "${value}"`;
      case 'num_inventaire':
        return `N°Inv: "${value}"`;
      case 'num_serie':
        return `N°Série: "${value}"`;
      case 'description':
        return `Desc: "${value}"`;
      case 'available_only':
        return value ? "Disponibles uniquement" : "Tous les articles";
      default:
        return `${key}: ${value}`;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5 text-primary" />
            Filtres avancés
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getActiveFiltersCount() > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Tout effacer
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Active filters display */}
        {getActiveFiltersCount() > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(filters).map(([key, value]) => {
              if (value === undefined) return null;
              return (
                <Badge key={key} variant="outline" className="flex items-center gap-1 px-2 py-1">
                  <span className="text-xs">{getFilterDisplayValue(key, value)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground ml-1"
                    onClick={() => removeFilter(key)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        )}
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6 pt-0">
          {/* Text-based filters */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-semibold text-foreground">Recherche textuelle</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Barcode filter with operator */}
              <div>
                <Label className="text-sm font-medium">Code-barres</Label>
                <div className="flex mt-1">
                  <Select
                    value={filters.code_barre?.operator || 'contains'}
                    onValueChange={(operator: 'equals' | 'contains' | 'startsWith') =>
                      updateBarcodeFilter(operator, filters.code_barre?.value || '')
                    }
                  >
                    <SelectTrigger className="w-20 rounded-r-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">=</SelectItem>
                      <SelectItem value="contains">∋</SelectItem>
                      <SelectItem value="startsWith">^</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    className="flex-1 rounded-l-none border-l-0"
                    placeholder="Code-barres"
                    value={filters.code_barre?.value || ''}
                    onChange={(e) =>
                      updateBarcodeFilter(filters.code_barre?.operator || 'contains', e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Designation search */}
              <div>
                <Label className="text-sm font-medium">Désignation</Label>
                <Input
                  className="mt-1"
                  placeholder="Rechercher dans la désignation"
                  value={filters.designation || ''}
                  onChange={(e) => updateFilter('designation', e.target.value)}
                />
              </div>

              {/* Beneficiary search */}
              <div>
                <Label className="text-sm font-medium">Bénéficiaire</Label>
                <Input
                  className="mt-1"
                  placeholder="Nom du bénéficiaire"
                  value={filters.beneficiaire || ''}
                  onChange={(e) => updateFilter('beneficiaire', e.target.value)}
                />
              </div>

              {/* Office number search */}
              <div>
                <Label className="text-sm font-medium">Numéro Bureau</Label>
                <Input
                  className="mt-1"
                  placeholder="Numéro de bureau"
                  value={filters.num_bureau || ''}
                  onChange={(e) => updateFilter('num_bureau', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Category-based filters */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-semibold text-foreground">Filtres par catégorie</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Department filter */}
              <div>
                <Label className="text-sm font-medium">Département</Label>
                <Select
                  value={filters.departement || '__all__'}
                  onValueChange={(value) => updateFilter('departement', value || undefined)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Tous les départements" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tous les départements</SelectItem>
                    {filterOptions?.departments.filter(dept => dept && dept.trim() !== '').map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category filter */}
              <div>
                <Label className="text-sm font-medium">Catégorie</Label>
                <Select
                  value={filters.categorie || '__all__'}
                  onValueChange={(value) => updateFilter('categorie', value || undefined)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Toutes catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Toutes catégories</SelectItem>
                    {filterOptions?.categories.filter(cat => cat && cat.trim() !== '').map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Condition filter */}
              <div>
                <Label className="text-sm font-medium">Condition</Label>
                <Select
                  value={filters.condition || '__all__'}
                  onValueChange={(value) => updateFilter('condition', value || undefined)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Toutes conditions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Toutes conditions</SelectItem>
                    {filterOptions?.conditions.filter(cond => cond && cond.trim() !== '').map((cond) => (
                      <SelectItem key={cond} value={cond}>
                        {cond}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Availability filter */}
              <div>
                <Label className="text-sm font-medium">Disponibilité</Label>
                <Select
                  value={filters.available_only === true ? 'available' : filters.available_only === false ? 'unavailable' : '__all__'}
                  onValueChange={(value) => {
                    if (value === 'available') {
                      updateFilter('available_only', true);
                    } else if (value === 'unavailable') {
                      updateFilter('available_only', false);
                    } else {
                      updateFilter('available_only', undefined);
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Tous les articles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tous les articles</SelectItem>
                    <SelectItem value="available">Disponibles uniquement</SelectItem>
                    <SelectItem value="unavailable">Non disponibles uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>




        </CardContent>
      )}
    </Card>
  );
}