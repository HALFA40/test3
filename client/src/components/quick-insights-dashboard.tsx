import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  DollarSign,
  BarChart3,
  Building,
  Users,
  Calendar
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { InventoryItem } from "@shared/schema";

interface InventoryStats {
  totalItems: number;
  availableItems: number;
  unavailableItems: number;
  totalValue: number;
}

interface QuickInsightsDashboardProps {
  inventoryData?: { items: InventoryItem[]; total: number };
  inventoryStats?: InventoryStats;
  isLoading?: boolean;
}

export function QuickInsightsDashboard({ 
  inventoryData, 
  inventoryStats, 
  isLoading 
}: QuickInsightsDashboardProps) {
  
  // Calculate advanced metrics from inventory data
  const calculateAdvancedMetrics = () => {
    if (!inventoryData?.items || inventoryData.items.length === 0) {
      return {
        departmentStats: [],
        conditionStats: [],
        categoryStats: [],
        recentAdditions: 0,
        averagePrice: 0,
        topDepartments: [],
        lowStockItems: 0
      };
    }

    const items = inventoryData.items;
    
    // Department statistics
    const departmentMap = new Map<string, { count: number; value: number; available: number }>();
    items.forEach(item => {
      const dept = item.departement || 'Non défini';
      const current = departmentMap.get(dept) || { count: 0, value: 0, available: 0 };
      departmentMap.set(dept, {
        count: current.count + 1,
        value: current.value + parseFloat(item.prix || '0'),
        available: current.available + (item.quantite > 0 ? 1 : 0)
      });
    });

    // Condition statistics
    const conditionMap = new Map<string, number>();
    items.forEach(item => {
      const condition = item.etat || 'Non défini';
      conditionMap.set(condition, (conditionMap.get(condition) || 0) + 1);
    });

    // Category statistics
    const categoryMap = new Map<string, number>();
    items.forEach(item => {
      const category = item.categorie || 'Non défini';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    // Recent additions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAdditions = items.filter(item => 
      item.date_ajouter && new Date(item.date_ajouter) > thirtyDaysAgo
    ).length;

    // Average price
    const totalPrice = items.reduce((sum, item) => sum + parseFloat(item.prix || '0'), 0);
    const averagePrice = items.length > 0 ? totalPrice / items.length : 0;

    // Low stock items (quantity <= 1)
    const lowStockItems = items.filter(item => item.quantite <= 1).length;

    return {
      departmentStats: Array.from(departmentMap.entries()).map(([name, stats]) => ({
        name,
        ...stats,
        availabilityRate: stats.count > 0 ? (stats.available / stats.count) * 100 : 0
      })),
      conditionStats: Array.from(conditionMap.entries()).map(([name, count]) => ({ name, count })),
      categoryStats: Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count })),
      recentAdditions,
      averagePrice,
      topDepartments: Array.from(departmentMap.entries())
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 3)
        .map(([name, stats]) => ({ name, count: stats.count })),
      lowStockItems
    };
  };

  const metrics = calculateAdvancedMetrics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const availabilityRate = inventoryStats?.totalItems 
    ? (inventoryStats.availableItems / inventoryStats.totalItems) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total des Articles
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryStats?.totalItems || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{metrics.recentAdditions} ce mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disponibilité
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(availabilityRate)}
            </div>
            <Progress value={availabilityRate} className="mt-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {inventoryStats?.availableItems || 0} sur {inventoryStats?.totalItems || 0} articles
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valeur Totale
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(inventoryStats?.totalValue || 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Prix moyen: {formatCurrency(metrics.averagePrice)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertes Stock
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {metrics.lowStockItems}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Articles en stock faible
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Distribution par Département
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.departmentStats.slice(0, 5).map((dept, index) => (
              <div key={dept.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {dept.name}
                  </Badge>
                  <span className="text-sm font-medium">{dept.count} articles</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-muted-foreground">
                    {formatPercentage(dept.availabilityRate)}
                  </div>
                  {dept.availabilityRate >= 80 ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : dept.availabilityRate >= 50 ? (
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Condition Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              État des Articles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.conditionStats.map((condition, index) => {
              const percentage = inventoryStats?.totalItems 
                ? (condition.count / inventoryStats.totalItems) * 100 
                : 0;
              
              return (
                <div key={condition.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{condition.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {condition.count} ({formatPercentage(percentage)})
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Répartition par Catégorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {metrics.categoryStats.slice(0, 12).map((category) => (
              <div key={category.name} className="text-center">
                <div className="text-2xl font-bold text-primary">{category.count}</div>
                <div className="text-xs text-muted-foreground truncate" title={category.name}>
                  {category.name}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Résumé des Activités
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.recentAdditions}</div>
              <div className="text-sm text-muted-foreground">Ajouts récents (30j)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{inventoryStats?.availableItems || 0}</div>
              <div className="text-sm text-muted-foreground">Articles disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{metrics.lowStockItems}</div>
              <div className="text-sm text-muted-foreground">Alertes stock</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}