import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, Star, Clock, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '@/config/api';
import ShoppingCartModal from '@/components/cart/ShoppingCart';
import { useCurrency } from '@/hooks/useCurrency';

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
  dietaryInfo?: {
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
  images?: string[];
  popularity?: number;
}

interface Category {
  _id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

const CustomerMenu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { addToCart, getTotalItems, getTotalPrice, isInCart, getCartItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { format: formatPrice } = useCurrency();

  // Fetch menu items
  const fetchMenuItems = async () => {
    try {
      const response = await fetch(getApiUrl('public-menu/items'));
      
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.data || []);
      }
    } catch (error) {
      console.log('Failed to fetch menu items');
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(getApiUrl('public-menu/categories'));
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.log('Failed to fetch categories');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMenuItems(), fetchCategories()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Filter menu items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
                           item.categoryId?._id === selectedCategory;
    
    return item.isAvailable && matchesSearch && matchesCategory;
  });

  const handleAddToCart = (item: MenuItem, quantity: number = 1) => {
    addToCart({
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      quantity,
      image: item.images?.[0]
    });

    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart`,
    });
  };

  const getItemQuantityInCart = (itemId: string) => {
    const cartItem = getCartItem(itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const handleCartClick = () => {
    if (getTotalItems() > 0) {
      navigate('/checkout');
    } else {
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart first",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Joe's Pizza Palace</h1>
              <p className="text-gray-600">Delicious pizzas made fresh daily</p>
            </div>
            <div 
              className="flex items-center space-x-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={handleCartClick}
            >
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-gray-600" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total</p>
                <p className="font-bold text-lg">{formatPrice(getTotalPrice())}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-auto">
              <TabsTrigger value="all">All Items</TabsTrigger>
              {categories
                .filter(cat => cat.isActive)
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((category) => (
                  <TabsTrigger key={category._id} value={category._id}>
                    {category.name}
                  </TabsTrigger>
                ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Menu Items Grid */}
        {filteredMenuItems.length === 0 ? (
          <div className="text-center py-12">
            <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search' : 'No menu items available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenuItems.map((item) => (
              <Card key={item._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Item Image */}
                <div className="h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Utensils className="h-16 w-16 text-gray-400" />
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                        <span className="font-bold text-lg text-green-600">{formatPrice(item.price)}</span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{item.preparationTime} min</span>
                      </div>
                      {item.popularity && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>Popular</span>
                        </div>
                      )}
                    </div>

                    {/* Dietary Info */}
                    {item.dietaryInfo && (
                      <div className="flex flex-wrap gap-1">
                        {item.dietaryInfo.isVegetarian && <Badge variant="outline" className="text-xs">Vegetarian</Badge>}
                        {item.dietaryInfo.isVegan && <Badge variant="outline" className="text-xs">Vegan</Badge>}
                        {item.dietaryInfo.isGlutenFree && <Badge variant="outline" className="text-xs">Gluten Free</Badge>}
                        {item.dietaryInfo.isSpicy && <Badge variant="outline" className="text-xs bg-red-50 text-red-600">Spicy</Badge>}
                      </div>
                    )}

                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Add to Cart */}
                    <div className="pt-2">
                      {getItemQuantityInCart(item._id) > 0 ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentQty = getItemQuantityInCart(item._id);
                                if (currentQty > 1) {
                                  handleAddToCart(item, -1);
                                }
                              }}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-medium w-8 text-center">
                              {getItemQuantityInCart(item._id)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddToCart(item, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <span className="text-sm text-gray-600">In cart</span>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleAddToCart(item)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Floating Cart Button for Mobile */}
        {getTotalItems() > 0 && (
          <div className="fixed bottom-6 right-6 z-50 md:hidden">
            <Button
              onClick={handleCartClick}
              className="h-14 w-14 rounded-full shadow-lg"
              size="lg"
            >
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 bg-white text-primary text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {getTotalItems()}
                </span>
              </div>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerMenu;