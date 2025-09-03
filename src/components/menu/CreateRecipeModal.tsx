import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Button } from "@/components/ui/button";
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
}

interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
  unit: string;
  ingredientName?: string;
}

interface MenuItem {
  _id: string;
  name: string;
}

interface CreateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem;
  onRecipeCreated: () => void;
}

const CreateRecipeModal: React.FC<CreateRecipeModalProps> = ({
  isOpen,
  onClose,
  menuItem,
  onRecipeCreated
}) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([
    { ingredientId: '', quantity: 0, unit: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const { toast } = useToast();

  // Fetch available ingredients
  useEffect(() => {
    if (isOpen) {
      fetchIngredients();
    }
  }, [isOpen]);

  const fetchIngredients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('inventory/ingredients'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIngredients(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch ingredients:', error);
      toast({
        title: "Error",
        description: "Failed to load ingredients",
        variant: "destructive"
      });
    } finally {
      setLoadingIngredients(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
          menuItemId: menuItem._id,
          ingredients: validIngredients.map(ing => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit
          }))
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Recipe created for ${menuItem.name}`,
        });
        onRecipeCreated();
        onClose();
        // Reset form
        setRecipeIngredients([{ ingredientId: '', quantity: 0, unit: '' }]);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create Recipe for {menuItem.name}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">Recipe Ingredients</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIngredientRow}
                disabled={loadingIngredients}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Ingredient
              </Button>
            </div>

            {loadingIngredients ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading ingredients...</p>
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
                          {ingredients.map((ingredient) => (
                            <SelectItem key={ingredient._id} value={ingredient._id}>
                              {ingredient.name} ({ingredient.currentStock} {ingredient.unit} available)
                            </SelectItem>
                          ))}
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
                    <div className="w-16">
                      <Label className="text-sm">Unit</Label>
                      <Input
                        value={recipeIng.unit}
                        onChange={(e) => updateRecipeIngredient(index, 'unit', e.target.value)}
                        placeholder="unit"
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

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || loadingIngredients}
            >
              {loading ? 'Creating...' : 'Create Recipe'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRecipeModal;