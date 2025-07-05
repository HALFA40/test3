import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Search, Calendar, AlertCircle, Edit } from "lucide-react";
import type { SearchResult } from "@shared/schema";

interface NotFoundResultsTableProps {
  searchResults: SearchResult[];
  onRemoveItem: (id: number) => void;
  onClearAll: () => void;
  onEditItem?: (item: SearchResult) => void;
}

export function NotFoundResultsTable({ searchResults, onRemoveItem, onClearAll, onEditItem }: NotFoundResultsTableProps) {
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

  // Filter to show only not found results
  const notFoundResults = searchResults.filter(result => !result.found);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center">
          <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
          Codes-barres non trouvés ({notFoundResults.length})
        </CardTitle>
        {notFoundResults.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearAll}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Vider la liste
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notFoundResults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Aucun code-barres non trouvé</p>
            <p className="text-sm">Les codes-barres scannés qui ne correspondent à aucun article apparaîtront ici</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code-barres</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date de recherche</TableHead>
                  <TableHead>Heure</TableHead>
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
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatDate(result.date_recherche)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTime(result.date_recherche)}
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
        )}
      </CardContent>
    </Card>
  );
}