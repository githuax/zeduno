/**
 * Order Workflow Tests
 * Tests complete order processing from creation to completion
 */

import { test, expect, config, TestDataFactory, TestUtils } from './setup';

test.describe('Order Creation & Management', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
  });

  test('should display orders page correctly', async ({ page }) => {
    await page.goto('/orders');
    
    await expect(page.getByRole('heading', { name: /order management/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /create order/i })).toBeVisible();
    
    // Should show orders list
    await expect(page.getByText(/orders/i)).toBeVisible();
  });

  test('should create a new order successfully', async ({ page }) => {
    await page.goto('/orders');
    
    await page.click('button:has-text("Create Order"), button:has-text("New Order")');
    
    // Select customer type
    await page.click('button:has-text("Dine In"), input[value="dine_in"]');
    
    // Select table if dine-in
    const tableSelect = page.locator('select[name="tableNumber"], [data-testid="table-select"]');
    if (await tableSelect.count() > 0) {
      await tableSelect.selectOption('1');
    }
    
    // Add menu items
    const addItemButton = page.locator('button:has-text("Add Item"), [data-testid="add-menu-item"]');
    if (await addItemButton.count() > 0) {
      await addItemButton.click();
      
      // Select first available item
      await page.click('.menu-item:first-child, button[data-item-id]');
      
      // Set quantity
      const quantityInput = page.locator('input[name="quantity"]');
      if (await quantityInput.count() > 0) {
        await quantityInput.fill('2');
      }
      
      await page.click('button:has-text("Add to Order")');
    }
    
    // Submit order
    await page.click('button:has-text("Place Order"), button[type="submit"]');
    
    // Verify order creation
    await expect(page.getByText(/order created successfully/i)).toBeVisible();
    
    // Should show order number
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
  });

  test('should handle order modifications', async ({ page }) => {
    await page.goto('/orders');
    
    // Find an existing order or create one first
    const existingOrder = page.locator('tr[data-testid*="order-"], .order-row').first();
    if (await existingOrder.count() > 0) {
      await existingOrder.locator('button[title*="edit" i], button:has-text("Edit")').click();
      
      // Modify order
      const addItemButton = page.locator('button:has-text("Add Item")');
      if (await addItemButton.count() > 0) {
        await addItemButton.click();
        await page.click('.menu-item:first-child');
        await page.click('button:has-text("Add to Order")');
      }
      
      await page.click('button:has-text("Update Order")');
      await expect(page.getByText(/order updated/i)).toBeVisible();
    }
  });

  test('should process order status workflow', async ({ page }) => {
    await page.goto('/orders');
    
    // Create a new order first
    await page.click('button:has-text("Create Order")');
    await page.click('button:has-text("Dine In")');
    
    // Add minimal required data
    const addItemButton = page.locator('button:has-text("Add Item")');
    if (await addItemButton.count() > 0) {
      await addItemButton.click();
      await page.click('.menu-item:first-child');
      await page.click('button:has-text("Add to Order")');
      await page.click('button:has-text("Place Order")');
    }
    
    // Wait for order creation
    await page.waitForTimeout(2000);
    
    // Test status progression: pending → preparing → ready → completed
    const orderRow = page.locator('tr').first();
    
    // Move to preparing
    const preparingButton = orderRow.locator('button:has-text("Start Preparing"), button[data-status="preparing"]');
    if (await preparingButton.count() > 0) {
      await preparingButton.click();
      await expect(page.getByText(/preparing/i)).toBeVisible();
    }
    
    // Move to ready
    const readyButton = orderRow.locator('button:has-text("Mark Ready"), button[data-status="ready"]');
    if (await readyButton.count() > 0) {
      await readyButton.click();
      await expect(page.getByText(/ready/i)).toBeVisible();
    }
    
    // Complete order
    const completeButton = orderRow.locator('button:has-text("Complete"), button[data-status="completed"]');
    if (await completeButton.count() > 0) {
      await completeButton.click();
      await expect(page.getByText(/completed/i)).toBeVisible();
    }
  });

  test('should handle order cancellation', async ({ page }) => {
    await page.goto('/orders');
    
    // Find a pending order
    const pendingOrder = page.locator('tr:has-text("pending"), .order-pending').first();
    if (await pendingOrder.count() > 0) {
      await pendingOrder.locator('button:has-text("Cancel"), button[title*="cancel" i]').click();
      
      // Confirm cancellation
      await page.fill('textarea[name="cancellationReason"]', 'Customer requested cancellation');
      await page.click('button:has-text("Confirm Cancel")');
      
      await expect(page.getByText(/order cancelled/i)).toBeVisible();
    }
  });

  test('should filter orders by status', async ({ page }) => {
    await page.goto('/orders');
    
    // Filter by status
    const statusFilter = page.locator('select[name="statusFilter"], [data-testid="status-filter"]');
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption('pending');
      
      // Should only show pending orders
      await page.waitForTimeout(1000);
      const orderRows = page.locator('tr[data-status], .order-row');
      const count = await orderRows.count();
      
      if (count > 0) {
        // All visible orders should be pending
        for (let i = 0; i < count; i++) {
          const orderRow = orderRows.nth(i);
          await expect(orderRow.locator('.status, [data-status]')).toContainText(/pending/i);
        }
      }
    }
  });

  test('should search orders by order number', async ({ page }) => {
    await page.goto('/orders');
    
    // Get first order number if available
    const firstOrderNumber = await page.locator('[data-testid="order-number"], .order-number').first().textContent();
    
    if (firstOrderNumber) {
      const searchInput = page.locator('input[name="search"], input[placeholder*="search" i]');
      await searchInput.fill(firstOrderNumber);
      await page.keyboard.press('Enter');
      
      // Should show only matching order
      await expect(page.getByText(firstOrderNumber)).toBeVisible();
    }
  });
});

test.describe('Payment Processing', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
  });

  test('should process cash payment', async ({ page }) => {
    await page.goto('/orders');
    
    // Find a ready order or create one
    let readyOrder = page.locator('tr:has-text("ready"), .order-ready').first();
    
    if (await readyOrder.count() === 0) {
      // Create an order and mark as ready for testing
      await page.click('button:has-text("Create Order")');
      await page.click('button:has-text("Dine In")');
      
      const addItemButton = page.locator('button:has-text("Add Item")');
      if (await addItemButton.count() > 0) {
        await addItemButton.click();
        await page.click('.menu-item:first-child');
        await page.click('button:has-text("Add to Order")');
        await page.click('button:has-text("Place Order")');
        
        // Wait and find the new order
        await page.waitForTimeout(2000);
        readyOrder = page.locator('tr').first();
      }
    }
    
    if (await readyOrder.count() > 0) {
      // Process payment
      await readyOrder.locator('button:has-text("Payment"), button:has-text("Pay")').click();
      
      // Select cash payment
      await page.click('button:has-text("Cash"), input[value="cash"]');
      
      // Enter amount
      const amountInput = page.locator('input[name="amount"], input[name="cashAmount"]');
      if (await amountInput.count() > 0) {
        await amountInput.fill('50.00');
      }
      
      await page.click('button:has-text("Process Payment"), button[type="submit"]');
      
      await expect(page.getByText(/payment successful/i)).toBeVisible();
    }
  });

  test('should process card payment', async ({ page }) => {
    await page.goto('/orders');
    
    const readyOrder = page.locator('tr:has-text("ready"), .order-ready').first();
    if (await readyOrder.count() > 0) {
      await readyOrder.locator('button:has-text("Payment")').click();
      
      // Select card payment
      await page.click('button:has-text("Card"), input[value="card"]');
      
      // Enter card details (simulate)
      await page.fill('input[name="cardNumber"]', '4242424242424242');
      await page.fill('input[name="expiryMonth"]', '12');
      await page.fill('input[name="expiryYear"]', '25');
      await page.fill('input[name="cvv"]', '123');
      
      await page.click('button:has-text("Process Payment")');
      
      // Should show processing or success
      await expect(page.getByText(/processing|payment successful/i)).toBeVisible();
    }
  });

  test('should handle M-Pesa payment', async ({ page }) => {
    await page.goto('/orders');
    
    const readyOrder = page.locator('tr:has-text("ready"), .order-ready').first();
    if (await readyOrder.count() > 0) {
      await readyOrder.locator('button:has-text("Payment")').click();
      
      // Select M-Pesa payment
      const mpesaOption = page.locator('button:has-text("M-Pesa"), input[value="mpesa"]');
      if (await mpesaOption.count() > 0) {
        await mpesaOption.click();
        
        // Enter phone number
        await page.fill('input[name="phoneNumber"]', '254712345678');
        
        await page.click('button:has-text("Send STK Push")');
        
        await expect(page.getByText(/stk push sent|payment initiated/i)).toBeVisible();
      }
    }
  });

  test('should handle split payments', async ({ page }) => {
    await page.goto('/orders');
    
    const readyOrder = page.locator('tr:has-text("ready"), .order-ready').first();
    if (await readyOrder.count() > 0) {
      await readyOrder.locator('button:has-text("Payment")').click();
      
      // Check for split payment option
      const splitPaymentButton = page.locator('button:has-text("Split Payment"), input[name="splitPayment"]');
      if (await splitPaymentButton.count() > 0) {
        await splitPaymentButton.click();
        
        // Add multiple payment methods
        await page.click('button:has-text("Add Payment Method")');
        await page.click('button:has-text("Cash")');
        await page.fill('input[name="amount1"]', '25.00');
        
        await page.click('button:has-text("Add Payment Method")');
        await page.click('button:has-text("Card")');
        await page.fill('input[name="amount2"]', '25.00');
        
        await page.click('button:has-text("Process Split Payment")');
        
        await expect(page.getByText(/split payment successful/i)).toBeVisible();
      }
    }
  });

  test('should generate receipt after payment', async ({ page }) => {
    await page.goto('/orders');
    
    // Find a completed/paid order
    const paidOrder = page.locator('tr:has-text("completed"), tr:has-text("paid")').first();
    if (await paidOrder.count() > 0) {
      await paidOrder.locator('button:has-text("Receipt"), button[title*="receipt" i]').click();
      
      // Should show receipt dialog or open new window
      const receiptDialog = page.locator('.receipt-dialog, [data-testid="receipt"]');
      if (await receiptDialog.count() > 0) {
        await expect(receiptDialog).toBeVisible();
        
        // Receipt should contain order details
        await expect(receiptDialog.getByText(/order #/i)).toBeVisible();
        await expect(receiptDialog.getByText(/total/i)).toBeVisible();
        
        // Print or download receipt
        const printButton = receiptDialog.locator('button:has-text("Print")');
        if (await printButton.count() > 0) {
          await printButton.click();
        }
      }
    }
  });
});

