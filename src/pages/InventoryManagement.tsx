import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  Download,
  Upload,
  ShoppingCart,
  Clock,
  DollarSign,
  BarChart3,
  PackageSearch,
  TrendingDown,
  ChefHat,
  Users,
  FileText,
  Eye
} from 'lucide-react';
import { getApiUrl } from '@/config/api';
import { toast } from 'sonner';
import CreateRecipeDialog from '@/components/inventory/CreateRecipeDialog';
import RecipeDetailsDialog from '@/components/inventory/RecipeDetailsDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
}

interface Recipe {
  _id: string;
  menuItemId: any;
  ingredients: any[];
  preparationTime: number;
  cookingTime: number;
  servingSize: number;
  yield: number;
  estimatedCost?: number;
  ingredientsAvailable?: boolean;
}

interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  categories: string[];
  rating?: number;
  leadTime?: number;
}

interface PurchaseOrder {
  _id: string;
  orderNumber: string;
  supplierId: any;
  items: any[];
  status: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  total: number;
  paymentStatus: string;
}

interface InventoryReport {
  totalIngredients: number;
  lowStockItems: number;
  expiringItems: number;
  totalInventoryValue: number;
}

const InventoryManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ingredients');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [showCreateRecipe, setShowCreateRecipe] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeDetails, setShowRecipeDetails] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  
  // New ingredient form state
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    description: '',
    unit: 'kg',
    currentStock: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    reorderPoint: 0,
    reorderQuantity: 0,
    cost: 0,
    category: 'vegetables',
    location: '',
    isPerishable: false,
    shelfLife: 0,
    expiryDate: ''
  });
  const { format: formatPrice } = useCurrency();

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [ingredientsRes, reportRes, suppliersRes, ordersRes, recipesRes] = await Promise.all([
        fetch(getApiUrl('inventory/ingredients'), { headers }),
        fetch(getApiUrl('inventory/reports/inventory'), { headers }),
        fetch(getApiUrl('inventory/suppliers'), { headers }),
        fetch(getApiUrl('inventory/purchase-orders?status=pending,approved,ordered'), { headers }),
        fetch(getApiUrl('inventory/recipes'), { headers })
      ]);

      if (ingredientsRes.ok && reportRes.ok && suppliersRes.ok && ordersRes.ok && recipesRes.ok) {
        const ingredientsData = await ingredientsRes.json();
        const reportData = await reportRes.json();
        const suppliersData = await suppliersRes.json();
        const ordersData = await ordersRes.json();
        const recipesData = await recipesRes.json();

        setIngredients(ingredientsData.data || ingredientsData || []);
        setInventoryReport(reportData);
        setSuppliers(suppliersData.data || suppliersData || []);
        setPurchaseOrders(ordersData.data || ordersData || []);
        setRecipes(recipesData.data || recipesData || []);
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async () => {
    if (!selectedIngredient) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(`inventory/ingredients/${selectedIngredient._id}/adjust-stock`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quantity: adjustmentQuantity,
          operation: adjustmentType,
          reason: adjustmentReason
        })
      });

      if (response.ok) {
        toast.success('Stock adjusted successfully');
        fetchInventoryData();
        setSelectedIngredient(null);
        setAdjustmentQuantity(0);
        setAdjustmentReason('');
      } else {
        toast.error('Failed to adjust stock');
      }
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('Failed to adjust stock');
    }
  };

  const handleAddIngredient = async () => {
    if (!newIngredient.name || newIngredient.cost < 0) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const ingredientData = {
        ...newIngredient,
        expiryDate: newIngredient.expiryDate || undefined
      };

      const response = await fetch(getApiUrl('inventory/ingredients'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ingredientData)
      });

      if (response.ok) {
        toast.success('Ingredient added successfully');
        fetchInventoryData();
        setShowAddIngredient(false);
        // Reset form
        setNewIngredient({
          name: '',
          description: '',
          unit: 'kg',
          currentStock: 0,
          minStockLevel: 0,
          maxStockLevel: 0,
          reorderPoint: 0,
          reorderQuantity: 0,
          cost: 0,
          category: 'vegetables',
          location: '',
          isPerishable: false,
          shelfLife: 0,
          expiryDate: ''
        });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add ingredient');
      }
    } catch (error) {
      console.error('Error adding ingredient:', error);
      toast.error('Failed to add ingredient');
    }
  };

  const getStockStatus = (ingredient: Ingredient) => {
    const percentage = ingredient.maxStockLevel ? (ingredient.currentStock / ingredient.maxStockLevel) * 100 : 0;
    if (ingredient.currentStock <= ingredient.minStockLevel) {
      return { status: 'Critical', color: 'destructive' };
    } else if (ingredient.currentStock <= ingredient.reorderPoint) {
      return { status: 'Low', color: 'warning' };
    } else if (percentage > 90) {
      return { status: 'Overstocked', color: 'secondary' };
    }
    return { status: 'Optimal', color: 'success' };
  };

  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || ing.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryColors: Record<string, string> = {
    vegetables: 'bg-green-100 text-green-800',
    fruits: 'bg-orange-100 text-orange-800',
    meat: 'bg-red-100 text-red-800',
    seafood: 'bg-blue-100 text-blue-800',
    dairy: 'bg-yellow-100 text-yellow-800',
    grains: 'bg-amber-100 text-amber-800',
    spices: 'bg-purple-100 text-purple-800',
    beverages: 'bg-cyan-100 text-cyan-800',
    condiments: 'bg-pink-100 text-pink-800',
    other: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-sm text-gray-500 mt-1">
                Track ingredients, manage stock levels, and handle purchase orders
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-6">
        {inventoryReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ingredients</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventoryReport.totalIngredients}</div>
                <p className="text-xs text-muted-foreground">Active items in stock</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{inventoryReport.lowStockItems}</div>
                <p className="text-xs text-muted-foreground">Items need reordering</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{inventoryReport.expiringItems}</div>
                <p className="text-xs text-muted-foreground">Within next 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(inventoryReport.totalInventoryValue)}
                </div>
                <p className="text-xs text-muted-foreground">Total stock value</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b">
                <TabsList className="w-full justify-start rounded-none h-auto p-0 bg-transparent">
                  <TabsTrigger 
                    value="ingredients"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                  >
                    <PackageSearch className="h-4 w-4 mr-2" />
                    Ingredients
                  </TabsTrigger>
                  <TabsTrigger 
                    value="recipes"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                  >
                    <ChefHat className="h-4 w-4 mr-2" />
                    Recipes
                  </TabsTrigger>
                  <TabsTrigger 
                    value="suppliers"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Suppliers
                  </TabsTrigger>
                  <TabsTrigger 
                    value="purchase-orders"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Purchase Orders
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reports"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Reports
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Ingredients Tab */}
              <TabsContent value="ingredients" className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search ingredients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-[300px]"
                      />
                    </div>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="vegetables">Vegetables</SelectItem>
                        <SelectItem value="fruits">Fruits</SelectItem>
                        <SelectItem value="meat">Meat</SelectItem>
                        <SelectItem value="seafood">Seafood</SelectItem>
                        <SelectItem value="dairy">Dairy</SelectItem>
                        <SelectItem value="grains">Grains</SelectItem>
                        <SelectItem value="spices">Spices</SelectItem>
                        <SelectItem value="beverages">Beverages</SelectItem>
                        <SelectItem value="condiments">Condiments</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => setShowAddIngredient(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ingredient
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Min/Reorder/Max</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIngredients.map((ingredient) => {
                        const stockStatus = getStockStatus(ingredient);
                        return (
                          <TableRow key={ingredient._id}>
                            <TableCell className="font-medium">
                              <div>
                                <p className="font-medium">{ingredient.name}</p>
                                {ingredient.isPerishable && (
                                  <p className="text-xs text-muted-foreground">Perishable</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${categoryColors[ingredient.category]} border-0`}>
                                {ingredient.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {ingredient.currentStock} {ingredient.unit}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <span className="text-muted-foreground">Min:</span> {ingredient.minStockLevel} / 
                                <span className="text-muted-foreground"> Reorder:</span> {ingredient.reorderPoint} / 
                                <span className="text-muted-foreground"> Max:</span> {ingredient.maxStockLevel || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>{formatPrice(ingredient.cost)}/{ingredient.unit}</TableCell>
                            <TableCell className="font-medium">
                              {formatPrice(ingredient.cost * ingredient.currentStock)}
                            </TableCell>
                            <TableCell>{ingredient.location || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={stockStatus.color as any}>
                                {stockStatus.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedIngredient(ingredient)}
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
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Recipes Tab */}
              <TabsContent value="recipes" className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Menu Item Recipes</h3>
                  <Button onClick={() => setShowCreateRecipe(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Recipe
                  </Button>
                </div>

                <div className="grid gap-4">
                  {recipes.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">No Recipes Configured</h3>
                        <p className="text-muted-foreground mb-4">
                          Create recipes to link menu items with ingredients and track costs
                        </p>
                        <Button onClick={() => setShowCreateRecipe(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Recipe
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    recipes.map((recipe) => (
                      <Card key={recipe._id}>
                        <CardHeader>
                          <CardTitle className="text-base">
                            {recipe.menuItemId?.name || 'Unknown Item'}
                          </CardTitle>
                          <CardDescription>
                            Prep: {recipe.preparationTime}min | Cook: {recipe.cookingTime}min | 
                            Serves: {recipe.servingSize}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">
                                Estimated Cost: {formatPrice(recipe.estimatedCost || 0)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {recipe.ingredients.length} ingredients
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={recipe.ingredientsAvailable ? 'success' : 'destructive'}>
                                {recipe.ingredientsAvailable ? 'Available' : 'Missing Ingredients'}
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedRecipe(recipe);
                                  setShowRecipeDetails(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Suppliers Tab */}
              <TabsContent value="suppliers" className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Supplier Directory</h3>
                  <Button onClick={() => setShowAddSupplier(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supplier Name</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Categories</TableHead>
                        <TableHead>Lead Time</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.map((supplier) => (
                        <TableRow key={supplier._id}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>{supplier.contactPerson || 'N/A'}</TableCell>
                          <TableCell>{supplier.phone}</TableCell>
                          <TableCell>{supplier.email || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {supplier.categories.slice(0, 3).map((cat) => (
                                <Badge key={cat} variant="outline" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                              {supplier.categories.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{supplier.categories.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {supplier.leadTime ? `${supplier.leadTime} days` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {supplier.rating ? (
                              <div className="flex items-center">
                                <span className="mr-1">{supplier.rating}</span>
                                <span className="text-yellow-500">★</span>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost">
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Purchase Orders Tab */}
              <TabsContent value="purchase-orders" className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Purchase Orders</h3>
                  <Button onClick={() => setShowCreatePO(true)}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Create Order
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order Number</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Order Date</TableHead>
                        <TableHead>Expected Delivery</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrders.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>{order.supplierId?.name || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(order.orderDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {order.expectedDeliveryDate
                              ? new Date(order.expectedDeliveryDate).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatPrice(order.total)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.status === 'received'
                                  ? 'success'
                                  : order.status === 'cancelled'
                                  ? 'destructive'
                                  : 'default'
                              }
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.paymentStatus === 'paid'
                                  ? 'success'
                                  : order.paymentStatus === 'pending'
                                  ? 'warning'
                                  : 'default'
                              }
                            >
                              {order.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="p-6">
                <div className="grid gap-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Low Stock Report</CardTitle>
                        <CardDescription>Items below reorder point</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {ingredients
                            .filter((ing) => ing.currentStock <= ing.reorderPoint)
                            .slice(0, 5)
                            .map((ingredient) => (
                              <div
                                key={ingredient._id}
                                className="flex justify-between items-center py-2 border-b last:border-0"
                              >
                                <div>
                                  <p className="font-medium">{ingredient.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {ingredient.currentStock} / {ingredient.reorderPoint} {ingredient.unit}
                                  </p>
                                </div>
                                <Button size="sm" variant="outline">
                                  Reorder
                                </Button>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Expiring Items</CardTitle>
                        <CardDescription>Items expiring in next 7 days</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {ingredients
                            .filter((ing) => ing.expiryDate)
                            .slice(0, 5)
                            .map((ingredient) => (
                              <div
                                key={ingredient._id}
                                className="flex justify-between items-center py-2 border-b last:border-0"
                              >
                                <div>
                                  <p className="font-medium">{ingredient.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Expires: {ingredient.expiryDate ? new Date(ingredient.expiryDate).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                                <Badge variant="warning">
                                  {ingredient.currentStock} {ingredient.unit}
                                </Badge>
                              </div>
                            ))}
                          {ingredients.filter((ing) => ing.expiryDate).length === 0 && (
                            <p className="text-muted-foreground text-center py-4">
                              No expiring items
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Inventory Summary</CardTitle>
                      <CardDescription>Overall inventory status and metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Total Items</p>
                          <p className="text-2xl font-bold">{inventoryReport?.totalIngredients || 0}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Low Stock</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {inventoryReport?.lowStockItems || 0}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Expiring Soon</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {inventoryReport?.expiringItems || 0}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Total Value</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatPrice(inventoryReport?.totalInventoryValue || 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Add Ingredient Dialog */}
      <Dialog open={showAddIngredient} onOpenChange={setShowAddIngredient}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Ingredient</DialogTitle>
            <DialogDescription>
              Enter the details for the new ingredient to add to your inventory
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                  placeholder="e.g., Tomatoes"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={newIngredient.category}
                  onValueChange={(value) => setNewIngredient({ ...newIngredient, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetables">Vegetables</SelectItem>
                    <SelectItem value="fruits">Fruits</SelectItem>
                    <SelectItem value="meat">Meat</SelectItem>
                    <SelectItem value="seafood">Seafood</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="grains">Grains</SelectItem>
                    <SelectItem value="spices">Spices</SelectItem>
                    <SelectItem value="beverages">Beverages</SelectItem>
                    <SelectItem value="condiments">Condiments</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newIngredient.description}
                onChange={(e) => setNewIngredient({ ...newIngredient, description: e.target.value })}
                placeholder="Brief description of the ingredient"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select
                  value={newIngredient.unit}
                  onValueChange={(value) => setNewIngredient({ ...newIngredient, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="g">Gram (g)</SelectItem>
                    <SelectItem value="l">Liter (l)</SelectItem>
                    <SelectItem value="ml">Milliliter (ml)</SelectItem>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="dozen">Dozen</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="bottle">Bottle</SelectItem>
                    <SelectItem value="can">Can</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost per Unit *</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="1"
                  value={newIngredient.cost}
                  onChange={(e) => setNewIngredient({ ...newIngredient, cost: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Storage Location</Label>
                <Input
                  id="location"
                  value={newIngredient.location}
                  onChange={(e) => setNewIngredient({ ...newIngredient, location: e.target.value })}
                  placeholder="e.g., Freezer A"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentStock">Current Stock *</Label>
                <Input
                  id="currentStock"
                  type="number"
                  min="0"
                  value={newIngredient.currentStock}
                  onChange={(e) => setNewIngredient({ ...newIngredient, currentStock: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Min Stock Level *</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={newIngredient.minStockLevel}
                  onChange={(e) => setNewIngredient({ ...newIngredient, minStockLevel: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderPoint">Reorder Point *</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  min="0"
                  value={newIngredient.reorderPoint}
                  onChange={(e) => setNewIngredient({ ...newIngredient, reorderPoint: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStock">Max Stock Level</Label>
                <Input
                  id="maxStock"
                  type="number"
                  min="0"
                  value={newIngredient.maxStockLevel}
                  onChange={(e) => setNewIngredient({ ...newIngredient, maxStockLevel: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reorderQty">Reorder Quantity *</Label>
                <Input
                  id="reorderQty"
                  type="number"
                  min="1"
                  value={newIngredient.reorderQuantity}
                  onChange={(e) => setNewIngredient({ ...newIngredient, reorderQuantity: parseFloat(e.target.value) || 0 })}
                  placeholder="Quantity to order when restocking"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newIngredient.expiryDate}
                  onChange={(e) => setNewIngredient({ ...newIngredient, expiryDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="perishable"
                  checked={newIngredient.isPerishable}
                  onChange={(e) => setNewIngredient({ ...newIngredient, isPerishable: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="perishable" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Perishable Item
                </Label>
              </div>
              {newIngredient.isPerishable && (
                <div className="space-y-2">
                  <Label htmlFor="shelfLife">Shelf Life (days)</Label>
                  <Input
                    id="shelfLife"
                    type="number"
                    min="0"
                    value={newIngredient.shelfLife}
                    onChange={(e) => setNewIngredient({ ...newIngredient, shelfLife: parseInt(e.target.value) || 0 })}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddIngredient(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddIngredient}>
              Add Ingredient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={!!selectedIngredient} onOpenChange={() => setSelectedIngredient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock - {selectedIngredient?.name}</DialogTitle>
            <DialogDescription>
              Current stock: {selectedIngredient?.currentStock} {selectedIngredient?.unit}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adjustment-type" className="text-right">
                Type
              </Label>
              <Select value={adjustmentType} onValueChange={(v: any) => setAdjustmentType(v)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Stock</SelectItem>
                  <SelectItem value="subtract">Remove Stock</SelectItem>
                  <SelectItem value="set">Set Stock Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Textarea
                id="reason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="col-span-3"
                placeholder="Enter reason for adjustment..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedIngredient(null)}>
              Cancel
            </Button>
            <Button onClick={handleStockAdjustment}>
              Confirm Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Recipe Dialog */}
      <CreateRecipeDialog
        isOpen={showCreateRecipe}
        onClose={() => setShowCreateRecipe(false)}
        onRecipeCreated={() => {
          setShowCreateRecipe(false);
          fetchInventoryData();
        }}
        ingredients={ingredients}
      />

      {/* Recipe Details Dialog */}
      <RecipeDetailsDialog
        isOpen={showRecipeDetails}
        onClose={() => {
          setShowRecipeDetails(false);
          setSelectedRecipe(null);
        }}
        recipe={selectedRecipe}
      />
    </div>
  );
};

export default InventoryManagement;