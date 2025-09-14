# Report Email Delivery Implementation

## Overview

The report email delivery system enables users to automatically send generated reports (PDF, Excel, CSV) to multiple recipients via professional emails with attachments. This feature integrates seamlessly with the existing report generation system and email infrastructure.

## Features

✅ **Professional Email Templates**: Beautifully designed HTML emails with company branding  
✅ **Report Attachments**: Automatic attachment of generated report files  
✅ **Multiple Recipients**: Send to multiple email addresses simultaneously  
✅ **Key Metrics Preview**: Include summary metrics directly in email body  
✅ **Custom Messages**: Add personalized messages to email delivery  
✅ **Multi-Format Support**: PDF, Excel, and CSV format support  
✅ **Branch Filtering**: Support for branch-specific reports  
✅ **Role-Based Access**: Respect existing report access permissions  

## Implementation Details

### Backend Components

#### 1. Email Service Enhancement (`backend/src/services/email.service.ts`)
- Added `attachments` support to `EmailData` interface
- Enhanced email processing to handle file attachments
- Multi-provider support (SMTP, SendGrid, Mailgun, SES)

#### 2. Report Controller (`backend/src/controllers/report.controller.ts`)
- New `emailReport` method with comprehensive validation
- Support for all 6 report types: `sales`, `menu-performance`, `customer-analytics`, `financial-summary`, `staff-performance`, `branch-performance`
- Automatic key metrics extraction for email preview
- Role-based permission checking
- File attachment handling and cleanup

#### 3. Email Templates (`backend/src/templates/emails/report-delivery.hbs`)
- Professional HTML email template with responsive design
- Dynamic content based on report type
- Company branding integration
- Key metrics display cards
- Attachment notifications
- Custom message support

#### 4. Database Seeding (`backend/src/seeds/createDefaultEmailTemplates.ts`)
- Added `report-delivery` template to default templates
- Category: `system`, Type: `report-delivery`
- Support for tenant-specific customization

### API Endpoint

#### `POST /api/reports/email`

**Description**: Generate and email report to specified recipients

**Access**: All authenticated users (with appropriate report permissions)

**Request Body**:
```json
{
  "reportType": "sales" | "menu-performance" | "customer-analytics" | "financial-summary" | "staff-performance" | "branch-performance",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.999Z",
  "format": "pdf" | "excel" | "csv",
  "recipients": ["manager@restaurant.com", "owner@restaurant.com"],
  "subject": "Optional custom subject line",
  "message": "Optional custom message",
  "branchId": "optional-branch-id",
  "branchIds": ["array-of-branch-ids"],
  "period": "daily" | "weekly" | "monthly",
  "includeCharts": false,
  "includeDetails": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Report emailed successfully to 2 recipient(s)",
  "reportId": "report-uuid",
  "recipients": 2,
  "reportType": "Sales Performance Report"
}
```

**Validation Rules**:
- `reportType`: Must be valid report type
- `startDate`/`endDate`: Must be valid ISO dates, start < end
- `format`: Must be pdf, excel, or csv
- `recipients`: Array of valid email addresses (min 1)
- `subject`: Optional, max 200 characters
- `message`: Optional, max 1000 characters
- Role permissions enforced for sensitive reports

### Email Template Structure

The email template includes:

1. **Header Section**: Company name and report title
2. **Greeting**: Personalized recipient name
3. **Report Summary Box**: 
   - Report type, period, format, branch
   - Key metrics cards (revenue, orders, performance, etc.)
4. **Attachment Notice**: Clear indication of attached file
5. **Custom Message**: Optional personalized content
6. **Footer**: Company details and confidentiality notice

### Key Metrics Extraction

The system automatically extracts relevant metrics based on report type:

- **Sales Reports**: Total Revenue, Total Orders, Avg Order Value
- **Menu Performance**: Top Item, Items Sold, Categories
- **Customer Analytics**: Total Customers, New Customers, Return Rate
- **Financial Summary**: Gross Revenue, Net Revenue, Total Tax
- **Staff Performance**: Total Staff, Avg Performance, Total Hours
- **Branch Performance**: Top Branch, Total Branches, Avg Performance

## Setup and Configuration

### 1. Install Email Template

Run the setup script to create the email template:

