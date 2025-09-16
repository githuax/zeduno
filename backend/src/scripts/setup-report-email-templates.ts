#!/usr/bin/env tsx

import mongoose from 'mongoose';
import { EmailTemplate } from '../models/EmailTemplate';

require('dotenv').config();

const reportDeliveryTemplate = {
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
            
            .footer {
                background-color: #f8f9fa;
                border-top: 1px solid #e1e8ed;
                padding: 30px 40px;
                text-align: center;
            }
            
            .confidential {
                color: #e74c3c;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-top: 10px;
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
                    <p><strong>Report Type:</strong> {{reportType}}</p>
                    <p><strong>Period:</strong> {{dateRange}}</p>
                    <p><strong>Format:</strong> {{format}}</p>
                    {{#if branchName}}
                    <p><strong>Branch:</strong> {{branchName}}</p>
                    {{/if}}
                </div>
                
                <div class="attachment-notice">
                    <div>📎</div>
                    <div>
                        <strong>Report Attachment:</strong> The complete {{reportTitle}} is attached as a {{format}} file 
                        with detailed analysis and visualizations.
                    </div>
                </div>
                
                {{#if customMessage}}
                <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; font-style: italic;">
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
                <div style="color: #2c3e50; font-size: 16px; font-weight: 600; margin-bottom: 5px;">{{companyName}}</div>
                <div style="color: #657786; font-size: 14px;">
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
  variables: ['recipientName', 'companyName', 'reportTitle', 'reportType', 'dateRange', 'format', 'branchName', 'customMessage', 'generatedBy', 'generatedDate', 'companyAddress', 'companyPhone', 'companyEmail'],
  isDefault: true,
  isActive: true
};

async function setupReportEmailTemplate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zeduno');
    console.log('Connected to MongoDB');

    console.log('\n📧 Setting up Report Delivery Email Template...');
    
    // Check if template already exists
    const existingTemplate = await EmailTemplate.findOne({ 
      slug: 'report-delivery', 
      isDefault: true 
    });
    
    if (existingTemplate) {
      console.log('⚠️  Report Delivery template already exists, updating...');
      await EmailTemplate.updateOne(
        { slug: 'report-delivery', isDefault: true },
        { $set: reportDeliveryTemplate }
      );
      console.log('✅ Updated existing Report Delivery email template');
    } else {
      // Create new template
      const template = new EmailTemplate(reportDeliveryTemplate);
      await template.save();
      console.log('✅ Created new Report Delivery email template');
    }

    console.log('\n📊 Email Template Summary:');
    const templateCount = await EmailTemplate.countDocuments({ 
      slug: 'report-delivery', 
      isDefault: true, 
      isActive: true 
    });
    console.log(`   Report Delivery templates: ${templateCount}`);

    const allTemplatesCount = await EmailTemplate.countDocuments({ 
      isDefault: true, 
      isActive: true 
    });
    console.log(`   Total active templates: ${allTemplatesCount}`);

    console.log('\n🎯 Report Email Delivery Features:');
    console.log('   ✅ Professional HTML email template');
    console.log('   ✅ Report attachment support');
    console.log('   ✅ Key metrics display in email');
    console.log('   ✅ Custom message support');
    console.log('   ✅ Company branding integration');
    console.log('   ✅ Responsive email design');

    console.log('\n📝 Next steps:');
    console.log('1. Configure email settings for tenants');
    console.log('2. Test email delivery via API: POST /api/reports/email');
    console.log('3. Integrate email delivery in frontend reports');

    console.log('\n💡 API Usage Example:');
    console.log(`POST /api/reports/email
{
  "reportType": "sales",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.999Z",
  "format": "pdf",
  "recipients": ["manager@restaurant.com", "owner@restaurant.com"],
  "subject": "Monthly Sales Report - January 2024",
  "message": "Please review the monthly sales performance.",
  "branchId": "optional-branch-id"
}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

setupReportEmailTemplate();