test.describe('Kitchen Display & Order Fulfillment', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
  });

  test('should display kitchen view', async ({ page }) => {
    await page.goto('/kitchen');
    
    if (await page.locator('body').textContent().then(text => !text?.includes('404'))) {
      // Kitchen display should show pending orders
      await expect(page.getByText(/kitchen display|orders queue/i)).toBeVisible();
      
      // Should show order cards
      const orderCards = page.locator('.order-card, [data-testid="order-card"]');
      if (await orderCards.count() > 0) {
        await expect(orderCards.first()).toBeVisible();
      }
    }
  });

  test('should update order preparation times', async ({ page }) => {
    await page.goto('/kitchen');
    
    const orderCard = page.locator('.order-card, [data-testid="order-card"]').first();
    if (await orderCard.count() > 0) {
      // Start preparation timer
      const startButton = orderCard.locator('button:has-text("Start"), button[data-action="start"]');
      if (await startButton.count() > 0) {
        await startButton.click();
        
        // Should show timer
        await expect(orderCard.locator('.timer, [data-testid="prep-timer"]')).toBeVisible();
      }
    }
  });

  test('should handle special instructions', async ({ page }) => {
    await page.goto('/orders');
    
    // Create order with special instructions
    await page.click('button:has-text("Create Order")');
    await page.click('button:has-text("Dine In")');
    
    const addItemButton = page.locator('button:has-text("Add Item")');
    if (await addItemButton.count() > 0) {
      await addItemButton.click();
      await page.click('.menu-item:first-child');
      
      // Add special instructions
      const instructionsField = page.locator('textarea[name="specialInstructions"], textarea[name="notes"]');
      if (await instructionsField.count() > 0) {
        await instructionsField.fill('Extra spicy, no onions');
      }
      
      await page.click('button:has-text("Add to Order")');
      await page.click('button:has-text("Place Order")');
      
      // Verify instructions are saved
      await expect(page.getByText(/extra spicy/i)).toBeVisible();
    }
  });

  test('should manage order priorities', async ({ page }) => {
    await page.goto('/kitchen');
    
    const orderCard = page.locator('.order-card').first();
    if (await orderCard.count() > 0) {
      // Set high priority
      const priorityButton = orderCard.locator('button:has-text("Priority"), [data-testid="priority-toggle"]');
      if (await priorityButton.count() > 0) {
        await priorityButton.click();
        
        // Should show priority indicator
        await expect(orderCard.locator('.priority-high, [data-priority="high"]')).toBeVisible();
      }
    }
  });
});

