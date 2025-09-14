# Email Configuration Guide

This guide covers the comprehensive email management system implemented with Nodemailer for the Dine Serve Hub multi-tenant restaurant platform.

## Overview

The email system provides multi-tenant email functionality with support for:
- **Multiple Email Providers**: SMTP, SendGrid, Mailgun, AWS SES
- **Template Management**: Handlebars-based email templates
- **Queue System**: Bull-based email queuing with Redis
- **Email Analytics**: Comprehensive logging and statistics
- **Bulk Email Support**: Marketing campaigns and notifications

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Email API     │    │  Email Service  │    │  Queue System   │
│   Controllers   │────▶│   (Nodemailer)  │────▶│    (Bull)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Email Models  │    │    Templates    │    │   Redis Queue   │
│ Config/Log/Tmpl │    │  (Handlebars)   │    │   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Models

### EmailConfig
Stores tenant-specific email provider configurations:

```typescript
{
  tenantId: ObjectId,
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses',
  smtpConfig: {
    host: string,
    port: number,
    secure: boolean,
    auth: { user: string, pass: string }
  },
  defaultFromEmail: string,
  defaultFromName: string,
  isActive: boolean
}
```

### EmailTemplate
Manages reusable email templates:

```typescript
{
  tenantId: ObjectId,
  name: string,
  slug: string,
  subject: string,           // Handlebars template
  htmlTemplate: string,      // Handlebars template
  textTemplate: string,      // Optional plain text
  variables: string[],       // Template variables
  category: 'user' | 'order' | 'marketing' | 'system' | 'staff',
  type: 'welcome' | 'password_reset' | 'order_confirmation' | ...,
  isDefault: boolean         // System default templates
}
```

### EmailLog
Tracks all email activity:

```typescript
{
  tenantId: ObjectId,
  templateId: ObjectId,
  recipientEmail: string,
  subject: string,
  status: 'pending' | 'sent' | 'delivered' | 'failed',
  priority: 'low' | 'normal' | 'high' | 'urgent',
  category: string,
  metadata: object,          // Additional context (orderId, userId, etc.)
  deliveryAttempts: number,
  errorMessage: string,
  providerMessageId: string
}
```

## API Endpoints

### Email Configuration

#### Create Email Configuration
```http
POST /api/email/:tenantId/config
Authorization: Bearer <token>

{
  "provider": "smtp",
  "smtpConfig": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "your-email@gmail.com",
      "pass": "app-password"
    }
  },
  "defaultFromEmail": "noreply@restaurant.com",
  "defaultFromName": "Restaurant Name"
}
```

#### Get Email Configuration
```http
GET /api/email/:tenantId/config
Authorization: Bearer <token>
```

#### Update Email Configuration
```http
PUT /api/email/:tenantId/config
Authorization: Bearer <token>

{
  "defaultFromName": "Updated Restaurant Name",
  "isActive": true
}
```

### Email Templates

#### Create Email Template
```http
POST /api/email/:tenantId/templates
Authorization: Bearer <token>

{
  "name": "Welcome Email",
  "subject": "Welcome to {{restaurantName}}!",
  "htmlTemplate": "<h1>Welcome {{customerName}}</h1><p>Thank you for joining {{restaurantName}}!</p>",
  "textTemplate": "Welcome {{customerName}}! Thank you for joining {{restaurantName}}!",
  "category": "user",
  "type": "welcome",
  "variables": ["customerName", "restaurantName"]
}
```

#### Get Email Templates
```http
GET /api/email/:tenantId/templates?category=user&page=1&limit=20
Authorization: Bearer <token>
```

#### Update Email Template
```http
PUT /api/email/:tenantId/templates/:templateId
Authorization: Bearer <token>

{
  "subject": "Updated welcome to {{restaurantName}}!",
  "htmlTemplate": "<h1>Updated Welcome {{customerName}}</h1>"
}
```

### Email Sending

