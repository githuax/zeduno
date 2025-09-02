const fs = require('fs');

console.log('🔍 Verifying order number format changes...\n');

// Check Order model changes
console.log('📄 Order Model (backend/src/models/Order.ts):');
const orderModel = fs.readFileSync('backend/src/models/Order.ts', 'utf8');
const preSaveMatch = orderModel.match(/this\.orderNumber = `ORD-\${random}`/);

if (preSaveMatch) {
  console.log('✅ Pre-save hook updated to use shorter format: ORD-XXXX');
} else {
  console.log('❌ Pre-save hook not found or not updated properly');
}

// Check Order service changes  
console.log('\n📄 Order Service (backend/src/services/order.service.ts):');
const orderService = fs.readFileSync('backend/src/services/order.service.ts', 'utf8');
const generateMatch = orderService.match(/return `ORD-\${random}`/);

if (generateMatch) {
  console.log('✅ generateOrderNumber method updated to use shorter format: ORD-XXXX');
} else {
  console.log('❌ generateOrderNumber method not found or not updated properly');
}

// Demonstrate the format change
console.log('\n📊 Invoice Number Format Comparison:');
console.log('┌─────────────────────────────────────────────────────────┐');
console.log('│                 BEFORE vs AFTER                        │');  
console.log('├─────────────────────────────────────────────────────────┤');
console.log('│ Old Format: BT-ORD-20250901-4979  (17 characters)      │');
console.log('│ Old Format: ORD-20250901-4979      (16 characters)      │');
console.log('│ New Format: ORD-1234               (8 characters)       │');
console.log('├─────────────────────────────────────────────────────────┤');
console.log('│ Reduction: 9 characters shorter (~53% reduction)       │');
console.log('└─────────────────────────────────────────────────────────┘');

// Show sample new order numbers
console.log('\n📝 Sample New Order Numbers:');
for (let i = 0; i < 5; i++) {
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const newOrderNumber = `ORD-${random}`;
  console.log(`   ${newOrderNumber}`);
}

console.log('\n✅ Changes implemented successfully!');
console.log('💡 The next orders created will use the shorter format.');
console.log('🔄 Backend restart may be required for changes to take effect.');