```bash
# From backend directory
npm run tsx src/scripts/setup-report-email-templates.ts
```

Or use the comprehensive template seeder:

```bash
npm run tsx src/seeds/createDefaultEmailTemplates.ts
```

### 2. Configure Email Settings

Ensure each tenant has email configuration set up via the Email Configuration API:

```json
{
  "provider": "smtp" | "sendgrid" | "mailgun" | "ses",
  "defaultFromEmail": "reports@restaurant.com",
  "defaultFromName": "Restaurant Name",
  "smtpConfig": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "email@gmail.com",
      "pass": "app-password"
    }
  }
}
```

### 3. Test Email Delivery

Test the API endpoint:

```bash
curl -X POST http://localhost:5000/api/reports/email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "reportType": "sales",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.999Z",
    "format": "pdf",
    "recipients": ["test@example.com"],
    "subject": "Test Sales Report",
    "message": "This is a test email delivery."
  }'
```

## Security Considerations

1. **File Cleanup**: Report files are automatically deleted after 5 minutes
2. **Role Validation**: Access permissions enforced for sensitive reports
3. **Email Validation**: All recipient emails validated
4. **Rate Limiting**: Implement rate limiting for email delivery endpoint
5. **Attachment Security**: Only generated reports can be attached
6. **Multi-tenant Isolation**: Email configurations are tenant-specific

## Error Handling

The system handles various error scenarios:

- **Invalid Email**: Returns validation error for invalid email addresses
- **Report Generation Failure**: Graceful handling with error response
- **Email Delivery Failure**: Individual email failures don't affect others
- **Attachment Issues**: Clear error messages for file problems
- **Permission Denied**: Role-based access control enforcement

## Performance Considerations

- **Async Processing**: Emails sent asynchronously to all recipients
- **File Cleanup**: Automatic cleanup of temporary report files
- **Batch Operations**: Efficient handling of multiple recipients
- **Memory Management**: Stream-based file handling for large attachments

## Future Enhancements

1. **Scheduled Reports**: Automatic recurring report delivery
2. **Email Templates Per Tenant**: Custom email branding per tenant
3. **Delivery Status Tracking**: Track email delivery status and failures
4. **Email Analytics**: Track email open rates and engagement
5. **PDF Password Protection**: Optional password protection for sensitive reports
6. **Email Queue System**: Redis-based queue for better scalability

## Integration with Frontend

The frontend Reports component should be updated to include:

1. **Email Delivery Form**: Recipients input, subject, message fields
2. **Email Button**: "Email Report" action alongside download options
3. **Delivery Confirmation**: Success/failure notifications
4. **Recipient Management**: Save frequently used email addresses

Example frontend integration:

```typescript
const emailReport = async (emailData: EmailReportRequest) => {
  try {
    const response = await fetch('/api/reports/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(emailData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      toast.success(`Report emailed to ${result.recipients} recipient(s)`);
    } else {
      toast.error(result.error);
    }
  } catch (error) {
    toast.error('Failed to email report');
  }
};
```

## Troubleshooting

### Common Issues

1. **Template Not Found**: Run template setup script
2. **Email Not Sending**: Check email configuration and provider settings
3. **Attachment Too Large**: Most providers limit to 25MB
4. **Permission Denied**: Check user role and report access permissions
5. **Invalid Recipients**: Validate email address formats

### Debug Steps

1. Check email configuration in database
2. Verify template exists with `report-delivery` slug
3. Test email provider connectivity
4. Check server logs for detailed error messages
5. Validate report generation works independently

## Monitoring and Logging

The system provides comprehensive logging:

- **Email Delivery Attempts**: Logged to `EmailLog` collection
- **Report Generation**: Standard report service logging
- **Error Tracking**: Detailed error messages and stack traces
- **Performance Metrics**: Email delivery timing and success rates

## Compliance and Privacy

- **GDPR Compliance**: Respect email preferences and unsubscribe options
- **Data Protection**: Confidential business information warnings
- **Audit Trail**: Complete logging of email deliveries
- **Access Control**: Role-based permissions maintained

## Conclusion

The report email delivery system provides a complete solution for automatically distributing business reports to stakeholders. The implementation is secure, scalable, and integrates seamlessly with the existing infrastructure while maintaining high professional standards for business communications.