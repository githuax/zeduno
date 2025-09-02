import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { getApiUrl } from '@/config/api';
import { Plus, X, AlertCircle } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface Category {
  _id: string;
  name: string;
  description?: string;
}

interface MenuItemFormData {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  isAvailable: boolean;
  preparationTime: number;
  tags: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel: 'mild' | 'medium' | 'hot' | 'extra-hot';
  nutritionalInfo: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

interface AddMenuItemModalProps {
  onItemAdded: () => void;
}

const AddMenuItemModal: React.FC<AddMenuItemModalProps> = ({ onItemAdded }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newTag, setNewTag] = useState('');
  const { toast } = useToast();
  const { symbol } = useCurrency();

  const [formData, setFormData] = useState<MenuItemFormData>({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    isAvailable: true,
    preparationTime: 15,
    tags: [],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spiceLevel: 'mild',
    nutritionalInfo: {
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
    }
  });

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching categories with token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(getApiUrl('menu/categories'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Categories response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Categories data:', data);
        setCategories(data.data || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch categories:', errorData);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Validate required fields
      if (!formData.name.trim()) {
        toast({
          title: "Error",
          description: "Name is required",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!formData.categoryId) {
        toast({
          title: "Error",
          description: "Please select a category",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Transform the data to match backend expectations
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || 'No description provided',
        price: formData.price,
        categoryId: formData.categoryId,
        isAvailable: formData.isAvailable,
        preparationTime: formData.preparationTime,
        tags: formData.tags,
        // Flatten dietary info to match backend schema
        isVegetarian: formData.isVegetarian,
        isVegan: formData.isVegan,
        isGlutenFree: formData.isGlutenFree,
        spiceLevel: formData.spiceLevel,
        // Filter out undefined nutritional values
        nutritionalInfo: Object.fromEntries(
          Object.entries(formData.nutritionalInfo).filter(([_, value]) => value !== undefined && value !== '')
        )
      };

      console.log('Submitting data:', submitData);
      console.log('Available categories:', categories);
      console.log('Selected category ID:', formData.categoryId);
      console.log('Category exists in list:', categories.some(cat => cat._id === formData.categoryId));

      const response = await fetch(getApiUrl('menu/items'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      console.log('Submit response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Success response:', responseData);
        toast({
          title: "Success",
          description: "Menu item created successfully",
        });
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          price: 0,
          categoryId: '',
          isAvailable: true,
          preparationTime: 15,
          tags: [],
          isVegetarian: false,
          isVegan: false,
          isGlutenFree: false,
          spiceLevel: 'mild',
          nutritionalInfo: {
            calories: undefined,
            protein: undefined,
            carbs: undefined,
            fat: undefined,
          }
        });
        
        setOpen(false);
        onItemAdded();
      } else {
        const errorData = await response.json();
        console.error('Server validation errors:', errorData);
        toast({
          title: "Error",
          description: errorData.message || "Failed to create menu item",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Network error:', error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Menu Item</DialogTitle>
        </DialogHeader>
        
        {/* Show warning if no categories */}
        {categories.length === 0 && (
          <div className="flex items-center space-x-2 p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">No categories available</p>
              <p>You need to create menu categories first before adding menu items. Please create at least one category in the Categories tab.</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    disabled={categories.length === 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price ({symbol}) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    required
                    disabled={categories.length === 0}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Enter a description for this menu item..."
                  required
                  disabled={categories.length === 0}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category * ({categories.length} available)</Label>
                  {categories.length > 0 ? (
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => {
                        console.log('Category selected:', value);
                        setFormData(prev => ({ ...prev, categoryId: value }));
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">No categories available</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preparationTime">Prep Time (minutes)</Label>
                  <Input
                    id="preparationTime"
                    type="number"
                    min="0"
                    max="480"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, preparationTime: parseInt(e.target.value) || 15 }))}
                    disabled={categories.length === 0}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
                  disabled={categories.length === 0}
                />
                <Label htmlFor="isAvailable">Available for ordering</Label>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    disabled={categories.length === 0}
                  />
                  <Button type="button" onClick={addTag} size="sm" disabled={categories.length === 0}>
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm"
                      >
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dietary Information */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <Label>Dietary Information</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isVegetarian"
                    checked={formData.isVegetarian}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVegetarian: checked }))}
                    disabled={categories.length === 0}
                  />
                  <Label htmlFor="isVegetarian">Vegetarian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isVegan"
                    checked={formData.isVegan}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      isVegan: checked,
                      // Automatically mark as vegetarian if vegan
                      isVegetarian: checked ? true : prev.isVegetarian
                    }))}
                    disabled={categories.length === 0}
                  />
                  <Label htmlFor="isVegan">Vegan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isGlutenFree"
                    checked={formData.isGlutenFree}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isGlutenFree: checked }))}
                    disabled={categories.length === 0}
                  />
                  <Label htmlFor="isGlutenFree">Gluten Free</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spiceLevel">Spice Level</Label>
                  <Select
                    value={formData.spiceLevel}
                    onValueChange={(value: 'mild' | 'medium' | 'hot' | 'extra-hot') => setFormData(prev => ({ ...prev, spiceLevel: value }))}
                    disabled={categories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select spice level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hot">Hot</SelectItem>
                      <SelectItem value="extra-hot">Extra Hot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nutritional Information */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <Label>Nutritional Information (Optional)</Label>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(formData.nutritionalInfo).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="capitalize">{key}</Label>
                    <Input
                      id={key}
                      type="number"
                      step="0.1"
                      min="0"
                      value={value || ''}
                      onChange={(e) => 
                        setFormData(prev => ({
                          ...prev,
                          nutritionalInfo: { 
                            ...prev.nutritionalInfo, 
                            [key]: e.target.value ? parseFloat(e.target.value) : undefined 
                          }
                        }))
                      }
                      disabled={categories.length === 0}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || categories.length === 0}>
              {loading ? 'Creating...' : categories.length === 0 ? 'Create Categories First' : 'Create Menu Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMenuItemModal;
