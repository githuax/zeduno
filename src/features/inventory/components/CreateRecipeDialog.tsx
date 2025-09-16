import { X, Plus, Minus } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getApiUrl } from '@/config/api';

interface Ingredient {
  _id: string;
  name: string;
  unit: string;
  currentStock: number;
  cost: number;
  trackBy?: 'unit' | 'volume';
  volumePerUnitMl?: number;
  defaultPourSizeMl?: number;
}

interface MenuItem {
  _id: string;
  name: string;
  price: number;
}

interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
  unit: string;
  ingredientName?: string;
}

interface CreateRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeCreated: () => void;
  ingredients: Ingredient[];
}

const CreateRecipeDialog: React.FC<CreateRecipeDialogProps> = ({
  isOpen,
  onClose,
  onRecipeCreated,
  ingredients = []
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>('');
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([
    { ingredientId: '', quantity: 0, unit: '' }
  ]);
  const [preparationTime, setPreparationTime] = useState(15);
  const [cookingTime, setCookingTime] = useState(10);
  const [servingSize, setServingSize] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMenuItems, setLoadingMenuItems] = useState(true);
  const { toast } = useToast();

  // Fetch menu items
  useEffect(() => {
    if (isOpen) {
      fetchMenuItems();
    }
  }, [isOpen]);

  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('menu/items'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive"
      });
    } finally {
      setLoadingMenuItems(false);
    }
  };

  const addIngredientRow = () => {
    setRecipeIngredients([...recipeIngredients, { ingredientId: '', quantity: 0, unit: '' }]);
  };

  const removeIngredientRow = (index: number) => {
    if (recipeIngredients.length > 1) {
      const updated = recipeIngredients.filter((_, i) => i !== index);
      setRecipeIngredients(updated);
    }
  };

  const updateRecipeIngredient = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    const updated = [...recipeIngredients];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill unit when ingredient is selected
    if (field === 'ingredientId') {
      const selectedIngredient = ingredients.find(ing => ing._id === value);
      if (selectedIngredient) {
        updated[index].unit = selectedIngredient.unit;
        updated[index].ingredientName = selectedIngredient.name;
      }
    }
    
    setRecipeIngredients(updated);
  };

  const handleSubmit = async () => {
    if (!selectedMenuItemId) {
      toast({
        title: "Error",
        description: "Please select a menu item",
        variant: "destructive"
      });
      return;
    }

    // Validate ingredients
    const validIngredients = recipeIngredients.filter(ing => 
      ing.ingredientId && ing.quantity > 0
    );
    
    if (validIngredients.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one ingredient with quantity > 0",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('inventory/recipes'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          menuItemId: selectedMenuItemId,
          ingredients: validIngredients.map(ing => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit
          })),
          preparationTime,
          cookingTime,
          servingSize
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Recipe created successfully",
        });
        onRecipeCreated();
        onClose();
        // Reset form
        setSelectedMenuItemId('');
        setRecipeIngredients([{ ingredientId: '', quantity: 0, unit: '' }]);
        setPreparationTime(15);
        setCookingTime(10);
        setServingSize(1);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to create recipe",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to create recipe:', error);
      toast({
        title: "Error",
        description: "Failed to create recipe",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Recipe</DialogTitle>
          <DialogDescription>
            Link a menu item with its ingredients to track inventory and costs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Menu Item Selection */}
          <div className="space-y-2">
            <Label>Select Menu Item *</Label>
            {loadingMenuItems ? (
              <div className="text-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
              </div>
            ) : (
              <Select value={selectedMenuItemId} onValueChange={setSelectedMenuItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a menu item" />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map((item) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.name} - ${item.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Recipe Times */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Prep Time (min)</Label>
              <Input
                type="number"
                min="0"
                value={preparationTime}
                onChange={(e) => setPreparationTime(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cook Time (min)</Label>
              <Input
                type="number"
                min="0"
                value={cookingTime}
                onChange={(e) => setCookingTime(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Serving Size</Label>
              <Input
                type="number"
                min="1"
                value={servingSize}
                onChange={(e) => setServingSize(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">Recipe Ingredients</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIngredientRow}
                disabled={ingredients.length === 0}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Ingredient
              </Button>
            </div>

            {ingredients.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No ingredients available. Please add ingredients first.
              </div>
            ) : (
              <div className="space-y-3">
                {recipeIngredients.map((recipeIng, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-sm">Ingredient</Label>
                      <Select
                        value={recipeIng.ingredientId}
                        onValueChange={(value) => updateRecipeIngredient(index, 'ingredientId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ingredient) => {
                            let pours: string | null = null;
                            if (
                              ingredient.trackBy === 'volume' &&
                              ingredient.volumePerUnitMl &&
                              ingredient.defaultPourSizeMl &&
                              ingredient.defaultPourSizeMl > 0 &&
                              ingredient.currentStock > 0
                            ) {
                              const p = Math.floor((ingredient.currentStock * ingredient.volumePerUnitMl) / ingredient.defaultPourSizeMl);
                              pours = `≈ ${p} pours`;
                            }
                            return (
                              <SelectItem key={ingredient._id} value={ingredient._id}>
                                {ingredient.name} ({ingredient.currentStock} {ingredient.unit} available{pours ? `, ${pours}` : ''})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Label className="text-sm">Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={recipeIng.quantity || ''}
                        onChange={(e) => updateRecipeIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div className="w-20">
                      <Label className="text-sm">Unit</Label>
                      <Input
                        value={recipeIng.unit}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeIngredientRow(index)}
                      disabled={recipeIngredients.length <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || loadingMenuItems || ingredients.length === 0}
          >
            {loading ? 'Creating...' : 'Create Recipe'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRecipeDialog;
