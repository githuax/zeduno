import { Order } from '@/types/order.types';

export const printOrderReceipt = (order: Order) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const currentItems = order.items;
  const printContent = generateReceiptContent(order, currentItems);
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
  printWindow.close();
};

const generateReceiptContent = (order: Order, items: any[]) => {
  const now = new Date().toLocaleString();
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.18;
  const serviceCharge = order.orderType === 'dine-in' ? subtotal * 0.1 : 0;
  const total = subtotal + tax + serviceCharge - (order.discount || 0);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Order Receipt - ${order.orderNumber}</title>
      <style>
        @page { margin: 0.5in; size: A4; }
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 12px; 
          line-height: 1.4;
          margin: 0;
          padding: 20px;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #000; 
          padding-bottom: 10px; 
          margin-bottom: 15px; 
        }
        .restaurant-name { 
          font-size: 18px; 
          font-weight: bold; 
          margin-bottom: 5px; 
        }
        .order-info { 
          margin-bottom: 15px; 
          border-bottom: 1px dashed #000; 
          padding-bottom: 10px; 
        }
        .order-info div { 
          display: flex; 
          justify-content: space-between; 
          margin: 2px 0; 
        }
        .items { 
          margin-bottom: 15px; 
        }
        .item { 
          display: flex; 
          justify-content: space-between; 
          margin: 3px 0; 
          padding: 2px 0;
        }
        .item-details { 
          flex: 1; 
        }
        .item-price { 
          text-align: right; 
          min-width: 80px; 
        }
        .customizations { 
          font-size: 10px; 
          color: #666; 
          margin-left: 10px; 
        }
        .instructions { 
          font-size: 10px; 
          font-style: italic; 
          color: #666; 
          margin-left: 10px; 
        }
        .totals { 
          border-top: 1px dashed #000; 
          padding-top: 10px; 
          margin-top: 15px; 
        }
        .total-line { 
          display: flex; 
          justify-content: space-between; 
          margin: 2px 0; 
        }
        .total-final { 
          font-weight: bold; 
          font-size: 14px; 
          border-top: 1px solid #000; 
          padding-top: 5px; 
          margin-top: 5px; 
        }
        .footer { 
          text-align: center; 
          margin-top: 20px; 
          font-size: 10px; 
          color: #666; 
        }
        @media print {
          body { margin: 0; padding: 10px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="restaurant-name">Restaurant Receipt</div>
        <div>Order #${order.orderNumber}</div>
        <div>${now}</div>
      </div>

      <div class="order-info">
        <div><span>Order Type:</span> <span>${order.orderType.toUpperCase()}</span></div>
        <div><span>Customer:</span> <span>${order.customerName}</span></div>
        ${order.customerPhone ? `<div><span>Phone:</span> <span>${order.customerPhone}</span></div>` : ''}
        ${order.orderType === 'dine-in' && order.tableId ? 
          `<div><span>Table:</span> <span>${typeof order.tableId === 'object' ? (order.tableId as any).tableNumber : order.tableId}</span></div>` : ''}
        <div><span>Status:</span> <span>${order.status.toUpperCase()}</span></div>
        <div><span>Payment:</span> <span>${order.paymentStatus.toUpperCase()}</span></div>
      </div>

      <div class="items">
        <div style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px;">
          ORDER ITEMS
        </div>
        ${items.map(item => `
          <div class="item">
            <div class="item-details">
              <div>${item.quantity}x ${typeof item.menuItem === 'object' ? item.menuItem.name : 'Item'}</div>
              ${item.customizations && item.customizations.length > 0 ? 
                `<div class="customizations">+ ${item.customizations.map((c: any) => c.option).join(', ')}</div>` : ''}
              ${item.specialInstructions ? 
                `<div class="instructions">Note: ${item.specialInstructions}</div>` : ''}
            </div>
            <div class="item-price">KES ${(item.price * item.quantity).toFixed(2)}</div>
          </div>
        `).join('')}
      </div>

      <div class="totals">
        <div class="total-line">
          <span>Subtotal:</span>
          <span>KES ${subtotal.toFixed(2)}</span>
        </div>
        <div class="total-line">
          <span>Tax (18%):</span>
          <span>KES ${tax.toFixed(2)}</span>
        </div>
        ${serviceCharge > 0 ? `
        <div class="total-line">
          <span>Service Charge (10%):</span>
          <span>KES ${serviceCharge.toFixed(2)}</span>
        </div>` : ''}
        ${order.discount && order.discount > 0 ? `
        <div class="total-line">
          <span>Discount:</span>
          <span>-KES ${order.discount.toFixed(2)}</span>
        </div>` : ''}
        <div class="total-line total-final">
          <span>TOTAL:</span>
          <span>KES ${order.total.toFixed(2)}</span>
        </div>
      </div>

      ${order.notes ? `
      <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #000;">
        <div style="font-weight: bold;">Order Notes:</div>
        <div style="margin-top: 5px;">${order.notes}</div>
      </div>` : ''}

      <div class="footer">
        <div>Thank you for your order!</div>
        <div>Visit us again soon!</div>
        <div>Printed: ${now}</div>
      </div>
    </body>
    </html>
  `;
};