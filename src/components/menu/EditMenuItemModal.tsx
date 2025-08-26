import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EditMenuItemForm from './EditMenuItemForm';

interface Category {
  _id: string;
  name: string;
  description?: string;
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
  createdAt: string;
  updatedAt: string;
}

interface EditMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  categories: Category[];
  onSuccess: () => void;
}

const EditMenuItemModal: React.FC<EditMenuItemModalProps> = ({
  isOpen,
  onClose,
  item,
  categories,
  onSuccess
}) => {
  if (!item) return null;

  // Transform the item to match EditMenuItemForm's expected interface
  const formattedItem = {
    _id: item._id,
    name: item.name,
    description: item.description,
    price: item.price,
    categoryId: typeof item.categoryId === 'object' ? item.categoryId._id : item.categoryId || '',
    isAvailable: item.isAvailable,
    preparationTime: item.preparationTime,
    tags: item.tags || [],
    isVegetarian: item.dietaryInfo?.isVegetarian || false,
    isVegan: item.dietaryInfo?.isVegan || false,
    isGlutenFree: item.dietaryInfo?.isGlutenFree || false,
    spiceLevel: item.dietaryInfo?.isSpicy ? 'medium' : '',
  };

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
          <DialogDescription>
            Update the details of "{item.name}"
          </DialogDescription>
        </DialogHeader>
        <EditMenuItemForm
          item={formattedItem}
          categories={categories}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditMenuItemModal;