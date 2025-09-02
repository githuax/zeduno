/**
 * Quick Frontend API Fix
 * Add this to your M-Pesa payment component to bypass proxy issues
 */

// Option 1: Direct API configuration (for testing)
const API_BASE_URL = 'http://192.168.2.43:5000/api';

// Option 2: Environment-based configuration
const getApiUrl = () => {
  if (window.location.hostname === '192.168.2.43') {
    return 'http://192.168.2.43:5000/api';
  }
  return '/api'; // Use proxy for other environments
};

// Replace your fetch call in MPesaPaymentDialog.tsx:
/*
// OLD (causing 400 error):
const response = await fetch('/api/payments/mpesa/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  },
  body: JSON.stringify({
    orderId: orderData.id,
    phoneNumber: formattedPhone,
    amount: orderData.amount,
  }),
});

// NEW (fixed):
const response = await fetch(`${getApiUrl()}/payments/mpesa/initiate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  },
  body: JSON.stringify({
    orderId: orderData.id,
    phoneNumber: formattedPhone,
    amount: orderData.amount,
  }),
});
*/

console.log('Use this API URL in your frontend:', getApiUrl());
