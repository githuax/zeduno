import React, { memo, useMemo, useCallback } from 'react';
import { List } from 'react-window';
import { Edit, Trash2 } from 'lucide-react';

import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useVirtualizationAccessibility } from '@/hooks/useVirtualizationAccessibility';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/useCurrency';

interface Ingredient {
  _id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel?: number;
  reorderPoint: number;
  reorderQuantity: number;
  cost: number;
  category: string;
  expiryDate?: string;
  location?: string;
  isPerishable: boolean;
  lastRestockedDate?: string;
  lastUsedDate?: string;
  // Optional beverage metadata
  trackBy?: 'unit' | 'volume';
  volumePerUnitMl?: number;
  defaultPourSizeMl?: number;
  subCategory?: 'beer' | 'wine' | 'spirits' | string;
}

interface VirtualizedInventoryTableProps {
  ingredients: Ingredient[];
  onIngredientSelect: (ingredient: Ingredient) => void;
  containerHeight?: number;
}

interface StockStatus {
  status: string;
  color: string;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    ingredients: Ingredient[];
    onIngredientSelect: (ingredient: Ingredient) => void;
    formatPrice: (amount: number) => string;
    getStockStatus: (ingredient: Ingredient) => StockStatus;
    categoryColors: Record<string, string>;
  };
}

