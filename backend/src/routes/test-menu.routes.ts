import { Router, Request, Response } from 'express';

const router = Router();

// Mock menu data for testing
const mockMenuItems = [
  {
    _id: "1",
    name: "Margherita Pizza",
    description: "Fresh tomatoes, mozzarella, basil",
    price: 12.99,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
    isAvailable: true,
    isVegetarian: true,
    customizationOptions: []
  },
  {
    _id: "2",
    name: "Pepperoni Pizza",
    description: "Pepperoni, mozzarella, tomato sauce",
    price: 14.99,
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e",
    isAvailable: true,
    isVegetarian: false,
    customizationOptions: [
      {
        name: "Extra Cheese",
        price: 2.00,
        isAvailable: true
      },
      {
        name: "Extra Pepperoni",
        price: 3.00,
        isAvailable: true
      }
    ]
  },
  {
    _id: "3",
    name: "Caesar Salad",
    description: "Romaine lettuce, parmesan, croutons, caesar dressing",
    price: 8.99,
    category: "Salads",
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1",
    isAvailable: true,
    isVegetarian: true,
    customizationOptions: []
  },
  {
    _id: "4",
    name: "Burger Deluxe",
    description: "Beef patty, lettuce, tomato, cheese, special sauce",
    price: 11.99,
    category: "Burgers",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
    isAvailable: true,
    isVegetarian: false,
    customizationOptions: [
      {
        name: "Add Bacon",
        price: 2.50,
        isAvailable: true
      },
      {
        name: "Double Patty",
        price: 4.00,
        isAvailable: true
      }
    ]
  },
  {
    _id: "5",
    name: "Pasta Carbonara",
    description: "Spaghetti, bacon, egg, parmesan",
    price: 13.99,
    category: "Pasta",
    image: "https://images.unsplash.com/photo-1612874742237-6526221588e3",
    isAvailable: true,
    isVegetarian: false,
    customizationOptions: []
  },
  {
    _id: "6",
    name: "Chicken Wings",
    description: "Crispy wings with buffalo sauce",
    price: 9.99,
    category: "Appetizers",
    image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2",
    isAvailable: true,
    isVegetarian: false,
    customizationOptions: [
      {
        name: "Extra Spicy",
        price: 0,
        isAvailable: true
      }
    ]
  },
  {
    _id: "7",
    name: "Chocolate Cake",
    description: "Rich chocolate cake with chocolate frosting",
    price: 6.99,
    category: "Desserts",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
    isAvailable: true,
    isVegetarian: true,
    customizationOptions: []
  },
  {
    _id: "8",
    name: "Coca Cola",
    description: "Refreshing soft drink",
    price: 2.99,
    category: "Beverages",
    image: "https://images.unsplash.com/photo-1554866585-cd94860890b7",
    isAvailable: true,
    isVegetarian: true,
    customizationOptions: []
  }
];

// Get all menu items
router.get('/items', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockMenuItems
  });
});

// Get menu categories
router.get('/categories', (req: Request, res: Response) => {
  const categories = [...new Set(mockMenuItems.map(item => item.category))];
  res.json({
    success: true,
    data: categories
  });
});

// Get single menu item
router.get('/items/:id', (req: Request, res: Response) => {
  const item = mockMenuItems.find(i => i._id === req.params.id);
  if (item) {
    res.json({
      success: true,
      data: item
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Item not found'
    });
  }
});

export default router;