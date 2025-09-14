import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

import { Category } from '../models/Category';
import { MenuItem } from '../models/MenuItem';
import { MenuService } from '../services/menu.service';

// ===== PUBLIC MENU ITEM CONTROLLERS (No Authentication Required) =====

export const getPublicMenuItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { category, search, available, page = 1, limit = 50, sortBy = 'name', order = 'asc' } = req.query;

    const result = await MenuService.getMenuItems({
      category: category as string,
      search: search as string,
      available: available as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as string,
      order: order as string,
      isPublic: true
    });

    res.json({
      success: true,
      data: result.items,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.total,
        itemsPerPage: parseInt(limit as string)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicMenuItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const menuItem = await MenuService.getMenuItemById(id, undefined, true);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found or not available'
      });
    }

    res.json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    next(error);
  }
};

// ===== PUBLIC CATEGORY CONTROLLERS =====

export const getPublicCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const result = await MenuService.getCategories(undefined, true);

    res.json({
      success: true,
      data: result.categories,
      total: result.total
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const category = await MenuService.getCategoryById(id, undefined, true);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or has no available items'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};