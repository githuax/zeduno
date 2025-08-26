const mongoose = require('mongoose');
require('dotenv').config();

async function checkOrderCurrency() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    // Define Order schema
    const orderSchema = new mongoose.Schema({
      orderNumber: String,
      customerName: String,
      items: Array,
      subtotal: Number,
      tax: Number,
      serviceCharge: Number,
      total: Number,
      tenantId: mongoose.Schema.Types.ObjectId
    }, { strict: false });
    
    const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
    
    // Get the specific order
    const order = await Order.findOne({ orderNumber: 'ORD-20250821-1719' }).lean();
    
    if (order) {
      console.log('\n=== ORDER DETAILS ===');
      console.log(`Order Number: ${order.orderNumber}`);
      console.log(`Customer: ${order.customerName}`);
      console.log(`Tenant ID: ${order.tenantId}`);
      console.log('');
      
      console.log('PRICING BREAKDOWN:');
      console.log(`Subtotal: ${order.subtotal} (raw value)`);
      console.log(`Tax (18%): ${order.tax} (raw value)`);
      console.log(`Service Charge: ${order.serviceCharge} (raw value)`);
      console.log(`TOTAL: ${order.total} (raw value)`);
      console.log('');
      
      console.log('ITEMS:');
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
          console.log(`  ${index + 1}. Quantity: ${item.quantity}`);
          console.log(`     Price per item: ${item.price} (raw value)`);
          console.log(`     Total for item: ${item.price * item.quantity} (raw value)`);
        });
      }
      
      // Calculate what the totals should be in KES
      console.log('\n=== CURRENCY ANALYSIS ===');
      if (order.items && order.items.length > 0) {
        let calculatedSubtotal = 0;
        order.items.forEach(item => {
          calculatedSubtotal += item.price * item.quantity;
        });
        
        const calculatedTax = calculatedSubtotal * 0.18;
        const calculatedServiceCharge = calculatedSubtotal * 0.1; // Assuming dine-in
        const calculatedTotal = calculatedSubtotal + calculatedTax + calculatedServiceCharge;
        
        console.log('Calculated values:');
        console.log(`  Subtotal: ${calculatedSubtotal} KES`);
        console.log(`  Tax: ${calculatedTax} KES`);
        console.log(`  Service Charge: ${calculatedServiceCharge} KES`);
        console.log(`  Total: ${calculatedTotal} KES`);
        
        console.log('\nDatabase vs Calculated:');
        console.log(`  Subtotal: ${order.subtotal} vs ${calculatedSubtotal} ${order.subtotal === calculatedSubtotal ? '✅' : '❌'}`);
        console.log(`  Total: ${order.total} vs ${calculatedTotal} ${order.total === calculatedTotal ? '✅' : '❌'}`);
      }
      
    } else {
      console.log('Order not found');
    }
    
    // Also check what tenant currency is set to
    const tenantSchema = new mongoose.Schema({
      name: String,
      settings: { currency: String }
    }, { strict: false });
    const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
    
    const tenant = await Tenant.findById(order?.tenantId);
    if (tenant) {
      console.log(`\nTenant: ${tenant.name}`);
      console.log(`Currency Setting: ${tenant.settings?.currency || 'Not set'}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkOrderCurrency();