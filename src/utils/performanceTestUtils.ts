// Performance testing utilities for React components
import { Order } from '@/types/order.types';

// Generate mock orders for performance testing
export const generateMockOrders = (count: number): Order[] => {
  const orderTypes: ('dine-in' | 'takeaway' | 'delivery')[] = ['dine-in', 'takeaway', 'delivery'];
  const statuses: ('pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled')[] = 
    ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
  const paymentStatuses: ('paid' | 'pending' | 'failed')[] = ['paid', 'pending', 'failed'];

  return Array.from({ length: count }, (_, i) => ({
    _id: `order_${i}`,
    orderNumber: `ORD-${String(i).padStart(6, '0')}`,
    customerName: `Customer ${i}`,
    orderType: orderTypes[i % orderTypes.length],
    status: statuses[i % statuses.length],
    paymentStatus: paymentStatuses[i % paymentStatuses.length],
    total: Math.floor(Math.random() * 10000) + 1000, // 1000-11000 cents
    items: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, j) => ({
      _id: `item_${i}_${j}`,
      menuItemId: `menu_${j}`,
      quantity: Math.floor(Math.random() * 3) + 1,
      price: Math.floor(Math.random() * 2000) + 500,
      notes: `Notes for item ${j}`,
    })),
    tableId: orderTypes[i % orderTypes.length] === 'dine-in' ? {
      _id: `table_${i % 20}`,
      tableNumber: i % 20 + 1,
    } : null,
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tenantId: 'test_tenant',
    branchId: 'test_branch',
  }));
};

// Generate mock ingredients for performance testing
export const generateMockIngredients = (count: number) => {
  const categories = ['vegetables', 'fruits', 'meat', 'seafood', 'dairy', 'grains', 'spices', 'beverages', 'condiments', 'other'];
  const units = ['kg', 'g', 'l', 'ml', 'piece', 'dozen', 'box', 'pack', 'bottle', 'can'];
  const locations = ['Freezer A', 'Freezer B', 'Pantry 1', 'Pantry 2', 'Cold Storage', 'Dry Storage'];

  return Array.from({ length: count }, (_, i) => ({
    _id: `ingredient_${i}`,
    name: `Ingredient ${i}`,
    unit: units[i % units.length],
    currentStock: Math.floor(Math.random() * 100) + 10,
    minStockLevel: Math.floor(Math.random() * 20) + 5,
    maxStockLevel: Math.floor(Math.random() * 200) + 100,
    reorderPoint: Math.floor(Math.random() * 30) + 10,
    reorderQuantity: Math.floor(Math.random() * 50) + 20,
    cost: Math.floor(Math.random() * 1000) + 100, // 100-1100 cents
    category: categories[i % categories.length],
    expiryDate: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    location: locations[i % locations.length],
    isPerishable: Math.random() > 0.5,
    lastRestockedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastUsedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

// Performance measurement functions
export const measureComponentRenderTime = (componentName: string, renderFn: () => void) => {
  const startTime = performance.now();
  performance.mark(`${componentName}-start`);
  
  renderFn();
  
  performance.mark(`${componentName}-end`);
  const endTime = performance.now();
  
  performance.measure(
    `${componentName}-render`,
    `${componentName}-start`,
    `${componentName}-end`
  );
  
  const renderTime = endTime - startTime;
  console.log(`🚀 ${componentName} render time: ${renderTime.toFixed(2)}ms`);
  
  return renderTime;
};

// Memory usage measurement
export const measureMemoryUsage = () => {
  if ((performance as any).memory) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedMB: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
      totalMB: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
    };
  }
  return null;
};

// Performance test scenarios
export const performanceTestScenarios = {
  smallDataset: {
    orders: 25,
    ingredients: 50,
    description: 'Small dataset - should use regular rendering',
  },
  mediumDataset: {
    orders: 100,
    ingredients: 200,
    description: 'Medium dataset - virtualization threshold',
  },
  largeDataset: {
    orders: 500,
    ingredients: 1000,
    description: 'Large dataset - virtualization essential',
  },
  veryLargeDataset: {
    orders: 2000,
    ingredients: 5000,
    description: 'Very large dataset - stress test',
  },
};

// Benchmark comparison
export const runPerformanceBenchmark = async (
  testName: string,
  testFn: () => Promise<void> | void,
  iterations = 5
) => {
  const results: number[] = [];
  
  console.group(`📊 Performance Benchmark: ${testName}`);
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    await testFn();
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    results.push(duration);
    console.log(`Run ${i + 1}: ${duration.toFixed(2)}ms`);
  }
  
  const average = results.reduce((a, b) => a + b, 0) / results.length;
  const min = Math.min(...results);
  const max = Math.max(...results);
  
  console.log(`📈 Average: ${average.toFixed(2)}ms`);
  console.log(`⚡ Best: ${min.toFixed(2)}ms`);
  console.log(`🐌 Worst: ${max.toFixed(2)}ms`);
  console.groupEnd();
  
  return { average, min, max, results };
};

// Performance assertions
export const assertPerformance = (
  actualTime: number,
  expectedMaxTime: number,
  testName: string
) => {
  if (actualTime > expectedMaxTime) {
    console.warn(
      `⚠️ Performance Warning: ${testName} took ${actualTime.toFixed(2)}ms (expected < ${expectedMaxTime}ms)`
    );
    return false;
  } else {
    console.log(
      `✅ Performance OK: ${testName} took ${actualTime.toFixed(2)}ms (< ${expectedMaxTime}ms)`
    );
    return true;
  }
};

// Development mode performance logger
export const logPerformanceMetrics = (componentName: string, metrics: any) => {
  if (process.env.NODE_ENV === 'development' && metrics) {
    console.group(`🔍 ${componentName} Performance Metrics`);
    console.log(`🔄 Renders: ${metrics.rerenderCount}`);
    console.log(`⏱️ Last Render: ${metrics.renderTime.toFixed(2)}ms`);
    if (metrics.memoryUsage) {
      console.log(`💾 Memory: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }
    console.groupEnd();
  }
};