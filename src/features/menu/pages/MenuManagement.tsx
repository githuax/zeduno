import { Plus, Edit, Trash2, Search, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { getApiUrl } from '@/config/api';
import { AddMenuItemModal, AddCategoryModal, EditMenuItemModal, EditCategoryModal, CreateRecipeModal } from '@/features/menu/components';
import { useCurrency } from '@/hooks/useCurrency';

interface MenuOverview {
  totalItems: number;
  availableItems: number;
  unavailableItems: number;
  totalCategories: number;
  lowStockItems?: number;
  itemsWithRecipes?: number;
}

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  categoryId?: {
    _id: string;
    name: string;
  };
  isAvailable: boolean;
  preparationTime: number;
  tags: string[];
  dietaryInfo: {
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    isSpicy: boolean;
  };
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  // Inventory integration fields
  inventoryAvailable?: boolean;
  unavailableIngredients?: string[];
  hasRecipe?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  _id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const MenuManagement = () => {
  const [overview, setOverview] = useState<MenuOverview | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('items');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [creatingRecipeFor, setCreatingRecipeFor] = useState<MenuItem | null>(null);
  const [isCreateRecipeModalOpen, setIsCreateRecipeModalOpen] = useState(false);
  const { toast } = useToast();
  const { format: formatPrice } = useCurrency();

  // Fetch menu overview
  const fetchOverview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('menu/inventory-overview'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOverview(data.data);
      } else {
        // Calculate overview from actual data
        const available = menuItems.filter(item => item.isAvailable).length;
        setOverview({
          totalItems: menuItems.length,
          availableItems: available,
          unavailableItems: menuItems.length - available,
          totalCategories: categories.length
        });
      }
    } catch (error) {
      const available = menuItems.filter(item => item.isAvailable).length;
      setOverview({
        totalItems: menuItems.length,
        availableItems: available,
        unavailableItems: menuItems.length - available,
        totalCategories: categories.length
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch menu items
  const fetchMenuItems = async () => {
    setItemsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('menu/items?includeInventory=true'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Menu items response:', data);
        setMenuItems(data.data || data || []);
      } else {
        console.error('Failed to fetch menu items:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    } finally {
      setItemsLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('menu/categories'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Categories response:', data);
        setCategories(data.data || data || []);
      } else {
        console.error('Failed to fetch categories:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('Failed to fetch categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Refresh all data
  const refreshData = () => {
    fetchMenuItems();
    fetchCategories();
    fetchOverview();
  };

  // Handle editing menu item
  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setIsEditItemModalOpen(true);
  };

  // Handle creating recipe for menu item
  const handleCreateRecipe = (item: MenuItem) => {
    setCreatingRecipeFor(item);
    setIsCreateRecipeModalOpen(true);
  };

  // Handle deleting menu item
  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`menu/items/${itemId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `"${itemName}" has been deleted`,
        });
        refreshData();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete menu item",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    }
  };

  // Handle editing category
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsEditCategoryModalOpen(true);
  };

  // Handle deleting category
  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`menu/categories/${categoryId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `"${categoryName}" has been deleted`,
        });
        refreshData();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete category",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [menuItems, categories]);

  // Filter menu items based on search
  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">Manage your restaurant's menu items and categories</p>
        </div>
        <AddMenuItemModal onItemAdded={refreshData} />
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{overview.availableItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unavailable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overview.unavailableItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalCategories}</div>
            </CardContent>
          </Card>
          {overview.lowStockItems !== undefined && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{overview.lowStockItems}</div>
              </CardContent>
            </Card>
          )}
          {overview.itemsWithRecipes !== undefined && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Items with Recipes</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{overview.itemsWithRecipes}</div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Loading menu data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      {!loading && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="items">Menu Items</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Menu Items</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search menu items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <AddMenuItemModal onItemAdded={refreshData} />
                </div>
              </CardHeader>
              <CardContent>
                {itemsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <span className="ml-2">Loading menu items...</span>
                  </div>
                ) : filteredMenuItems.length === 0 ? (
                  <div className="text-center py-8">
                    {menuItems.length === 0 ? (
                      <>
                        <p className="text-muted-foreground">No menu items found.</p>
                        <p className="text-sm text-gray-500 mt-2">Create your first menu item to get started!</p>
                        <AddMenuItemModal onItemAdded={refreshData} />
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground">No menu items match your search.</p>
                        <p className="text-sm text-gray-500 mt-2">Try adjusting your search terms.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredMenuItems.map((item) => (
                      <Card key={item._id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{item.name}</h3>
                              <Badge variant={item.isAvailable ? "default" : "secondary"}>
                                {item.isAvailable ? "Available" : "Unavailable"}
                              </Badge>
                              {/* Inventory status indicators */}
                              {item.hasRecipe ? (
                                item.inventoryAvailable ? (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Stock OK
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-red-600 border-red-600">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Low Stock
                                  </Badge>
                                )
                              ) : (
                                <Badge variant="outline" className="text-gray-500 border-gray-500">
                                  <Package className="h-3 w-3 mr-1" />
                                  No Recipe
                                </Badge>
                              )}
                              <span className="text-lg font-bold text-green-600">{formatPrice(item.price)}</span>
                            </div>
                            {item.description && (
                              <p className="text-gray-600 mb-2">{item.description}</p>
                            )}
                            {/* Show unavailable ingredients if any */}
                            {item.unavailableIngredients && item.unavailableIngredients.length > 0 && (
                              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                                <p className="text-red-700 font-medium mb-1">Missing ingredients:</p>
                                <p className="text-red-600">{item.unavailableIngredients.join(', ')}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {item.categoryId && (
                                <span>Category: {item.categoryId.name}</span>
                              )}
                              <span>Prep time: {item.preparationTime} min</span>
                            </div>
                            {item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2 mt-2">
                              {item.dietaryInfo?.isVegetarian && <Badge variant="outline">Vegetarian</Badge>}
                              {item.dietaryInfo?.isVegan && <Badge variant="outline">Vegan</Badge>}
                              {item.dietaryInfo?.isGlutenFree && <Badge variant="outline">Gluten Free</Badge>}
                              {item.dietaryInfo?.isSpicy && <Badge variant="outline">Spicy</Badge>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!item.hasRecipe && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleCreateRecipe(item)}
                                title="Create recipe"
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                <Package className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditItem(item)}
                              title="Edit menu item"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteItem(item._id, item.name)}
                              title="Delete menu item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Categories</CardTitle>
                <AddCategoryModal onCategoryAdded={refreshData} />
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <span className="ml-2">Loading categories...</span>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No categories found.</p>
                    <p className="text-sm text-gray-500 mt-2">Create your first category to organize menu items!</p>
                    <AddCategoryModal onCategoryAdded={refreshData} triggerClassName="mt-4" />
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {categories.map((category) => (
                      <Card key={category._id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{category.name}</h3>
                              <Badge variant={category.isActive ? "default" : "secondary"}>
                                {category.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            {category.description && (
                              <p className="text-gray-600 mb-2">{category.description}</p>
                            )}
                            <div className="text-sm text-gray-500">
                              Display Order: {category.displayOrder}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                              title="Edit category"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteCategory(category._id, category.name)}
                              title="Delete category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>✅ Menu Management Component: Active</p>
            <p>✅ Frontend Route: Working</p>
            <p>🔄 Backend API: Testing connection...</p>
            <p>🔄 Database: Checking connection...</p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modals */}
      <EditMenuItemModal
        isOpen={isEditItemModalOpen}
        onClose={() => {
          setIsEditItemModalOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        categories={categories}
        onSuccess={refreshData}
      />

      <EditCategoryModal
        isOpen={isEditCategoryModalOpen}
        onClose={() => {
          setIsEditCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        onSuccess={refreshData}
      />

      <CreateRecipeModal
        isOpen={isCreateRecipeModalOpen}
        onClose={() => {
          setIsCreateRecipeModalOpen(false);
          setCreatingRecipeFor(null);
        }}
        menuItem={creatingRecipeFor!}
        onRecipeCreated={refreshData}
      />
    </div>
  );
};

export default MenuManagement;