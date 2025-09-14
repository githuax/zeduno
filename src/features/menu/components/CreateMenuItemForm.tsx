import { X, Plus } from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { getApiUrl } from '@/config/api';
import { useCurrency } from '@/hooks/useCurrency';

interface Category {
  _id: string;
  name: string;
  description?: string;
}

interface CustomizationOption {
  name: string;
  price: number;
  isAvailable: boolean;
}

interface CreateMenuItemFormProps {
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateMenuItemForm: React.FC<CreateMenuItemFormProps> = ({
  categories,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    imageUrl: '',
    isAvailable: true,
    preparationTime: '',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    spiceLevel: '',
    stockQuantity: '',
    amount: '',
    minStockLevel: '',
    maxStockLevel: '',
    trackInventory: true
  });

  const [customizationOptions, setCustomizationOptions] = useState<CustomizationOption[]>([]);
  const [newCustomization, setNewCustomization] = useState({ name: '', price: '', isAvailable: true });
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const { currencyCode, symbol } = useCurrency();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) newErrors.imageUrl = 'Valid image URL is required';
    if (formData.trackInventory && (!formData.amount || parseInt(formData.amount) < 0)) newErrors.amount = 'Valid stock amount is required when tracking inventory';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const addCustomizationOption = () => {
    if (newCustomization.name && newCustomization.price) {
      setCustomizationOptions(prev => [
        ...prev,
        {
          name: newCustomization.name,
          price: parseFloat(newCustomization.price),
          isAvailable: newCustomization.isAvailable
        }
      ]);
      setNewCustomization({ name: '', price: '', isAvailable: true });
    }
  };

  const removeCustomizationOption = (index: number) => {
    setCustomizationOptions(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const requestData = {
        ...formData,
        price: parseFloat(formData.price),
        preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : undefined,
        stockQuantity: formData.stockQuantity ? parseInt(formData.stockQuantity) : undefined,
        amount: formData.amount ? parseInt(formData.amount) : 0,
        minStockLevel: formData.minStockLevel ? parseInt(formData.minStockLevel) : 0,
        maxStockLevel: formData.maxStockLevel ? parseInt(formData.maxStockLevel) : undefined,
        customizationOptions: customizationOptions.length > 0 ? customizationOptions : undefined,
        tags: tags.length > 0 ? tags : undefined,
        spiceLevel: formData.spiceLevel || undefined
      };

      const response = await fetch(getApiUrl('menu/items'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message || "Menu item created successfully"
        });
        onSuccess();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create menu item');
      }
    } catch (error) {
      console.error('Failed to create menu item:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create menu item",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details about the menu item</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Margherita Pizza"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detailed description of the menu item"
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price ({symbol}) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  className={errors.price ? 'border-red-500' : ''}
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>

              <div>
                <Label htmlFor="categoryId">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                  <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(category => category._id && category._id.trim() !== '')
                      .map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className={errors.imageUrl ? 'border-red-500' : ''}
              />
              {errors.imageUrl && <p className="text-red-500 text-sm mt-1">{errors.imageUrl}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>Optional information and dietary preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preparationTime">Prep Time (min)</Label>
                <Input
                  id="preparationTime"
                  type="number"
                  min="0"
                  value={formData.preparationTime}
                  onChange={(e) => handleInputChange('preparationTime', e.target.value)}
                  placeholder="15"
                />
              </div>

              <div>
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Inventory Management Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inventory Management</CardTitle>
                <CardDescription>
                  Manage stock levels and inventory tracking for this item
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="trackInventory"
                    checked={formData.trackInventory}
                    onCheckedChange={(checked) => handleInputChange('trackInventory', checked)}
                  />
                  <Label htmlFor="trackInventory">Track inventory for this item</Label>
                </div>

                {formData.trackInventory && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="amount">Current Stock *</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        placeholder="100"
                        className={errors.amount ? 'border-red-500' : ''}
                      />
                      {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount}</p>}
                    </div>

                    <div>
                      <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
                      <Input
                        id="minStockLevel"
                        type="number"
                        min="0"
                        value={formData.minStockLevel}
                        onChange={(e) => handleInputChange('minStockLevel', e.target.value)}
                        placeholder="10"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Alert when stock falls below this level</p>
                    </div>

                    <div>
                      <Label htmlFor="maxStockLevel">Maximum Stock Level</Label>
                      <Input
                        id="maxStockLevel"
                        type="number"
                        min="0"
                        value={formData.maxStockLevel}
                        onChange={(e) => handleInputChange('maxStockLevel', e.target.value)}
                        placeholder="1000"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Maximum inventory capacity (optional)</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div>
              <Label htmlFor="spiceLevel">Spice Level</Label>
              <Select value={formData.spiceLevel} onValueChange={(value) => handleInputChange('spiceLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select spice level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="extra-hot">Extra Hot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Dietary Information</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isVegetarian"
                    checked={formData.isVegetarian}
                    onCheckedChange={(checked) => handleInputChange('isVegetarian', checked)}
                  />
                  <Label htmlFor="isVegetarian">Vegetarian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isVegan"
                    checked={formData.isVegan}
                    onCheckedChange={(checked) => {
                      handleInputChange('isVegan', checked);
                      if (checked) handleInputChange('isVegetarian', true);
                    }}
                  />
                  <Label htmlFor="isVegan">Vegan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isGlutenFree"
                    checked={formData.isGlutenFree}
                    onCheckedChange={(checked) => handleInputChange('isGlutenFree', checked)}
                  />
                  <Label htmlFor="isGlutenFree">Gluten Free</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isAvailable"
                checked={formData.isAvailable}
                onCheckedChange={(checked) => handleInputChange('isAvailable', checked)}
              />
              <Label htmlFor="isAvailable">Available for orders</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customization Options */}
      <Card>
        <CardHeader>
          <CardTitle>Customization Options</CardTitle>
          <CardDescription>Add-ons and modifications customers can choose</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Option name"
              value={newCustomization.name}
              onChange={(e) => setNewCustomization(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Price"
              value={newCustomization.price}
              onChange={(e) => setNewCustomization(prev => ({ ...prev, price: e.target.value }))}
            />
            <div className="flex items-center space-x-2">
              <Switch
                checked={newCustomization.isAvailable}
                onCheckedChange={(checked) => setNewCustomization(prev => ({ ...prev, isAvailable: checked }))}
              />
              <Label>Available</Label>
            </div>
            <Button type="button" onClick={addCustomizationOption} disabled={!newCustomization.name || !newCustomization.price}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {customizationOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Current Options:</Label>
              <div className="space-y-2">
                {customizationOptions.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span>{option.name} (+{symbol}{option.price.toFixed(currencyCode === 'KES' ? 0 : 2)})</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant={option.isAvailable ? "default" : "secondary"}>
                        {option.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomizationOption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>Keywords to help customers find this item</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Add tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" onClick={addTag} disabled={!newTag.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{tag}</span>
                  <button type="button" onClick={() => removeTag(index)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Menu Item'}
        </Button>
      </div>
    </form>
  );
};

export default CreateMenuItemForm;