const InventoryRow = memo(({ index, style, data }: RowProps) => {
  const { 
    ingredients, 
    onIngredientSelect, 
    formatPrice, 
    getStockStatus, 
    categoryColors 
  } = data;

  if (index === 0) {
    // Header row
    return (
      <div 
        style={style} 
        className="grid grid-cols-9 gap-4 items-center p-4 border-b bg-gray-50 font-medium text-sm"
      >
        <div className="w-[200px]">Name</div>
        <div>Category</div>
        <div>Current Stock</div>
        <div>Min/Reorder/Max</div>
        <div>Unit Cost</div>
        <div>Total Value</div>
        <div>Location</div>
        <div>Status</div>
        <div className="text-right">Actions</div>
      </div>
    );
  }

  const ingredient = ingredients[index - 1];
  if (!ingredient) return <div style={style} />;

  const stockStatus = getStockStatus(ingredient);

  return (
    <div 
      style={style} 
      className="grid grid-cols-9 gap-4 items-center p-4 border-b hover:bg-gray-50"
    >
      <div className="w-[200px]">
        <div>
          <p className="font-medium">{ingredient.name}</p>
          {ingredient.isPerishable && (
            <p className="text-xs text-muted-foreground">Perishable</p>
          )}
        </div>
      </div>
      
      <div>
        <Badge className={`${categoryColors[ingredient.category]} border-0`}>
          {ingredient.category}
        </Badge>
      </div>
      
      <div className="font-medium">
        {ingredient.currentStock} {ingredient.unit}
        {ingredient.trackBy === 'volume' && ingredient.volumePerUnitMl && ingredient.defaultPourSizeMl && ingredient.defaultPourSizeMl > 0 && (
          <div className="text-xs text-muted-foreground">
            ≈ {Math.floor((ingredient.currentStock * ingredient.volumePerUnitMl) / ingredient.defaultPourSizeMl)} pours
          </div>
        )}
      </div>
      
      <div className="text-sm">
        <span className="text-muted-foreground">Min:</span> {ingredient.minStockLevel} / 
        <span className="text-muted-foreground"> Reorder:</span> {ingredient.reorderPoint} / 
        <span className="text-muted-foreground"> Max:</span> {ingredient.maxStockLevel || 'N/A'}
      </div>
      
      <div>{formatPrice(ingredient.cost)}/{ingredient.unit}</div>
      
      <div className="font-medium">
        {formatPrice(ingredient.cost * ingredient.currentStock)}
      </div>
      
      <div>{ingredient.location || 'N/A'}</div>
      
      <div>
        <Badge variant={stockStatus.color as any}>
          {stockStatus.status}
        </Badge>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onIngredientSelect(ingredient)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

InventoryRow.displayName = 'InventoryRow';

// Custom comparison function for React.memo
const areIngredientsEqual = (
  prevProps: VirtualizedInventoryTableProps, 
  nextProps: VirtualizedInventoryTableProps
) => {
  if (prevProps.ingredients.length !== nextProps.ingredients.length) return false;
  if (prevProps.containerHeight !== nextProps.containerHeight) return false;
  
  return prevProps.ingredients.every((prevIngredient, index) => {
    const nextIngredient = nextProps.ingredients[index];
    return (
      prevIngredient._id === nextIngredient._id &&
      prevIngredient.currentStock === nextIngredient.currentStock &&
      prevIngredient.cost === nextIngredient.cost &&
      prevIngredient.name === nextIngredient.name &&
      prevIngredient.category === nextIngredient.category
    );
  });
};

function VirtualizedInventoryTableComponent({
  ingredients,
  onIngredientSelect,
  containerHeight = 600,
}: VirtualizedInventoryTableProps) {
  const { format: formatPrice } = useCurrency();

  // Performance monitoring
  const { metrics } = usePerformanceMonitor({
    componentName: 'VirtualizedInventoryTable',
    enabled: process.env.NODE_ENV === 'development',
  });

  // Accessibility support
  const {
    containerAriaProps,
    AnnouncementArea,
  } = useVirtualizationAccessibility({
    totalItems: ingredients.length,
    visibleRange: { start: 0, end: Math.min(7, ingredients.length - 1) }, // Approximate visible range
    itemHeight: 80,
    containerHeight,
  });

  // Memoized stock status calculation
  const getStockStatus = useCallback((ingredient: Ingredient): StockStatus => {
    const percentage = ingredient.maxStockLevel ? (ingredient.currentStock / ingredient.maxStockLevel) * 100 : 0;
    if (ingredient.currentStock <= ingredient.minStockLevel) {
      return { status: 'Critical', color: 'destructive' };
    } else if (ingredient.currentStock <= ingredient.reorderPoint) {
      return { status: 'Low', color: 'warning' };
    } else if (percentage > 90) {
      return { status: 'Overstocked', color: 'secondary' };
    }
    return { status: 'Optimal', color: 'success' };
  }, []);

  // Memoized category colors
  const categoryColors: Record<string, string> = useMemo(() => ({
    vegetables: 'bg-green-100 text-green-800',
    fruits: 'bg-orange-100 text-orange-800',
    meat: 'bg-red-100 text-red-800',
    seafood: 'bg-blue-100 text-blue-800',
    dairy: 'bg-yellow-100 text-yellow-800',
    grains: 'bg-amber-100 text-amber-800',
    spices: 'bg-purple-100 text-purple-800',
    beverages: 'bg-cyan-100 text-cyan-800',
    alcohol: 'bg-rose-100 text-rose-800',
    condiments: 'bg-pink-100 text-pink-800',
    other: 'bg-gray-100 text-gray-800'
  }), []);

  // Calculate row height dynamically
  const getItemSize = useCallback((index: number) => {
    if (index === 0) return 56; // Header row height
    return 80; // Data row height
  }, []);

  // Memoized list data
  const listData = useMemo(() => ({
    ingredients,
    onIngredientSelect,
    formatPrice,
    getStockStatus,
    categoryColors,
  }), [ingredients, onIngredientSelect, formatPrice, getStockStatus, categoryColors]);

  // For small datasets (< 100 ingredients), use regular table for better UX
  if (ingredients.length < 100) {
    return (
      <div className="rounded-md border">
        <div className="grid grid-cols-9 gap-4 items-center p-4 border-b bg-gray-50 font-medium text-sm">
          <div className="w-[200px]">Name</div>
          <div>Category</div>
          <div>Current Stock</div>
          <div>Min/Reorder/Max</div>
          <div>Unit Cost</div>
          <div>Total Value</div>
          <div>Location</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>
        
        {ingredients.map((ingredient) => {
          const stockStatus = getStockStatus(ingredient);
          return (
            <div
              key={ingredient._id}
              className="grid grid-cols-9 gap-4 items-center p-4 border-b hover:bg-gray-50"
            >
              <div className="w-[200px]">
                <div>
                  <p className="font-medium">{ingredient.name}</p>
                  {ingredient.isPerishable && (
                    <p className="text-xs text-muted-foreground">Perishable</p>
                  )}
                </div>
              </div>
              <div>
                <Badge className={`${categoryColors[ingredient.category]} border-0`}>
                  {ingredient.category}
                </Badge>
              </div>
              <div className="font-medium">
                {ingredient.currentStock} {ingredient.unit}
                {ingredient.trackBy === 'volume' && ingredient.volumePerUnitMl && ingredient.defaultPourSizeMl && ingredient.defaultPourSizeMl > 0 && (
                  <div className="text-xs text-muted-foreground">
                    ≈ {Math.floor((ingredient.currentStock * ingredient.volumePerUnitMl) / ingredient.defaultPourSizeMl)} pours
                  </div>
                )}
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Min:</span> {ingredient.minStockLevel} / 
                <span className="text-muted-foreground"> Reorder:</span> {ingredient.reorderPoint} / 
                <span className="text-muted-foreground"> Max:</span> {ingredient.maxStockLevel || 'N/A'}
              </div>
              <div>{formatPrice(ingredient.cost)}/{ingredient.unit}</div>
              <div className="font-medium">
                {formatPrice(ingredient.cost * ingredient.currentStock)}
              </div>
              <div>{ingredient.location || 'N/A'}</div>
              <div>
                <Badge variant={stockStatus.color as any}>
                  {stockStatus.status}
                </Badge>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onIngredientSelect(ingredient)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // For large datasets, use virtualization
  return (
    <>
      <AnnouncementArea />
      <div className="rounded-md border" {...containerAriaProps}>
        <div className="mb-2 flex justify-between items-center text-sm text-muted-foreground px-2">
          <span>Showing {ingredients.length} ingredients (virtualized for performance)</span>
          {metrics && process.env.NODE_ENV === 'development' && (
            <div className="flex gap-4 text-xs bg-gray-100 px-2 py-1 rounded">
              <span>Renders: {metrics.rerenderCount}</span>
              <span>Last: {metrics.renderTime.toFixed(1)}ms</span>
              {metrics.memoryUsage && (
                <span>Memory: {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
              )}
            </div>
          )}
        </div>
        
        <List
          height={containerHeight}
          itemCount={ingredients.length + 1} // +1 for header
          itemSize={getItemSize}
          itemData={listData}
          overscanCount={5}
          className="border rounded-md"
        >
          {InventoryRow}
        </List>
      </div>
    </>
  );
}

// Memoized export with custom comparison
export const VirtualizedInventoryTable = memo(VirtualizedInventoryTableComponent, areIngredientsEqual);
