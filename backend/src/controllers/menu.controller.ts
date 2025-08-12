import { Request, Response } from 'express';
import MenuItem, { IMenuItem } from '../models/Menu';

export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const { category, available, search } = req.query;
    
    let query: any = {};
    
    if (category) query.category = category;
    if (available !== undefined) query.isAvailable = available === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }
    
    const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu items', error });
  }
};

export const getMenuItem = async (req: Request, res: Response) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching menu item', error });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const menuItem = new MenuItem(req.body);
    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (error) {
    res.status(400).json({ message: 'Error creating menu item', error });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (error) {
    res.status(400).json({ message: 'Error updating menu item', error });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting menu item', error });
  }
};

export const toggleAvailability = async (req: Request, res: Response) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling availability', error });
  }
};