#### Send Single Email
```http
POST /api/email/:tenantId/send
Authorization: Bearer <token>

{
  "to": "customer@example.com",
  "toName": "John Doe",
  "templateSlug": "welcome-email",
  "templateData": {
    "customerName": "John Doe",
    "restaurantName": "Pizza Palace"
  },
  "category": "user",
  "type": "welcome",
  "priority": "normal",
  "metadata": {
    "userId": "64a7b8c9d1e2f3a4b5c6d7e8"
  }
}
```

#### Send Bulk Email
```http
POST /api/email/:tenantId/send-bulk
Authorization: Bearer <token>

{
  "recipients": [
    {
      "email": "customer1@example.com",
      "name": "John Doe",
      "customData": { "discountCode": "SAVE10" }
    },
    {
      "email": "customer2@example.com",
      "name": "Jane Smith",
      "customData": { "discountCode": "SAVE15" }
    }
  ],
  "templateSlug": "promotion-email",
  "commonTemplateData": {
    "restaurantName": "Pizza Palace",
    "promoTitle": "Summer Special"
  },
  "category": "marketing",
  "type": "promotion",
  "priority": "normal"
}
```

### Email Analytics

#### Get Email Logs
```http
GET /api/email/:tenantId/logs?status=sent&category=order&page=1&limit=50
Authorization: Bearer <token>
```

#### Get Email Statistics
```http
GET /api/email/:tenantId/stats?days=30
Authorization: Bearer <token>
```

#### Retry Failed Emails
```http
POST /api/email/:tenantId/retry-failed
Authorization: Bearer <token>
```

## Email Provider Configuration

### SMTP Configuration
For generic SMTP providers:

```json
{
  "provider": "smtp",
  "smtpConfig": {
    "host": "smtp.your-provider.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "username",
      "pass": "password"
    }
  }
}
```

### Gmail Configuration
For Gmail SMTP:

```json
{
  "provider": "smtp",
  "smtpConfig": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "your-email@gmail.com",
      "pass": "your-app-password"
    }
  }
}
```

### SendGrid Configuration
```json
{
  "provider": "sendgrid",
  "sendgridConfig": {
    "apiKey": "SG.your-api-key"
  }
}
```

### Mailgun Configuration
```json
{
  "provider": "mailgun",
  "mailgunConfig": {
    "apiKey": "your-api-key",
    "domain": "mg.your-domain.com"
  }
}
```

### AWS SES Configuration
```json
{
  "provider": "ses",
  "sesConfig": {
    "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
    "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "region": "us-east-1"
  }
}
```

## Template Variables

Common template variables available across all templates:

### User Variables
- `{{customerName}}` - Customer's full name
- `{{customerEmail}}` - Customer's email address
- `{{userId}}` - Customer's unique ID

### Restaurant Variables
- `{{restaurantName}}` - Restaurant/tenant name
- `{{restaurantAddress}}` - Restaurant address
- `{{restaurantPhone}}` - Restaurant phone number
- `{{restaurantEmail}}` - Restaurant email address

### Order Variables
- `{{orderNumber}}` - Order number
- `{{orderTotal}}` - Total amount
- `{{orderItems}}` - Array of order items
- `{{deliveryAddress}}` - Delivery address
- `{{estimatedDelivery}}` - Estimated delivery time

### System Variables
- `{{currentDate}}` - Current date
- `{{currentYear}}` - Current year
- `{{supportEmail}}` - Support email address
- `{{unsubscribeUrl}}` - Unsubscribe link

## Default Templates

The system comes with default templates for common use cases:

### User Templates
- `welcome-user` - New user registration
- `password-reset` - Password reset emails
- `email-verification` - Email verification
- `account-activated` - Account activation confirmation

### Order Templates
- `order-confirmation` - Order placed confirmation
- `order-preparing` - Order is being prepared
- `order-ready` - Order ready for pickup/delivery
- `order-delivered` - Order delivered confirmation
- `order-cancelled` - Order cancellation notice

### Staff Templates
- `shift-reminder` - Upcoming shift reminders
- `shift-assigned` - New shift assignment
- `schedule-updated` - Schedule changes
- `payroll-notification` - Payroll notifications

### Marketing Templates
- `promotion-announcement` - New promotions
- `loyalty-rewards` - Loyalty program updates
- `newsletter` - Regular newsletters
- `feedback-request` - Customer feedback requests

## Queue System

The email system uses Bull queues with Redis for:

### Queue Priority
- **Urgent** (10): System alerts, password resets
- **High** (5): Order confirmations, delivery updates
- **Normal** (0): Welcome emails, general notifications
- **Low** (-5): Marketing emails, newsletters

### Retry Logic
- **Failed emails**: Automatically retried up to 3 times
- **Exponential backoff**: 1min, 2min, 4min delays
- **Manual retry**: Failed emails can be manually retried

### Queue Processing
```javascript
// Email queue processes jobs automatically
this.emailQueue.process('sendEmail', async (job) => {
  await this.processEmail(job.data);
});

// Bulk email processing
this.emailQueue.process('sendBulkEmail', async (job) => {
  await this.processBulkEmail(job.data);
});
```

## Environment Variables

Required environment variables:

```env
# Redis Configuration (for queue system)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/your-database

# Optional: Global email settings
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
DEFAULT_FROM_NAME=Your Application Name
```

## Usage Examples

### Integration with User Registration
```typescript
// After user registration
await emailService.sendEmail({
  tenantId: user.tenantId,
  to: user.email,
  toName: user.name,
  templateSlug: 'welcome-user',
  templateData: {
    customerName: user.name,
    restaurantName: tenant.name,
    loginUrl: `${process.env.FRONTEND_URL}/login`
  },
  category: 'user',
  type: 'welcome',
  metadata: { userId: user._id }
});
```

### Integration with Order System
```typescript
// After order creation
await emailService.sendEmail({
  tenantId: order.tenantId,
  to: order.customerEmail,
  toName: order.customerName,
  templateSlug: 'order-confirmation',
  templateData: {
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    orderTotal: order.totalAmount,
    orderItems: order.items,
    restaurantName: tenant.name
  },
  category: 'order',
  type: 'order_confirmation',
  priority: 'high',
  metadata: { orderId: order._id }
});
```

### Marketing Campaign
```typescript
// Send promotional email to all customers
const customers = await User.find({ 
  tenantId, 
  role: 'customer', 
  emailSubscribed: true 
});

await emailService.sendBulkEmail({
  tenantId,
  recipients: customers.map(customer => ({
    email: customer.email,
    name: customer.name,
    customData: { 
      loyaltyPoints: customer.loyaltyPoints,
      discountCode: generateDiscountCode(customer)
    }
  })),
  templateSlug: 'summer-promotion',
  commonTemplateData: {
    restaurantName: tenant.name,
    promoTitle: 'Summer Special - 20% Off!',
    validUntil: '2024-08-31'
  },
  category: 'marketing',
  type: 'promotion',
  priority: 'low'
});
```

## Security Considerations

1. **API Key Protection**: Never expose email provider API keys in client-side code
2. **Authentication**: All email endpoints require authentication
3. **Tenant Isolation**: Users can only access their tenant's email configuration
4. **Rate Limiting**: Implement rate limiting for email sending endpoints
5. **Email Validation**: All email addresses are validated before sending
6. **Template Security**: Sanitize template data to prevent XSS attacks

## Monitoring and Maintenance

### Email Analytics
- Track delivery rates, open rates, click rates
- Monitor failed emails and bounce rates
- Analyze email performance by category and template

### Queue Monitoring
- Monitor queue length and processing times
- Set up alerts for failed email processing
- Regularly clean up old email logs

### Database Maintenance
```javascript
// Clean up old email logs (run as cron job)
EmailLog.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
  status: { $in: ['sent', 'delivered'] }
});
```

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check email configuration and provider credentials
2. **Template errors**: Verify template syntax and variable names
3. **Queue stuck**: Restart Redis and check queue processing
4. **High bounce rate**: Verify email list quality and sender reputation

### Debug Mode
Enable debug logging in development:

```env
NODE_ENV=development
DEBUG=email:*
```

This comprehensive email system provides a robust foundation for all email communications in the multi-tenant restaurant platform.