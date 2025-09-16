import { Edit, Trash2, Eye, EyeOff, Clock, DollarSign } from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useCurrency } from '@/hooks/useCurrency';

import EditMenuItemForm from './EditMenuItemForm';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  category: {
    _id: string;
    name: string;
  };
  imageUrl?: string;
  isActive: boolean;
  isAvailable: boolean;
  preparationTime?: number;
  tags?: string[];
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spiceLevel?: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  _id: string;
  name: string;
  description?: string;
}

interface MenuItemListProps {
  items: MenuItem[];
  loading: boolean;
  onToggleAvailability: (itemId: string, isAvailable: boolean) => void;
  onDeleteItem: (itemId: string) => void;
  categories: Category[];
  onItemUpdated: () => void;
}

const MenuItemList: React.FC<MenuItemListProps> = ({
  items,
  loading,
  onToggleAvailability,
  onDeleteItem,
  categories,
  onItemUpdated
}) => {
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { format: formatPrice } = useCurrency();

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingItem(null);
    onItemUpdated();
  };


  const getDietaryBadges = (item: MenuItem) => {
    const badges = [];
    if (item.isVegan) badges.push(<Badge key="vegan" variant="secondary" className="bg-green-100 text-green-800">Vegan</Badge>);
    else if (item.isVegetarian) badges.push(<Badge key="vegetarian" variant="secondary" className="bg-green-100 text-green-800">Vegetarian</Badge>);
    if (item.isGlutenFree) badges.push(<Badge key="gluten-free" variant="secondary" className="bg-blue-100 text-blue-800">Gluten Free</Badge>);
    if (item.spiceLevel) badges.push(<Badge key="spice" variant="outline">{item.spiceLevel.charAt(0).toUpperCase() + item.spiceLevel.slice(1)}</Badge>);
    return badges;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading menu items...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No menu items found. Create your first menu item to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item._id} className="relative overflow-hidden">
            {item.imageUrl && (
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {item.category.name}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-1">
                  <Switch
                    checked={item.isAvailable}
                    onCheckedChange={(checked) => onToggleAvailability(item._id, checked)}
                    size="sm"
                  />
                  {item.isAvailable ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-lg">{formatPrice(item.price)}</span>
                  </div>
                  {item.preparationTime && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-muted-foreground">{item.preparationTime}m</span>
                    </div>
                  )}
                </div>
                <Badge variant={item.isAvailable ? "default" : "secondary"}>
                  {item.isAvailable ? "Available" : "Unavailable"}
                </Badge>
              </div>

              {/* Dietary badges */}
              <div className="flex flex-wrap gap-1">
                {getDietaryBadges(item)}
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{item.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditItem(item)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteItem(item._id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Created {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <EditMenuItemForm
              item={editingItem}
              categories={categories}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuItemList;