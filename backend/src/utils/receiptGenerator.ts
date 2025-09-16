import { IOrder } from '../models/Order';
import { IPaymentTransaction } from '../models/PaymentTransaction';
import { ITenant } from '../models/Tenant';

export interface ReceiptData {
  tenant: ITenant;
  order: IOrder;
  paymentTransaction: IPaymentTransaction;
  receiptNumber: string;
  timestamp: Date;
}

export interface PrintableReceipt {
  receiptNumber: string;
  timestamp: Date;
  businessInfo: {
    name: string;
    address?: string;
    phone?: string;
    email: string;
  };
  customerInfo: {
    name?: string;
    phone?: string;
  };
  orderInfo: {
    orderNumber: string;
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    subtotal: number;
    tax?: number;
    serviceCharge?: number;
    discount?: number;
    total: number;
  };
  paymentInfo: {
    method: string;
    amount: number;
    currency: string;
    reference?: string;
    mpesaReceipt?: string;
    transactionId: string;
  };
  footer: {
    message?: string;
    thankYouNote: string;
    supportContact?: string;
  };
}

export class ReceiptGenerator {
  private static generateReceiptNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RCP${timestamp}${random}`;
  }

  public static generateReceipt(data: ReceiptData): PrintableReceipt {
    const { tenant, order, paymentTransaction } = data;

    // Calculate totals
    const subtotal = order.subtotal;
    const tax = order.tax || 0;
    const serviceCharge = order.serviceCharge || 0;
    const discount = order.discount ? (order.discount.type === 'fixed' ? order.discount.value : (subtotal * order.discount.value / 100)) : 0;
    const total = order.total;

    // Format items - populate menuItem to get name
    const items = order.items.map(item => ({
      name: 'Menu Item', // Will need to populate this from menuItem reference
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.price * item.quantity,
    }));

    // Determine payment method display name
    let paymentMethodDisplay: string = paymentTransaction.paymentMethod;
    switch (paymentTransaction.paymentMethod) {
      case 'mpesa':
        paymentMethodDisplay = 'M-Pesa';
        break;
      case 'stripe':
        paymentMethodDisplay = 'Credit/Debit Card';
        break;
      case 'square':
        paymentMethodDisplay = 'Square';
        break;
      case 'cash':
        paymentMethodDisplay = 'Cash';
        break;
    }

    return {
      receiptNumber: data.receiptNumber,
      timestamp: data.timestamp,
      businessInfo: {
        name: tenant.name,
        address: tenant.address,
        phone: tenant.phone,
        email: tenant.email,
      },
      customerInfo: {
        name: paymentTransaction.customerName || order.customerName || 'Walk-in Customer',
        phone: paymentTransaction.customerPhone,
      },
      orderInfo: {
        orderNumber: order.orderNumber || order._id.toString(),
        items,
        subtotal,
        tax,
        serviceCharge,
        discount,
        total,
      },
      paymentInfo: {
        method: paymentMethodDisplay,
        amount: paymentTransaction.amount,
        currency: paymentTransaction.currency,
        reference: paymentTransaction.gatewayTransactionId,
        mpesaReceipt: paymentTransaction.mpesaData?.mpesaReceiptNumber,
        transactionId: paymentTransaction._id.toString(),
      },
      footer: {
        message: 'Thank you for your business!',
        thankYouNote: `We appreciate your visit to ${tenant.name}`,
        supportContact: tenant.phone || tenant.email,
      },
    };
  }

  public static generateTextReceipt(receipt: PrintableReceipt): string {
    const lines: string[] = [];
    const width = 40;
    
    // Header
    lines.push('='.repeat(width));
    lines.push(this.centerText(receipt.businessInfo.name.toUpperCase(), width));
    lines.push('='.repeat(width));
    
    if (receipt.businessInfo.address) {
      lines.push(this.centerText(receipt.businessInfo.address, width));
    }
    if (receipt.businessInfo.phone) {
      lines.push(this.centerText(`Tel: ${receipt.businessInfo.phone}`, width));
    }
    lines.push(this.centerText(receipt.businessInfo.email, width));
    lines.push('');
    
    // Receipt info
    lines.push(`Receipt No: ${receipt.receiptNumber}`);
    lines.push(`Date: ${receipt.timestamp.toLocaleDateString()}`);
    lines.push(`Time: ${receipt.timestamp.toLocaleTimeString()}`);
    lines.push(`Order: ${receipt.orderInfo.orderNumber}`);
    
    if (receipt.customerInfo.name) {
      lines.push(`Customer: ${receipt.customerInfo.name}`);
    }
    if (receipt.customerInfo.phone) {
      lines.push(`Phone: ${receipt.customerInfo.phone}`);
    }
    
    lines.push('-'.repeat(width));
    
    // Items
    lines.push('ITEMS:');
    receipt.orderInfo.items.forEach(item => {
      const itemLine = `${item.quantity}x ${item.name}`;
      const priceLine = `${receipt.paymentInfo.currency} ${item.totalPrice.toFixed(2)}`;
      lines.push(this.formatLine(itemLine, priceLine, width));
      
      if (item.quantity > 1) {
        const unitPriceLine = `  @ ${receipt.paymentInfo.currency} ${item.unitPrice.toFixed(2)} each`;
        lines.push(unitPriceLine);
      }
    });
    
    lines.push('-'.repeat(width));
    
    // Totals
    const currency = receipt.paymentInfo.currency;
    lines.push(this.formatLine('Subtotal:', `${currency} ${receipt.orderInfo.subtotal.toFixed(2)}`, width));
    
    if (receipt.orderInfo.tax && receipt.orderInfo.tax > 0) {
      lines.push(this.formatLine('Tax:', `${currency} ${receipt.orderInfo.tax.toFixed(2)}`, width));
    }
    
    if (receipt.orderInfo.serviceCharge && receipt.orderInfo.serviceCharge > 0) {
      lines.push(this.formatLine('Service Charge:', `${currency} ${receipt.orderInfo.serviceCharge.toFixed(2)}`, width));
    }
    
    if (receipt.orderInfo.discount && receipt.orderInfo.discount > 0) {
      lines.push(this.formatLine('Discount:', `-${currency} ${receipt.orderInfo.discount.toFixed(2)}`, width));
    }
    
    lines.push('='.repeat(width));
    lines.push(this.formatLine('TOTAL:', `${currency} ${receipt.orderInfo.total.toFixed(2)}`, width));
    lines.push('='.repeat(width));
    
    // Payment info
    lines.push('');
    lines.push('PAYMENT DETAILS:');
    lines.push(`Method: ${receipt.paymentInfo.method}`);
    lines.push(`Amount Paid: ${currency} ${receipt.paymentInfo.amount.toFixed(2)}`);
    
    if (receipt.paymentInfo.mpesaReceipt) {
      lines.push(`M-Pesa Receipt: ${receipt.paymentInfo.mpesaReceipt}`);
    }
    
    if (receipt.paymentInfo.reference) {
      lines.push(`Reference: ${receipt.paymentInfo.reference}`);
    }
    
    lines.push(`Transaction ID: ${receipt.paymentInfo.transactionId}`);
    
    // Footer
    lines.push('');
    lines.push('-'.repeat(width));
    lines.push(this.centerText(receipt.footer.thankYouNote, width));
    if (receipt.footer.message) {
      lines.push(this.centerText(receipt.footer.message, width));
    }
    if (receipt.footer.supportContact) {
      lines.push(this.centerText(`Support: ${receipt.footer.supportContact}`, width));
    }
    lines.push('-'.repeat(width));
    
    return lines.join('\n');
  }

  public static generateHTMLReceipt(receipt: PrintableReceipt): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receipt - ${receipt.receiptNumber}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .receipt {
          max-width: 300px;
          margin: 0 auto;
          background: white;
          padding: 20px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .business-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .business-info {
          font-size: 12px;
          margin-bottom: 2px;
        }
        .receipt-info {
          font-size: 12px;
          margin-bottom: 15px;
        }
        .receipt-info div {
          margin-bottom: 2px;
        }
        .items {
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 10px 0;
          margin: 15px 0;
        }
        .item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 12px;
        }
        .item-details {
          flex-grow: 1;
        }
        .item-price {
          font-weight: bold;
        }
        .totals {
          font-size: 12px;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .final-total {
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 5px 0;
          font-weight: bold;
          font-size: 14px;
        }
        .payment-info {
          margin: 15px 0;
          padding: 10px 0;
          border-top: 1px solid #000;
          font-size: 12px;
        }
        .payment-line {
          margin-bottom: 3px;
        }
        .footer {
          text-align: center;
          font-size: 11px;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #000;
        }
        @media print {
          body {
            background-color: white;
            padding: 0;
          }
          .receipt {
            box-shadow: none;
            max-width: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="business-name">${receipt.businessInfo.name}</div>
          ${receipt.businessInfo.address ? `<div class="business-info">${receipt.businessInfo.address}</div>` : ''}
          ${receipt.businessInfo.phone ? `<div class="business-info">Tel: ${receipt.businessInfo.phone}</div>` : ''}
          <div class="business-info">${receipt.businessInfo.email}</div>
        </div>

        <div class="receipt-info">
          <div><strong>Receipt No:</strong> ${receipt.receiptNumber}</div>
          <div><strong>Date:</strong> ${receipt.timestamp.toLocaleDateString()}</div>
          <div><strong>Time:</strong> ${receipt.timestamp.toLocaleTimeString()}</div>
          <div><strong>Order:</strong> ${receipt.orderInfo.orderNumber}</div>
          ${receipt.customerInfo.name ? `<div><strong>Customer:</strong> ${receipt.customerInfo.name}</div>` : ''}
          ${receipt.customerInfo.phone ? `<div><strong>Phone:</strong> ${receipt.customerInfo.phone}</div>` : ''}
        </div>

        <div class="items">
          <div style="font-weight: bold; margin-bottom: 10px;">ITEMS:</div>
          ${receipt.orderInfo.items.map(item => `
            <div class="item">
              <div class="item-details">
                ${item.quantity}x ${item.name}
                ${item.quantity > 1 ? `<br><small>@ ${receipt.paymentInfo.currency} ${item.unitPrice.toFixed(2)} each</small>` : ''}
              </div>
              <div class="item-price">${receipt.paymentInfo.currency} ${item.totalPrice.toFixed(2)}</div>
            </div>
          `).join('')}
        </div>

        <div class="totals">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>${receipt.paymentInfo.currency} ${receipt.orderInfo.subtotal.toFixed(2)}</span>
          </div>
          ${receipt.orderInfo.tax && receipt.orderInfo.tax > 0 ? `
            <div class="total-line">
              <span>Tax:</span>
              <span>${receipt.paymentInfo.currency} ${receipt.orderInfo.tax.toFixed(2)}</span>
            </div>
          ` : ''}
          ${receipt.orderInfo.serviceCharge && receipt.orderInfo.serviceCharge > 0 ? `
            <div class="total-line">
              <span>Service Charge:</span>
              <span>${receipt.paymentInfo.currency} ${receipt.orderInfo.serviceCharge.toFixed(2)}</span>
            </div>
          ` : ''}
          ${receipt.orderInfo.discount && receipt.orderInfo.discount > 0 ? `
            <div class="total-line">
              <span>Discount:</span>
              <span>-${receipt.paymentInfo.currency} ${receipt.orderInfo.discount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div class="total-line final-total">
            <span>TOTAL:</span>
            <span>${receipt.paymentInfo.currency} ${receipt.orderInfo.total.toFixed(2)}</span>
          </div>
        </div>

        <div class="payment-info">
          <div style="font-weight: bold; margin-bottom: 8px;">PAYMENT DETAILS:</div>
          <div class="payment-line"><strong>Method:</strong> ${receipt.paymentInfo.method}</div>
          <div class="payment-line"><strong>Amount Paid:</strong> ${receipt.paymentInfo.currency} ${receipt.paymentInfo.amount.toFixed(2)}</div>
          ${receipt.paymentInfo.mpesaReceipt ? `<div class="payment-line"><strong>M-Pesa Receipt:</strong> ${receipt.paymentInfo.mpesaReceipt}</div>` : ''}
          ${receipt.paymentInfo.reference ? `<div class="payment-line"><strong>Reference:</strong> ${receipt.paymentInfo.reference}</div>` : ''}
          <div class="payment-line"><strong>Transaction ID:</strong> ${receipt.paymentInfo.transactionId}</div>
        </div>

        <div class="footer">
          <div>${receipt.footer.thankYouNote}</div>
          ${receipt.footer.message ? `<div>${receipt.footer.message}</div>` : ''}
          ${receipt.footer.supportContact ? `<div>Support: ${receipt.footer.supportContact}</div>` : ''}
        </div>
      </div>

      <script>
        // Auto-print on load for receipt printers
        window.addEventListener('load', function() {
          // Uncomment the next line to auto-print
          // window.print();
        });
      </script>
    </body>
    </html>
    `;
  }

  private static centerText(text: string, width: number): string {
    const padding = Math.max(0, width - text.length);
    const leftPadding = Math.floor(padding / 2);
    return ' '.repeat(leftPadding) + text;
  }

  private static formatLine(left: string, right: string, width: number): string {
    const maxLeftWidth = width - right.length - 1;
    const truncatedLeft = left.length > maxLeftWidth ? left.substring(0, maxLeftWidth - 3) + '...' : left;
    const padding = width - truncatedLeft.length - right.length;
    return truncatedLeft + ' '.repeat(Math.max(1, padding)) + right;
  }

  public static async createReceiptForOrder(
    orderId: string,
    paymentTransactionId: string
  ): Promise<PrintableReceipt> {
    // This would typically fetch the data from database
    // For now, returning a placeholder implementation
    throw new Error('This method should be implemented to fetch order, tenant, and payment data from database');
  }
}

export default ReceiptGenerator;