import React from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileQuickScan } from '@/components/mobile-quick-scan';
import { ErrorBoundary } from '@/components/error-boundary';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { InventoryItem, InsertSearchResult } from '@shared/schema';

export default function MobileScanPage() {
  const queryClient = useQueryClient();

  // Add search result for items not found
  const addSearchResultMutation = useMutation({
    mutationFn: async (searchResult: InsertSearchResult) => {
      const response = await fetch('/api/search-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchResult),
      });
      if (!response.ok) throw new Error('Failed to add search result');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
    }
  });

  const handleItemFound = (item: InventoryItem) => {
    // Add to search results with found status
    addSearchResultMutation.mutate({
      code_barre: item.code_barre,
      designation: item.designation,
      found: true,
      scan_count: 1
    });
  };

  const handleItemNotFound = (barcode: string) => {
    // Add to search results with not found status
    addSearchResultMutation.mutate({
      code_barre: barcode,
      designation: null,
      found: false,
      scan_count: 1
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            <h1 className="font-semibold">Scanner Mobile</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-md mx-auto px-4 py-4">
        <ErrorBoundary>
          <MobileQuickScan
            onItemFound={handleItemFound}
            onItemNotFound={handleItemNotFound}
          />
        </ErrorBoundary>
      </div>

      {/* Mobile Navigation Spacer */}
      <div className="h-20" />
    </div>
  );
}