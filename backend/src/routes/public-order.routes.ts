import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createPublicOrder,
  getPublicOrder,
  getPublicOrderByNumber
} from '../controllers/public-order.controller';

const router = Router();

// ===== PUBLIC ORDER ROUTES (No authentication required) =====

// Create a new order (for customers)
router.post('/', [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.menuItemId')
    .notEmpty()
    .isMongoId()
    .withMessage('Valid menu item ID is required'),
  body('items.*.name')
    .notEmpty()
    .withMessage('Item name is required'),
  body('items.*.price')
    .isFloat({ min: 0 })
    .withMessage('Valid item price is required'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Valid quantity is required'),
  body('customer.firstName')
    .notEmpty()
    .withMessage('Customer first name is required'),
  body('customer.lastName')
    .notEmpty()
    .withMessage('Customer last name is required'),
  body('customer.email')
    .isEmail()
    .withMessage('Valid customer email is required'),
  body('customer.phone')
    .notEmpty()
    .withMessage('Customer phone is required'),
  body('deliveryType')
    .isIn(['delivery', 'pickup'])
    .withMessage('Delivery type must be delivery or pickup'),
  body('deliveryInfo.address')
    .if(body('deliveryType').equals('delivery'))
    .notEmpty()
    .withMessage('Delivery address is required for delivery orders'),
  body('deliveryInfo.city')
    .if(body('deliveryType').equals('delivery'))
    .notEmpty()
    .withMessage('City is required for delivery orders'),
  body('totals.total')
    .isFloat({ min: 0 })
    .withMessage('Valid order total is required')
], createPublicOrder);

// Get order by ID (for customers to view their order)
router.get('/:id', [
  param('id')
    .isMongoId()
    .withMessage('Valid order ID is required')
], getPublicOrder);

// Get order by order number (for customers to track their order)
router.get('/number/:orderNumber', [
  param('orderNumber')
    .notEmpty()
    .withMessage('Order number is required')
], getPublicOrderByNumber);

export default router;