import mongoose from 'mongoose';

import { EmailTemplate } from '../models/EmailTemplate';
require('dotenv').config();

const defaultTemplates = [
  {
    name: 'Welcome User',
    slug: 'welcome-user',
    subject: 'Welcome to {{restaurantName}}!',
    htmlTemplate: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Welcome to {{restaurantName}}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to {{restaurantName}}!</h1>
            </div>
            <div class="content">
              <h2>Hello {{customerName}},</h2>
              <p>Welcome to {{restaurantName}}! We're thrilled to have you join our community of food lovers.</p>
              <p>Your account has been successfully created and you can now:</p>
              <ul>
                <li>Browse our delicious menu</li>
                <li>Place orders for delivery or pickup</li>
                <li>Track your order status in real-time</li>
                <li>Earn loyalty points with every order</li>
                <li>Save your favorite dishes for quick reordering</li>
              </ul>
              <p>Ready to explore our menu?</p>
              <a href="{{menuUrl}}" class="button">Browse Menu</a>
              <p>If you have any questions, feel free to contact us at {{supportEmail}} or call {{restaurantPhone}}.</p>
              <p>Thank you for choosing {{restaurantName}}!</p>
            </div>
            <div class="footer">
              <p>&copy; {{currentYear}} {{restaurantName}}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textTemplate: `Welcome to {{restaurantName}}!

Hello {{customerName}},

Welcome to {{restaurantName}}! We're thrilled to have you join our community of food lovers.

Your account has been successfully created and you can now:
- Browse our delicious menu
- Place orders for delivery or pickup
- Track your order status in real-time
- Earn loyalty points with every order
- Save your favorite dishes for quick reordering

Visit our menu at: {{menuUrl}}

If you have any questions, contact us at {{supportEmail}} or call {{restaurantPhone}}.

Thank you for choosing {{restaurantName}}!

© {{currentYear}} {{restaurantName}}. All rights reserved.`,
    category: 'user',
    type: 'welcome',
    variables: ['restaurantName', 'customerName', 'menuUrl', 'supportEmail', 'restaurantPhone', 'currentYear'],
    isDefault: true,
    isActive: true
  },
  {
    name: 'Password Reset',
    slug: 'password-reset',
    subject: 'Reset Your {{restaurantName}} Password',
    htmlTemplate: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello {{customerName}},</h2>
              <p>We received a request to reset your password for your {{restaurantName}} account.</p>
              <p>Click the button below to create a new password:</p>
              <a href="{{resetUrl}}" class="button">Reset Password</a>
              <div class="warning">
                <p><strong>Security Notice:</strong></p>
                <ul>
                  <li>This link will expire in {{expiryHours}} hours</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>For security, this link can only be used once</li>
                </ul>
              </div>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all;">{{resetUrl}}</p>
              <p>If you need help, contact us at {{supportEmail}}.</p>
            </div>
            <div class="footer">
              <p>&copy; {{currentYear}} {{restaurantName}}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textTemplate: `Password Reset Request

Hello {{customerName}},

We received a request to reset your password for your {{restaurantName}} account.

Reset your password using this link: {{resetUrl}}

Security Notice:
- This link will expire in {{expiryHours}} hours
- If you didn't request this reset, please ignore this email
- For security, this link can only be used once

If you need help, contact us at {{supportEmail}}.

© {{currentYear}} {{restaurantName}}. All rights reserved.`,
    category: 'user',
    type: 'password_reset',
    variables: ['restaurantName', 'customerName', 'resetUrl', 'expiryHours', 'supportEmail', 'currentYear'],
    isDefault: true,
    isActive: true
  },
  {
    name: 'Order Confirmation',
    slug: 'order-confirmation',
    subject: 'Order Confirmed - #{{orderNumber}}',
    htmlTemplate: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Order Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00b894 0%, #00a085 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .order-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .order-items { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .total { font-weight: bold; font-size: 18px; color: #00b894; }
            .button { display: inline-block; background: #00b894; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmed!</h1>
              <h2>Order #{{orderNumber}}</h2>
            </div>
            <div class="content">
              <h2>Thank you, {{customerName}}!</h2>
              <p>Your order has been confirmed and is now being prepared by our kitchen team.</p>
              
              <div class="order-info">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> #{{orderNumber}}</p>
                <p><strong>Order Time:</strong> {{orderTime}}</p>
                <p><strong>Estimated {{deliveryType}} Time:</strong> {{estimatedTime}}</p>
                {{#if deliveryAddress}}
                <p><strong>Delivery Address:</strong> {{deliveryAddress}}</p>
                {{/if}}
              </div>

              <div class="order-items">
                <h3>Your Order</h3>
                {{#each orderItems}}
                <div class="item">
                  <span>{{quantity}}x {{name}}</span>
                  <span>{{price}}</span>
                </div>
                {{/each}}
                <div class="item total">
                  <span>Total</span>
                  <span>{{orderTotal}}</span>
                </div>
              </div>

              <p>You can track your order status using the link below:</p>
              <a href="{{trackingUrl}}" class="button">Track Order</a>
              
              <p>Questions about your order? Contact us at {{restaurantPhone}} or {{supportEmail}}.</p>
              
              <p>Thank you for choosing {{restaurantName}}!</p>
            </div>
            <div class="footer">
              <p>&copy; {{currentYear}} {{restaurantName}}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textTemplate: `Order Confirmed!

Order #{{orderNumber}}

Thank you, {{customerName}}!

Your order has been confirmed and is now being prepared by our kitchen team.

Order Details:
- Order Number: #{{orderNumber}}
- Order Time: {{orderTime}}
- Estimated {{deliveryType}} Time: {{estimatedTime}}
{{#if deliveryAddress}}
- Delivery Address: {{deliveryAddress}}
{{/if}}

Your Order:
{{#each orderItems}}
{{quantity}}x {{name}} - {{price}}
{{/each}}
Total: {{orderTotal}}

Track your order: {{trackingUrl}}

Questions? Contact us at {{restaurantPhone}} or {{supportEmail}}.

Thank you for choosing {{restaurantName}}!

© {{currentYear}} {{restaurantName}}. All rights reserved.`,
    category: 'order',
    type: 'order_confirmation',
    variables: ['orderNumber', 'customerName', 'orderTime', 'estimatedTime', 'deliveryType', 'deliveryAddress', 'orderItems', 'orderTotal', 'trackingUrl', 'restaurantName', 'restaurantPhone', 'supportEmail', 'currentYear'],
    isDefault: true,
    isActive: true
  },
  {
    name: 'Order Ready',
    slug: 'order-ready',
    subject: 'Your Order is Ready! - #{{orderNumber}}',
    htmlTemplate: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Order Ready</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .ready-notice { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #fdcb6e; }
            .button { display: inline-block; background: #fdcb6e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍽️ Your Order is Ready!</h1>
              <h2>Order #{{orderNumber}}</h2>
            </div>
            <div class="content">
              <h2>Great news, {{customerName}}!</h2>
              
              <div class="ready-notice">
                <h3>{{#if isDelivery}}Out for Delivery{{else}}Ready for Pickup{{/if}}</h3>
                <p><strong>Order Number:</strong> #{{orderNumber}}</p>
                {{#if isDelivery}}
                <p><strong>Estimated Delivery:</strong> {{estimatedDelivery}}</p>
                <p><strong>Delivery Address:</strong> {{deliveryAddress}}</p>
                {{else}}
                <p><strong>Pickup Address:</strong> {{restaurantAddress}}</p>
                <p><strong>Pickup Hours:</strong> {{pickupHours}}</p>
                {{/if}}
              </div>

              {{#if isDelivery}}
              <p>Your delicious food is on its way! Our delivery team will be with you shortly.</p>
              {{else}}
              <p>Your order is ready and waiting for you! Please come by when convenient.</p>
              {{/if}}
              
              <a href="{{trackingUrl}}" class="button">View Order Details</a>
              
              <p>Thank you for your patience and for choosing {{restaurantName}}!</p>
              
              <p>Questions? Call us at {{restaurantPhone}}.</p>
            </div>
            <div class="footer">
              <p>&copy; {{currentYear}} {{restaurantName}}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textTemplate: `🍽️ Your Order is Ready!

Order #{{orderNumber}}

Great news, {{customerName}}!

{{#if isDelivery}}Out for Delivery{{else}}Ready for Pickup{{/if}}

Order Number: #{{orderNumber}}
{{#if isDelivery}}
Estimated Delivery: {{estimatedDelivery}}
Delivery Address: {{deliveryAddress}}
{{else}}
Pickup Address: {{restaurantAddress}}
Pickup Hours: {{pickupHours}}
{{/if}}

{{#if isDelivery}}
Your delicious food is on its way! Our delivery team will be with you shortly.
{{else}}
Your order is ready and waiting for you! Please come by when convenient.
{{/if}}

View order details: {{trackingUrl}}

Thank you for choosing {{restaurantName}}!

Questions? Call us at {{restaurantPhone}}.

© {{currentYear}} {{restaurantName}}. All rights reserved.`,
    category: 'order',
    type: 'order_ready',
    variables: ['orderNumber', 'customerName', 'isDelivery', 'estimatedDelivery', 'deliveryAddress', 'restaurantAddress', 'pickupHours', 'trackingUrl', 'restaurantName', 'restaurantPhone', 'currentYear'],
    isDefault: true,
    isActive: true
  },
  {
    name: 'Shift Reminder',
    slug: 'shift-reminder',
    subject: 'Shift Reminder - {{shiftDate}} at {{restaurantName}}',
    htmlTemplate: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Shift Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .shift-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .reminder { background: #e8f4f8; border: 1px solid #bee5eb; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .button { display: inline-block; background: #6c5ce7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Shift Reminder</h1>
            </div>
            <div class="content">
              <h2>Hello {{staffName}},</h2>
              <p>This is a friendly reminder about your upcoming shift at {{restaurantName}}.</p>
              
              <div class="shift-info">
                <h3>Shift Details</h3>
                <p><strong>Date:</strong> {{shiftDate}}</p>
                <p><strong>Time:</strong> {{startTime}} - {{endTime}}</p>
                <p><strong>Duration:</strong> {{shiftDuration}} hours</p>
                <p><strong>Position:</strong> {{position}}</p>
                {{#if branchName}}
                <p><strong>Branch:</strong> {{branchName}}</p>
                {{/if}}
              </div>

              <div class="reminder">
                <h4>Reminders:</h4>
                <ul>
                  <li>Please arrive 10 minutes before your shift starts</li>
                  <li>Bring your uniform and any required equipment</li>
                  <li>Check the daily specials and menu updates</li>
                  {{#if specialInstructions}}
                  <li>{{specialInstructions}}</li>
                  {{/if}}
                </ul>
              </div>
              
              <a href="{{scheduleUrl}}" class="button">View Full Schedule</a>
              
              <p>If you can't make it to your shift, please contact your manager as soon as possible at {{managerPhone}} or {{managerEmail}}.</p>
              
              <p>Thank you for being part of the {{restaurantName}} team!</p>
            </div>
            <div class="footer">
              <p>&copy; {{currentYear}} {{restaurantName}}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textTemplate: `⏰ Shift Reminder

Hello {{staffName}},

This is a friendly reminder about your upcoming shift at {{restaurantName}}.

Shift Details:
- Date: {{shiftDate}}
- Time: {{startTime}} - {{endTime}}
- Duration: {{shiftDuration}} hours
- Position: {{position}}
{{#if branchName}}
- Branch: {{branchName}}
{{/if}}

Reminders:
- Please arrive 10 minutes before your shift starts
- Bring your uniform and any required equipment
- Check the daily specials and menu updates
{{#if specialInstructions}}
- {{specialInstructions}}
{{/if}}

View full schedule: {{scheduleUrl}}

If you can't make it, contact your manager at {{managerPhone}} or {{managerEmail}}.

Thank you for being part of the {{restaurantName}} team!

© {{currentYear}} {{restaurantName}}. All rights reserved.`,
    category: 'staff',
    type: 'shift_reminder',
    variables: ['staffName', 'restaurantName', 'shiftDate', 'startTime', 'endTime', 'shiftDuration', 'position', 'branchName', 'specialInstructions', 'scheduleUrl', 'managerPhone', 'managerEmail', 'currentYear'],
    isDefault: true,
    isActive: true
  },
  {
    name: 'Promotion Announcement',
    slug: 'promotion-announcement',
    subject: '🎉 {{promoTitle}} - Limited Time Offer!',
    htmlTemplate: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Special Promotion</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .promo-banner { background: white; padding: 25px; border-radius: 6px; margin: 20px 0; text-align: center; border: 2px dashed #fd79a8; }
            .discount { font-size: 36px; font-weight: bold; color: #fd79a8; }
            .button { display: inline-block; background: #fd79a8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .expiry { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 {{promoTitle}}</h1>
              <h2>Limited Time Offer!</h2>
            </div>
            <div class="content">
              <h2>Hello {{customerName}},</h2>
              <p>We have an exciting offer just for you at {{restaurantName}}!</p>
              
              <div class="promo-banner">
                <div class="discount">{{discountPercent}}% OFF</div>
                <h3>{{promoDescription}}</h3>
                <p>Use code: <strong>{{promoCode}}</strong></p>
              </div>

              {{#if minimumOrder}}
              <p><strong>Minimum order:</strong> {{minimumOrder}}</p>
              {{/if}}

              <p>{{promoDetails}}</p>
              
              <a href="{{orderUrl}}" class="button">Order Now & Save!</a>
              
              <div class="expiry">
                <p><strong>⏰ Hurry! This offer expires on {{expiryDate}}</strong></p>
              </div>
              
              <p>Don't miss out on this delicious deal!</p>
              
              <p>Questions about this promotion? Contact us at {{restaurantPhone}} or {{supportEmail}}.</p>
              
              <hr>
              <small>
                <p>You're receiving this email because you subscribed to {{restaurantName}} promotions. 
                <a href="{{unsubscribeUrl}}">Unsubscribe</a> if you no longer wish to receive promotional emails.</p>
              </small>
            </div>
            <div class="footer">
              <p>&copy; {{currentYear}} {{restaurantName}}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textTemplate: `🎉 {{promoTitle}} - Limited Time Offer!

Hello {{customerName}},

We have an exciting offer just for you at {{restaurantName}}!

{{discountPercent}}% OFF
{{promoDescription}}
Use code: {{promoCode}}

{{#if minimumOrder}}
Minimum order: {{minimumOrder}}
{{/if}}

{{promoDetails}}

Order now: {{orderUrl}}

⏰ Hurry! This offer expires on {{expiryDate}}

Don't miss out on this delicious deal!

Questions? Contact us at {{restaurantPhone}} or {{supportEmail}}.

You're receiving this email because you subscribed to {{restaurantName}} promotions. 
Unsubscribe: {{unsubscribeUrl}}

© {{currentYear}} {{restaurantName}}. All rights reserved.`,
    category: 'marketing',
    type: 'promotion',
    variables: ['promoTitle', 'customerName', 'restaurantName', 'discountPercent', 'promoDescription', 'promoCode', 'minimumOrder', 'promoDetails', 'orderUrl', 'expiryDate', 'restaurantPhone', 'supportEmail', 'unsubscribeUrl', 'currentYear'],
    isDefault: true,
    isActive: true
  },
  {
    name: 'Report Delivery',
    slug: 'report-delivery',
    subject: '{{reportTitle}} - {{companyName}}',
    htmlTemplate: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>{{reportTitle}} - {{companyName}}</title>
          <style>
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f8f9fa;
              }
              
              .email-container {
                  background-color: #ffffff;
                  border-radius: 8px;
                  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                  overflow: hidden;
              }
              
              .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 30px 40px;
                  text-align: center;
              }
              
              .header h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: 600;
              }
              
              .header p {
                  margin: 8px 0 0 0;
                  font-size: 16px;
                  opacity: 0.9;
              }
              
              .content {
                  padding: 40px;
              }
              
              .greeting {
                  font-size: 18px;
                  margin-bottom: 20px;
                  color: #2c3e50;
              }
              
              .report-info {
                  background-color: #f8f9fa;
                  border-left: 4px solid #667eea;
                  padding: 20px;
                  margin: 20px 0;
                  border-radius: 4px;
              }
              
              .report-info h3 {
                  margin: 0 0 15px 0;
                  color: #2c3e50;
                  font-size: 18px;
              }
              
              .report-details {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 15px;
                  margin-bottom: 15px;
              }
              
              .detail-item {
                  flex: 1;
                  min-width: 150px;
              }
              
              .detail-label {
                  font-weight: 600;
                  color: #667eea;
                  font-size: 14px;
                  margin-bottom: 4px;
              }
              
              .detail-value {
                  color: #2c3e50;
                  font-size: 16px;
              }
              
              .key-metrics {
                  margin: 25px 0;
              }
              
              .key-metrics h4 {
                  color: #2c3e50;
                  margin-bottom: 15px;
                  font-size: 16px;
              }
              
              .metrics-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                  gap: 15px;
              }
              
              .metric-card {
                  background-color: #fff;
                  border: 1px solid #e1e8ed;
                  border-radius: 6px;
                  padding: 15px;
                  text-align: center;
              }
              
              .metric-value {
                  font-size: 20px;
                  font-weight: 700;
                  color: #667eea;
                  margin-bottom: 5px;
              }
              
              .metric-label {
                  font-size: 12px;
                  color: #657786;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }
              
              .attachment-notice {
                  background-color: #e8f5e8;
                  border: 1px solid #c3e6cb;
                  border-radius: 6px;
                  padding: 15px;
                  margin: 20px 0;
                  display: flex;
                  align-items: center;
                  gap: 10px;
              }
              
              .attachment-icon {
                  width: 24px;
                  height: 24px;
                  background-color: #28a745;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: 14px;
                  flex-shrink: 0;
              }
              
              .custom-message {
                  margin: 20px 0;
                  padding: 15px;
                  background-color: #fff3cd;
                  border: 1px solid #ffeaa7;
                  border-radius: 6px;
                  font-style: italic;
              }
              
              .footer {
                  background-color: #f8f9fa;
                  border-top: 1px solid #e1e8ed;
                  padding: 30px 40px;
                  text-align: center;
              }
              
              .footer-info {
                  margin-bottom: 15px;
                  color: #657786;
                  font-size: 14px;
              }
              
              .company-info {
                  color: #2c3e50;
                  font-size: 16px;
                  font-weight: 600;
                  margin-bottom: 5px;
              }
              
              .confidential {
                  color: #e74c3c;
                  font-size: 12px;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-top: 10px;
              }
              
              @media (max-width: 480px) {
                  body {
                      padding: 10px;
                  }
                  
                  .header,
                  .content,
                  .footer {
                      padding: 20px;
                  }
                  
                  .header h1 {
                      font-size: 24px;
                  }
                  
                  .report-details {
                      flex-direction: column;
                  }
                  
                  .metrics-grid {
                      grid-template-columns: 1fr;
                  }
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="header">
                  <h1>{{companyName}}</h1>
                  <p>{{reportTitle}}</p>
              </div>
              
              <div class="content">
                  <div class="greeting">
                      Dear {{recipientName}},
                  </div>
                  
                  <p>
                      Please find attached your requested <strong>{{reportTitle}}</strong> for the period 
                      <strong>{{dateRange}}</strong>.
                  </p>
                  
                  <div class="report-info">
                      <h3>📊 Report Summary</h3>
                      
                      <div class="report-details">
                          <div class="detail-item">
                              <div class="detail-label">Report Type</div>
                              <div class="detail-value">{{reportType}}</div>
                          </div>
                          <div class="detail-item">
                              <div class="detail-label">Period</div>
                              <div class="detail-value">{{dateRange}}</div>
                          </div>
                          <div class="detail-item">
                              <div class="detail-label">Format</div>
                              <div class="detail-value">{{format}}</div>
                          </div>
                          {{#if branchName}}
                          <div class="detail-item">
                              <div class="detail-label">Branch</div>
                              <div class="detail-value">{{branchName}}</div>
                          </div>
                          {{/if}}
                      </div>
                      
                      {{#if keyMetrics}}
                      <div class="key-metrics">
                          <h4>Key Insights</h4>
                          <div class="metrics-grid">
                              {{#each keyMetrics}}
                              <div class="metric-card">
                                  <div class="metric-value">{{this.value}}</div>
                                  <div class="metric-label">{{this.label}}</div>
                              </div>
                              {{/each}}
                          </div>
                      </div>
                      {{/if}}
                  </div>
                  
                  <div class="attachment-notice">
                      <div class="attachment-icon">📎</div>
                      <div>
                          <strong>Report Attachment:</strong> The complete {{reportTitle}} is attached as a {{format}} file 
                          with detailed analysis and visualizations.
                      </div>
                  </div>
                  
                  {{#if customMessage}}
                  <div class="custom-message">
                      <strong>Additional Message:</strong><br>
                      {{customMessage}}
                  </div>
                  {{/if}}
                  
                  <p>
                      This report contains comprehensive analysis and insights for your business. If you have any 
                      questions about the data or need additional analysis, please don't hesitate to contact us.
                  </p>
                  
                  <p>
                      Best regards,<br>
                      <strong>{{generatedBy}}</strong><br>
                      {{companyName}} Team
                  </p>
              </div>
              
              <div class="footer">
                  <div class="company-info">{{companyName}}</div>
                  <div class="footer-info">
                      Generated on {{generatedDate}} by {{generatedBy}}<br>
                      {{#if companyAddress}}{{companyAddress}}{{/if}}
                      {{#if companyPhone}} • {{companyPhone}}{{/if}}
                      {{#if companyEmail}} • {{companyEmail}}{{/if}}
                  </div>
                  <div class="confidential">⚠️ Confidential Business Information</div>
              </div>
          </div>
      </body>
      </html>
    `,
    textTemplate: `{{reportTitle}} - {{companyName}}

Dear {{recipientName}},

Please find attached your requested {{reportTitle}} for the period {{dateRange}}.

Report Summary:
- Report Type: {{reportType}}
- Period: {{dateRange}}
- Format: {{format}}
{{#if branchName}}
- Branch: {{branchName}}
{{/if}}

{{#if keyMetrics}}
Key Insights:
{{#each keyMetrics}}
{{this.label}}: {{this.value}}
{{/each}}
{{/if}}

Report Attachment: The complete {{reportTitle}} is attached as a {{format}} file with detailed analysis and visualizations.

{{#if customMessage}}
Additional Message:
{{customMessage}}
{{/if}}

This report contains comprehensive analysis and insights for your business. If you have any questions about the data or need additional analysis, please don't hesitate to contact us.

Best regards,
{{generatedBy}}
{{companyName}} Team

---
Generated on {{generatedDate}} by {{generatedBy}}
{{#if companyAddress}}{{companyAddress}}{{/if}}
{{#if companyPhone}} • {{companyPhone}}{{/if}}
{{#if companyEmail}} • {{companyEmail}}{{/if}}

⚠️ CONFIDENTIAL BUSINESS INFORMATION`,
    category: 'system',
    type: 'report-delivery',
    variables: ['recipientName', 'companyName', 'reportTitle', 'reportType', 'dateRange', 'format', 'branchName', 'keyMetrics', 'customMessage', 'generatedBy', 'generatedDate', 'companyAddress', 'companyPhone', 'companyEmail'],
    isDefault: true,
    isActive: true
  },
  {
    name: 'Scheduled Report',
    slug: 'scheduled-report',
    subject: 'Scheduled Report: {{reportTitle}}',
    htmlTemplate: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Scheduled Report: {{reportTitle}}</title>
          <style>
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
              }
              .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
                  border-radius: 8px 8px 0 0;
              }
              .content {
                  background: #ffffff;
                  padding: 30px;
                  border: 1px solid #e1e5e9;
                  border-top: none;
              }
              .footer {
                  background: #f8f9fa;
                  padding: 20px 30px;
                  border: 1px solid #e1e5e9;
                  border-top: none;
                  border-radius: 0 0 8px 8px;
                  text-align: center;
                  font-size: 14px;
                  color: #6c757d;
              }
              .report-info {
                  background: #f8f9fa;
                  padding: 20px;
                  border-radius: 6px;
                  margin: 20px 0;
              }
              .report-info h3 {
                  margin: 0 0 10px 0;
                  color: #495057;
              }
              .attachment-note {
                  background: #d1ecf1;
                  color: #0c5460;
                  padding: 15px;
                  border-radius: 6px;
                  margin: 20px 0;
                  border-left: 4px solid #bee5eb;
              }
              .logo {
                  font-size: 24px;
                  font-weight: bold;
                  margin-bottom: 10px;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <div class="logo">Restaurant Reports</div>
              <h1>{{reportTitle}}</h1>
              <p>Automated Report Delivery</p>
          </div>
          
          <div class="content">
              <p>Hello,</p>
              
              <p>Your scheduled report <strong>{{reportTitle}}</strong> has been generated and is ready for review.</p>
              
              <div class="report-info">
                  <h3>Report Details</h3>
                  <p><strong>Report Period:</strong> {{reportPeriod}}</p>
                  <p><strong>Generated On:</strong> {{generatedAt}}</p>
                  <p><strong>Recipients:</strong> {{recipientEmail}}</p>
              </div>
              
              <div class="attachment-note">
                  <strong>📎 Report Attached</strong><br>
                  The complete report is attached to this email. Please open the attachment to view the detailed analysis and insights.
              </div>
              
              <p>This report was automatically generated as part of your scheduled reporting configuration. The report includes comprehensive data analysis for the specified time period.</p>
              
              <p>If you have any questions about this report or need to modify your scheduling preferences, please contact your system administrator.</p>
              
              <p>Best regards,<br>
              Restaurant Management System</p>
          </div>
          
          <div class="footer">
              <p>This is an automated message from your Restaurant Management System.</p>
              <p>Report generated on {{generatedAt}} | Period: {{reportPeriod}}</p>
          </div>
      </body>
      </html>
    `,
    textTemplate: `Scheduled Report: {{reportTitle}}

Hello,

Your scheduled report "{{reportTitle}}" has been generated and is ready for review.

Report Details:
- Report Period: {{reportPeriod}}
- Generated On: {{generatedAt}}
- Recipients: {{recipientEmail}}

The complete report is attached to this email. Please open the attachment to view the detailed analysis and insights.

This report was automatically generated as part of your scheduled reporting configuration. The report includes comprehensive data analysis for the specified time period.

If you have any questions about this report or need to modify your scheduling preferences, please contact your system administrator.

Best regards,
Restaurant Management System

This is an automated message from your Restaurant Management System.
Report generated on {{generatedAt}} | Period: {{reportPeriod}}`,
    category: 'system',
    type: 'scheduled-report',
    variables: ['reportTitle', 'reportPeriod', 'generatedAt', 'recipientEmail'],
    isDefault: true,
    isActive: true
  },
  {
    name: 'Report Failure',
    slug: 'report-failure',
    subject: 'Report Generation Failed: {{reportTitle}}',
    htmlTemplate: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Report Generation Failed</title>
          <style>
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
              }
              .header {
                  background: linear-gradient(135deg, #dc3545 0%, #bd2130 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
                  border-radius: 8px 8px 0 0;
              }
              .content {
                  background: #ffffff;
                  padding: 30px;
                  border: 1px solid #e1e5e9;
                  border-top: none;
              }
              .error-info {
                  background: #f8d7da;
                  color: #721c24;
                  padding: 20px;
                  border-radius: 6px;
                  margin: 20px 0;
                  border-left: 4px solid #f5c6cb;
              }
              .warning-box {
                  background: #fff3cd;
                  color: #856404;
                  padding: 15px;
                  border-radius: 6px;
                  margin: 20px 0;
                  border-left: 4px solid #ffeaa7;
              }
              .footer {
                  background: #f8f9fa;
                  padding: 20px 30px;
                  border: 1px solid #e1e5e9;
                  border-top: none;
                  border-radius: 0 0 8px 8px;
                  text-align: center;
                  font-size: 14px;
                  color: #6c757d;
              }
              .logo {
                  font-size: 24px;
                  font-weight: bold;
                  margin-bottom: 10px;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <div class="logo">⚠️ Restaurant Reports</div>
              <h1>Report Generation Failed</h1>
              <p>{{reportTitle}}</p>
          </div>
          
          <div class="content">
              <p>Hello {{userName}},</p>
              
              <p>We encountered an issue while generating your scheduled report <strong>"{{reportTitle}}"</strong>.</p>
              
              <div class="error-info">
                  <h3>Failure Details</h3>
                  <p><strong>Report:</strong> {{reportTitle}}</p>
                  <p><strong>Failure Count:</strong> {{failureCount}} of {{maxFailures}}</p>
                  <p><strong>Schedule ID:</strong> {{scheduleId}}</p>
                  {{#if errorMessage}}
                  <p><strong>Error:</strong> {{errorMessage}}</p>
                  {{/if}}
              </div>
              
              {{#if willDisable}}
              <div class="warning-box">
                  <strong>⚠️ Schedule Auto-Disabled</strong><br>
                  This scheduled report has been automatically disabled due to reaching the maximum number of consecutive failures ({{maxFailures}}). 
                  Please resolve the underlying issue and re-enable the schedule manually.
              </div>
              {{else}}
              <div class="warning-box">
                  <strong>🔄 Automatic Retry</strong><br>
                  The system will automatically attempt to generate this report again at the next scheduled time. 
                  If failures continue, the schedule will be disabled after {{maxFailures}} consecutive failures.
              </div>
              {{/if}}
              
              <p>If you need immediate assistance or have questions about this failure, please contact your system administrator with the Schedule ID provided above.</p>
              
              <p>Best regards,<br>
              Restaurant Management System</p>
          </div>
          
          <div class="footer">
              <p>This is an automated alert from your Restaurant Management System.</p>
              <p>Schedule ID: {{scheduleId}} | Failure Count: {{failureCount}}/{{maxFailures}}</p>
          </div>
      </body>
      </html>
    `,
    textTemplate: `Report Generation Failed: {{reportTitle}}

Hello {{userName}},

We encountered an issue while generating your scheduled report "{{reportTitle}}".

Failure Details:
- Report: {{reportTitle}}
- Failure Count: {{failureCount}} of {{maxFailures}}
- Schedule ID: {{scheduleId}}
{{#if errorMessage}}
- Error: {{errorMessage}}
{{/if}}

{{#if willDisable}}
⚠️ Schedule Auto-Disabled
This scheduled report has been automatically disabled due to reaching the maximum number of consecutive failures ({{maxFailures}}). Please resolve the underlying issue and re-enable the schedule manually.
{{else}}
🔄 Automatic Retry
The system will automatically attempt to generate this report again at the next scheduled time. If failures continue, the schedule will be disabled after {{maxFailures}} consecutive failures.
{{/if}}

If you need immediate assistance or have questions about this failure, please contact your system administrator with the Schedule ID provided above.

Best regards,
Restaurant Management System

This is an automated alert from your Restaurant Management System.
Schedule ID: {{scheduleId}} | Failure Count: {{failureCount}}/{{maxFailures}}`,
    category: 'system',
    type: 'report-failure',
    variables: ['reportTitle', 'userName', 'failureCount', 'maxFailures', 'scheduleId', 'errorMessage', 'willDisable'],
    isDefault: true,
    isActive: true
  }
];

async function createDefaultEmailTemplates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    console.log('\n📧 Creating default email templates...');
    
    for (const templateData of defaultTemplates) {
      try {
        // Check if template already exists
        const existingTemplate = await EmailTemplate.findOne({ 
          slug: templateData.slug, 
          isDefault: true 
        });
        
        if (existingTemplate) {
          console.log(`⚠️  Template "${templateData.name}" already exists, skipping...`);
          continue;
        }

        // Create new template
        const template = new EmailTemplate(templateData);
        await template.save();
        
        console.log(`✅ Created template: ${templateData.name} (${templateData.slug})`);
      } catch (error) {
        console.error(`❌ Error creating template "${templateData.name}":`, error.message);
      }
    }

    console.log('\n📊 Email Template Summary:');
    const templateCounts = await EmailTemplate.aggregate([
      { $match: { isDefault: true, isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 as 1 } }
    ]);

    templateCounts.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count} templates`);
    });

    const totalTemplates = await EmailTemplate.countDocuments({ isDefault: true, isActive: true });
    console.log(`\n✅ Total default templates created: ${totalTemplates}`);

    console.log('\n🎯 Templates by category:');
    console.log('   user: welcome-user, password-reset');
    console.log('   order: order-confirmation, order-ready');
    console.log('   staff: shift-reminder');
    console.log('   marketing: promotion-announcement');
    console.log('   system: report-delivery');

    console.log('\n📝 Next steps:');
    console.log('1. Configure email settings for each tenant via API');
    console.log('2. Customize templates per tenant as needed');
    console.log('3. Integrate email sending in user registration and order flows');
    console.log('4. Set up Redis for email queue processing');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createDefaultEmailTemplates();