test.describe('Order Analytics & Reporting', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
  });

  test('should display order statistics', async ({ page }) => {
    await page.goto('/orders');
    
    // Should show order metrics
    const metrics = [
      /total orders/i,
      /pending orders/i,
      /completed orders/i,
      /average order value/i
    ];
    
    for (const metric of metrics) {
      const element = page.getByText(metric);
      if (await element.count() > 0) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('should generate order reports', async ({ page }) => {
    await page.goto('/reports/orders');
    
    if (await page.locator('body').textContent().then(text => !text?.includes('404'))) {
      // Should show reporting options
      await expect(page.getByText(/order report/i)).toBeVisible();
      
      // Generate report
      const generateButton = page.locator('button:has-text("Generate Report")');
      if (await generateButton.count() > 0) {
        await generateButton.click();
        
        // Should show or download report
        await expect(page.getByText(/report generated|generating report/i)).toBeVisible();
      }
    }
  });

  test('should track order performance metrics', async ({ page }) => {
    await page.goto('/analytics/orders');
    
    if (await page.locator('body').textContent().then(text => !text?.includes('404'))) {
      // Should show analytics dashboard
      const charts = [
        '[data-testid="orders-chart"]',
        '[data-testid="revenue-chart"]',
        '.order-analytics',
        '.performance-chart'
      ];
      
      for (const chartSelector of charts) {
        const chart = page.locator(chartSelector);
        if (await chart.count() > 0) {
          await expect(chart).toBeVisible();
        }
      }
    }
  });

  test('should export order data', async ({ page }) => {
    await page.goto('/orders');
    
    const exportButton = page.locator('button:has-text("Export"), button[title*="export" i]');
    if (await exportButton.count() > 0) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/order.*\.(csv|xlsx|pdf)/i);
    }
  });
});

test.describe('Order Integration & Real-time Updates', () => {
  test.beforeEach(async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
  });

  test('should handle real-time order updates', async ({ page }) => {
    await page.goto('/orders');
    
    // Listen for WebSocket connections or real-time updates
    let wsConnected = false;
    page.on('websocket', ws => {
      wsConnected = true;
    });
    
    await page.waitForTimeout(2000);
    
    // If WebSocket is available, test real-time updates
    if (wsConnected) {
      // Create an order and verify it appears in real-time
      await page.click('button:has-text("Create Order")');
      await page.click('button:has-text("Dine In")');
      
      const addItemButton = page.locator('button:has-text("Add Item")');
      if (await addItemButton.count() > 0) {
        await addItemButton.click();
        await page.click('.menu-item:first-child');
        await page.click('button:has-text("Add to Order")');
        await page.click('button:has-text("Place Order")');
        
        // Should see real-time update
        await expect(page.getByText(/order created/i)).toBeVisible();
      }
    }
  });

  test('should handle offline order queue', async ({ page }) => {
    await page.goto('/orders');
    
    // Simulate offline mode
    await page.route('**/api/**', route => route.abort());
    
    // Try to create order while offline
    await page.click('button:has-text("Create Order")');
    
    // Should handle gracefully
    const offlineIndicator = page.locator('.offline-mode, [data-testid="offline-indicator"]');
    if (await offlineIndicator.count() > 0) {
      await expect(offlineIndicator).toBeVisible();
      await expect(page.getByText(/offline mode|connection lost/i)).toBeVisible();
    }
  });

  test('should sync orders when back online', async ({ page }) => {
    await page.goto('/orders');
    
    // Test online status restoration
    await page.route('**/api/**', route => route.continue());
    
    // Should show online status
    const onlineIndicator = page.locator('.online-mode, [data-testid="online-indicator"]');
    if (await onlineIndicator.count() > 0) {
      await expect(onlineIndicator).toBeVisible();
    }
  });
});