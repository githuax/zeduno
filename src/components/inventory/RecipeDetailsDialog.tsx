import React from 'react';
import { X, Package, Clock, Users, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RecipeDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: any | null;
}

const RecipeDetailsDialog: React.FC<RecipeDetailsDialogProps> = ({
  isOpen,
  onClose,
  recipe
}) => {
  if (!recipe) return null;

  const totalCost = recipe.ingredients?.reduce((sum: number, ing: any) => {
    const ingredientCost = (ing.ingredientId?.cost || 0) * ing.quantity;
    return sum + ingredientCost;
  }, 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Recipe Details: {recipe.menuItemId?.name || 'Unknown Item'}
          </DialogTitle>
          <DialogDescription>
            View complete recipe information including ingredients and costs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipe Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Prep Time</p>
                    <p className="font-semibold">{recipe.preparationTime || 0} min</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cook Time</p>
                    <p className="font-semibold">{recipe.cookingTime || 0} min</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Serving Size</p>
                    <p className="font-semibold">{recipe.servingSize || 1}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Est. Cost</p>
                    <p className="font-semibold">${totalCost.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ingredients List */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
              <CardDescription>
                Required ingredients and quantities for this recipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient</TableHead>
                      <TableHead>Required Quantity</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipe.ingredients.map((ing: any, index: number) => {
                      const ingredient = ing.ingredientId || {};
                      const isAvailable = (ingredient.currentStock || 0) >= ing.quantity;
                      const itemCost = (ingredient.cost || 0) * ing.quantity;

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {ingredient.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {ing.quantity} {ing.unit || ingredient.unit}
                          </TableCell>
                          <TableCell>
                            {ingredient.currentStock || 0} {ingredient.unit}
                          </TableCell>
                          <TableCell>
                            ${(ingredient.cost || 0).toFixed(2)}/{ingredient.unit}
                          </TableCell>
                          <TableCell>
                            ${itemCost.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {isAvailable ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Available
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600 border-red-600">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Low Stock
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  No ingredients configured for this recipe
                </p>
              )}
            </CardContent>
          </Card>

          {/* Instructions (if available) */}
          {recipe.instructions && (
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{recipe.instructions}</p>
              </CardContent>
            </Card>
          )}

          {/* Notes (if available) */}
          {recipe.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{recipe.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeDetailsDialog;