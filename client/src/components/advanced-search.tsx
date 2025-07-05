import { useState } from "react";
import { Search, Filter, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AdvancedFilters } from "@/components/advanced-filters";
import type { SearchFilters } from "@shared/schema";

interface AdvancedSearchProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  filterOptions?: {
    departments: string[];
    categories: string[];
    conditions: string[];
  };
  onSearch?: () => void;
  isLoading?: boolean;
}

export function AdvancedSearch({
  filters,
  onFiltersChange,
  filterOptions,
  onSearch,
  isLoading = false
}: AdvancedSearchProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [fullTextQuery, setFullTextQuery] = useState(filters.fullTextSearch || "");

  const handleFullTextSearch = () => {
    onFiltersChange({
      ...filters,
      fullTextSearch: fullTextQuery.trim() || undefined,
      query: undefined // Clear basic query when using full-text search
    });
    onSearch?.();
  };

  const handleBasicSearch = (query: string) => {
    onFiltersChange({
      ...filters,
      query: query.trim() || undefined,
      fullTextSearch: undefined // Clear full-text search when using basic search
    });
  };

  const clearAllFilters = () => {
    setFullTextQuery("");
    onFiltersChange({});
  };

  const getActiveFiltersCount = () => {
    const activeFilters = Object.entries(filters).filter(([key, value]) => {
      if (key === 'query' || key === 'fullTextSearch') return false;
      return value !== undefined && value !== null && value !== '';
    });
    return activeFilters.length;
  };

  const getActiveFilterBadges = () => {
    const badges = [];
    
    if (filters.department) badges.push({ label: "Département", value: filters.department });
    if (filters.category) badges.push({ label: "Catégorie", value: filters.category });
    if (filters.condition) badges.push({ label: "État", value: filters.condition });
    if (filters.beneficiaire) badges.push({ label: "Bénéficiaire", value: filters.beneficiaire });
    if (filters.bureau) badges.push({ label: "Bureau", value: filters.bureau });
    if (filters.minPrice || filters.maxPrice) {
      const priceRange = `${filters.minPrice || 0}€ - ${filters.maxPrice || '∞'}€`;
      badges.push({ label: "Prix", value: priceRange });
    }
    if (filters.dateFrom || filters.dateTo) {
      const dateRange = `${filters.dateFrom || 'début'} - ${filters.dateTo || 'fin'}`;
      badges.push({ label: "Date", value: dateRange });
    }

    return badges;
  };

  const activeFiltersCount = getActiveFiltersCount();
  const activeFilterBadges = getActiveFilterBadges();

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Full-text search */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Recherche intelligente</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Recherche dans tous les champs... (ex: 'ordinateur portable condition bon')"
                value={fullTextQuery}
                onChange={(e) => setFullTextQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleFullTextSearch();
                  }
                }}
                className="flex-1"
              />
              <Button 
                onClick={handleFullTextSearch}
                disabled={isLoading}
                size="sm"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Recherche avancée dans tous les champs avec correspondance intelligente
            </p>
          </div>

          <Separator />

          {/* Basic search */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="text-sm font-medium">Recherche classique</span>
            </div>
            <Input
              placeholder="Recherche par désignation..."
              value={filters.query || ""}
              onChange={(e) => handleBasicSearch(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Advanced filters toggle */}
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filtres avancés</span>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <AdvancedFilters
                filters={filters}
                onFiltersChange={onFiltersChange}
                filterOptions={filterOptions}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Active filters display */}
          {activeFilterBadges.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Filtres actifs</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-auto p-1"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Effacer tous les filtres</span>
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilterBadges.map((badge, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <span className="font-medium">{badge.label}:</span>
                    <span className="ml-1">{badge.value}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}