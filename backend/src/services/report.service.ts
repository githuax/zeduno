import fs from 'fs';
import path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import ExcelJS from 'exceljs';
import handlebars from 'handlebars';
import { 
  ReportType, 
  ReportConfig, 
  ReportData, 
  ReportTemplateContext,
  ExcelWorksheetConfig,
  ReportGenerationError,
  ReportValidationError,
  ReportGenerationResponse
} from '../types/report.types';

export class ReportService {
  private static instance: ReportService;
  private readonly templatesPath: string;
  private readonly outputPath: string;
  private browser: Browser | null = null;

  private constructor() {
    this.templatesPath = path.join(__dirname, '../templates/reports');
    this.outputPath = path.join(process.cwd(), 'reports');
    
    // Ensure output directory exists
    this.ensureDirectoryExists(this.outputPath);
    this.ensureDirectoryExists(this.templatesPath);
  }

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  /**
   * Generate a report in the specified format
   */
  public async generateReport(
    type: ReportType,
    data: ReportData,
    config: ReportConfig,
    context: Omit<ReportTemplateContext, 'data' | 'config'>
  ): Promise<ReportGenerationResponse> {
    try {
      this.validateReportConfig(config);

      const reportId = this.generateReportId();
      const fileName = config.fileName || `${type}-report-${reportId}.${config.format}`;
      const filePath = path.join(this.outputPath, fileName);

      const templateContext: ReportTemplateContext = {
        ...context,
        data,
        config,
      };

      let downloadUrl: string;

      if (config.format === 'pdf') {
        downloadUrl = await this.generatePDFReport(type, templateContext, filePath);
      } else if (config.format === 'excel') {
        downloadUrl = await this.generateExcelReport(type, templateContext, filePath);
      } else {
        throw new ReportValidationError('Unsupported report format');
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Reports expire after 24 hours

      return {
        success: true,
        reportId,
        fileName,
        downloadUrl,
        filePath,
        generatedAt: new Date(),
        expiresAt,
      };

    } catch (error) {
      console.error('Report generation failed:', error);
      
      if (error instanceof ReportValidationError || error instanceof ReportGenerationError) {
        throw error;
      }
      
      throw new ReportGenerationError(`Failed to generate ${type} report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate PDF report using Puppeteer and Handlebars
   */
  private async generatePDFReport(
    type: ReportType,
    context: ReportTemplateContext,
    outputPath: string
  ): Promise<string> {
    try {
      const templatePath = path.join(this.templatesPath, `${type}-report.hbs`);
      
      if (!fs.existsSync(templatePath)) {
        throw new ReportGenerationError(`Template not found: ${templatePath}`);
      }

      // Load and compile template
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);
      
      // Register custom helpers
      this.registerHandlebarsHelpers();

      // Generate HTML content
      const htmlContent = template(context);

      // Generate PDF using Puppeteer
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      }

      const page = await this.browser.newPage();
      
      // Set page content and wait for network idle
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF with custom options
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(context),
        footerTemplate: this.getFooterTemplate(context),
      });

      await page.close();

      return `/api/reports/download/${path.basename(outputPath)}`;

    } catch (error) {
      throw new ReportGenerationError(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Excel report using ExcelJS
   */
  private async generateExcelReport(
    type: ReportType,
    context: ReportTemplateContext,
    outputPath: string
  ): Promise<string> {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Set workbook properties
      workbook.creator = context.generatedBy.userName;
      workbook.lastModifiedBy = context.generatedBy.userName;
      workbook.created = context.generatedAt;
      workbook.modified = context.generatedAt;
      workbook.title = context.title;

      // Generate worksheets based on report type
      await this.generateExcelWorksheets(workbook, type, context);

      // Write to file
      await workbook.xlsx.writeFile(outputPath);

      return `/api/reports/download/${path.basename(outputPath)}`;

    } catch (error) {
      throw new ReportGenerationError(`Excel generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Excel worksheets based on report type
   */
  private async generateExcelWorksheets(
    workbook: ExcelJS.Workbook,
    type: ReportType,
    context: ReportTemplateContext
  ): Promise<void> {
    const data = context.data;

    switch (type) {
      case 'sales':
        await this.createSalesWorksheets(workbook, data as any);
        break;
      case 'menu-performance':
        await this.createMenuPerformanceWorksheets(workbook, data as any);
        break;
      case 'customer-analytics':
        await this.createCustomerAnalyticsWorksheets(workbook, data as any);
        break;
      case 'financial-summary':
        await this.createFinancialSummaryWorksheets(workbook, data as any);
        break;
      case 'staff-performance':
        await this.createStaffPerformanceWorksheets(workbook, data as any);
        break;
      case 'branch-performance':
        await this.createBranchPerformanceWorksheets(workbook, data as any);
        break;
      default:
        throw new ReportGenerationError(`Unknown report type: ${type}`);
    }
  }

  /**
   * Create Sales Report Excel worksheets
   */
  private async createSalesWorksheets(workbook: ExcelJS.Workbook, data: any): Promise<void> {
    // Summary worksheet
    const summaryWs = workbook.addWorksheet('Summary');
    this.setupWorksheetHeaders(summaryWs, 'Sales Summary Report');
    
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Orders', data.summary.totalOrders],
      ['Total Revenue', data.summary.totalRevenue],
      ['Average Order Value', data.summary.avgOrderValue],
      ['Completed Orders', data.summary.completedOrders],
      ['Cancelled Orders', data.summary.cancelledOrders],
      ['Total Tax', data.summary.taxAmount || 0],
      ['Total Discounts', data.summary.discountAmount || 0],
    ];

    summaryWs.addRows(summaryData);
    this.formatSummaryWorksheet(summaryWs);

    // By Period worksheet
    if (data.byPeriod && data.byPeriod.length > 0) {
      const periodWs = workbook.addWorksheet('By Period');
      this.setupWorksheetHeaders(periodWs, 'Sales by Period');
      
      const periodHeaders = ['Period', 'Orders', 'Revenue', 'Avg Order Value'];
      periodWs.addRow(periodHeaders);
      
      data.byPeriod.forEach((period: any) => {
        periodWs.addRow([
          period.formattedDate || period.period,
          period.totalOrders,
          period.totalRevenue,
          period.avgOrderValue
        ]);
      });
      
      this.formatDataWorksheet(periodWs);
    }

    // By Branch worksheet
    if (data.byBranch && data.byBranch.length > 0) {
      const branchWs = workbook.addWorksheet('By Branch');
      this.setupWorksheetHeaders(branchWs, 'Sales by Branch');
      
      const branchHeaders = ['Branch Code', 'Branch Name', 'Orders', 'Revenue', 'Avg Order Value'];
      branchWs.addRow(branchHeaders);
      
      data.byBranch.forEach((branch: any) => {
        branchWs.addRow([
          branch.branchCode,
          branch.branchName,
          branch.totalOrders,
          branch.totalRevenue,
          branch.avgOrderValue
        ]);
      });
      
      this.formatDataWorksheet(branchWs);
    }

    // By Payment Method worksheet
    if (data.byPaymentMethod && data.byPaymentMethod.length > 0) {
      const paymentWs = workbook.addWorksheet('By Payment Method');
      this.setupWorksheetHeaders(paymentWs, 'Sales by Payment Method');
      
      const paymentHeaders = ['Payment Method', 'Orders', 'Revenue', 'Percentage'];
      paymentWs.addRow(paymentHeaders);
      
      data.byPaymentMethod.forEach((payment: any) => {
        paymentWs.addRow([
          payment.paymentMethod,
          payment.totalOrders,
          payment.totalRevenue,
          `${payment.percentage}%`
        ]);
      });
      
      this.formatDataWorksheet(paymentWs);
    }
  }

  /**
   * Create Menu Performance Excel worksheets
   */
  private async createMenuPerformanceWorksheets(workbook: ExcelJS.Workbook, data: any): Promise<void> {
    // Top Performing Items worksheet
    const topItemsWs = workbook.addWorksheet('Top Performing Items');
    this.setupWorksheetHeaders(topItemsWs, 'Top Performing Menu Items');
    
    const itemHeaders = ['Item Name', 'Category', 'Total Ordered', 'Revenue', 'Avg Price', 'Popularity Score'];
    topItemsWs.addRow(itemHeaders);
    
    data.topPerformingItems.forEach((item: any) => {
      topItemsWs.addRow([
        item.itemName,
        item.categoryName,
        item.totalOrdered,
        item.totalRevenue,
        item.avgPrice,
        item.popularity
      ]);
    });
    
    this.formatDataWorksheet(topItemsWs);

    // Category Performance worksheet
    const categoryWs = workbook.addWorksheet('Category Performance');
    this.setupWorksheetHeaders(categoryWs, 'Category Performance');
    
    const categoryHeaders = ['Category Name', 'Total Items', 'Total Ordered', 'Revenue', 'Popularity Score'];
    categoryWs.addRow(categoryHeaders);
    
    data.categoryPerformance.forEach((category: any) => {
      categoryWs.addRow([
        category.categoryName,
        category.totalItems,
        category.totalOrdered,
        category.totalRevenue,
        category.popularityScore
      ]);
    });
    
    this.formatDataWorksheet(categoryWs);
  }

  /**
   * Create Customer Analytics Excel worksheets
   */
  private async createCustomerAnalyticsWorksheets(workbook: ExcelJS.Workbook, data: any): Promise<void> {
    // Customer Summary worksheet
    const summaryWs = workbook.addWorksheet('Customer Summary');
    this.setupWorksheetHeaders(summaryWs, 'Customer Analytics Summary');
    
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Customers', data.summary.totalCustomers],
      ['New Customers', data.summary.newCustomers],
      ['Returning Customers', data.summary.returningCustomers],
      ['Avg Orders per Customer', data.summary.avgOrdersPerCustomer],
      ['Avg Revenue per Customer', data.summary.avgRevenuePerCustomer],
      ['Customer Retention Rate', `${data.summary.customerRetentionRate}%`],
    ];

    summaryWs.addRows(summaryData);
    this.formatSummaryWorksheet(summaryWs);

    // Top Customers worksheet
    if (data.topCustomers && data.topCustomers.length > 0) {
      const topCustomersWs = workbook.addWorksheet('Top Customers');
      this.setupWorksheetHeaders(topCustomersWs, 'Top Customers');
      
      const customerHeaders = ['Customer Name', 'Total Orders', 'Total Spent', 'Avg Order Value', 'Last Order Date'];
      topCustomersWs.addRow(customerHeaders);
      
      data.topCustomers.forEach((customer: any) => {
        topCustomersWs.addRow([
          customer.customerName,
          customer.totalOrders,
          customer.totalSpent,
          customer.avgOrderValue,
          customer.lastOrderDate
        ]);
      });
      
      this.formatDataWorksheet(topCustomersWs);
    }
  }

  /**
   * Create Financial Summary Excel worksheets
   */
  private async createFinancialSummaryWorksheets(workbook: ExcelJS.Workbook, data: any): Promise<void> {
    // Financial Summary worksheet
    const summaryWs = workbook.addWorksheet('Financial Summary');
    this.setupWorksheetHeaders(summaryWs, 'Financial Summary Report');
    
    const summaryData = [
      ['Metric', 'Amount'],
      ['Gross Revenue', data.summary.grossRevenue],
      ['Net Revenue', data.summary.netRevenue],
      ['Total Tax', data.summary.totalTax],
      ['Total Discounts', data.summary.totalDiscounts],
      ['Total Tips', data.summary.totalTips],
      ['Total Service Charges', data.summary.totalServiceCharges],
      ['Total Refunds', data.summary.totalRefunds],
      ['Total Transactions', data.summary.totalTransactions],
      ['Avg Transaction Value', data.summary.avgTransactionValue],
    ];

    summaryWs.addRows(summaryData);
    this.formatSummaryWorksheet(summaryWs);

    // Payment Methods worksheet
    if (data.paymentMethods && data.paymentMethods.length > 0) {
      const paymentWs = workbook.addWorksheet('Payment Methods');
      this.setupWorksheetHeaders(paymentWs, 'Payment Method Breakdown');
      
      const paymentHeaders = ['Payment Method', 'Transactions', 'Total Amount', 'Percentage', 'Success Rate'];
      paymentWs.addRow(paymentHeaders);
      
      data.paymentMethods.forEach((payment: any) => {
        paymentWs.addRow([
          payment.paymentMethod,
          payment.transactionCount,
          payment.totalAmount,
          `${payment.percentage}%`,
          `${payment.successRate}%`
        ]);
      });
      
      this.formatDataWorksheet(paymentWs);
    }
  }

  /**
   * Create Staff Performance Excel worksheets
   */
  private async createStaffPerformanceWorksheets(workbook: ExcelJS.Workbook, data: any): Promise<void> {
    // Staff Performance worksheet
    const staffWs = workbook.addWorksheet('Staff Performance');
    this.setupWorksheetHeaders(staffWs, 'Staff Performance Report');
    
    const staffHeaders = ['Staff Name', 'Role', 'Branch', 'Orders Processed', 'Revenue', 'Avg Order Value', 'Productivity'];
    staffWs.addRow(staffHeaders);
    
    data.staffPerformance.forEach((staff: any) => {
      staffWs.addRow([
        staff.staffName,
        staff.role,
        staff.branchName,
        staff.ordersProcessed,
        staff.totalRevenue,
        staff.avgOrderValue,
        staff.productivity
      ]);
    });
    
    this.formatDataWorksheet(staffWs);
  }

  /**
   * Create Branch Performance Excel worksheets
   */
  private async createBranchPerformanceWorksheets(workbook: ExcelJS.Workbook, data: any): Promise<void> {
    // Branch Performance worksheet
    const branchWs = workbook.addWorksheet('Branch Performance');
    this.setupWorksheetHeaders(branchWs, 'Branch Performance Report');
    
    const branchHeaders = ['Branch Code', 'Branch Name', 'Orders', 'Revenue', 'Staff Count', 'Market Share', 'Growth Rate'];
    branchWs.addRow(branchHeaders);
    
    data.branchPerformance.forEach((branch: any) => {
      branchWs.addRow([
        branch.branchCode,
        branch.branchName,
        branch.totalOrders,
        branch.totalRevenue,
        branch.staffCount,
        `${branch.marketShare}%`,
        `${branch.growthRate}%`
      ]);
    });
    
    this.formatDataWorksheet(branchWs);
  }

  /**
   * Setup worksheet headers with title and metadata
   */
  private setupWorksheetHeaders(worksheet: ExcelJS.Worksheet, title: string): void {
    // Add title row
    worksheet.addRow([title]);
    worksheet.getRow(1).font = { size: 16, bold: true };
    worksheet.getRow(1).alignment = { horizontal: 'center' };
    
    // Add metadata rows
    worksheet.addRow([`Generated: ${new Date().toLocaleString()}`]);
    worksheet.addRow([]); // Empty row for spacing
  }

  /**
   * Format summary worksheet
   */
  private formatSummaryWorksheet(worksheet: ExcelJS.Worksheet): void {
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 25;
    });
    
    // Format header row
    const headerRow = worksheet.getRow(4);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add borders
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 4) {
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });
  }

  /**
   * Format data worksheet
   */
  private formatDataWorksheet(worksheet: ExcelJS.Worksheet): void {
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });
    
    // Format header row (row 4 after title and metadata)
    const headerRow = worksheet.getRow(4);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    
    // Add borders and alternating row colors
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 4) {
        // Alternating row colors
        if (rowNumber > 4 && (rowNumber - 4) % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F9FA' }
          };
        }
        
        // Add borders
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHandlebarsHelpers(): void {
    // Format currency helper
    handlebars.registerHelper('formatCurrency', function(amount, currency = 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount || 0);
    });

    // Format number helper
    handlebars.registerHelper('formatNumber', function(number) {
      return new Intl.NumberFormat().format(number || 0);
    });

    // Format percentage helper
    handlebars.registerHelper('formatPercent', function(value) {
      return `${(value || 0).toFixed(2)}%`;
    });

    // Format date helper
    handlebars.registerHelper('formatDate', function(date) {
      return new Date(date).toLocaleDateString();
    });

    // Format datetime helper
    handlebars.registerHelper('formatDateTime', function(date) {
      return new Date(date).toLocaleString();
    });

    // Math helpers
    handlebars.registerHelper('add', function(a, b) {
      return (a || 0) + (b || 0);
    });

    handlebars.registerHelper('subtract', function(a, b) {
      return (a || 0) - (b || 0);
    });

    handlebars.registerHelper('multiply', function(a, b) {
      return (a || 0) * (b || 1);
    });

    handlebars.registerHelper('divide', function(a, b) {
      return b !== 0 ? (a || 0) / b : 0;
    });

    // Conditional helpers
    handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });

    handlebars.registerHelper('gt', function(a, b) {
      return a > b;
    });

    handlebars.registerHelper('lt', function(a, b) {
      return a < b;
    });

    // Loop helpers
    handlebars.registerHelper('times', function(n, block) {
      let accum = '';
      for (let i = 0; i < n; ++i) {
        accum += block.fn(i);
      }
      return accum;
    });
  }

  /**
   * Get PDF header template
   */
  private getHeaderTemplate(context: ReportTemplateContext): string {
    return `
      <div style="font-size: 10px; padding: 10px; width: 100%; margin: 0;">
        <div style="float: left;">${context.companyInfo.name}</div>
        <div style="float: right;">${context.title}</div>
        <div style="clear: both;"></div>
      </div>
    `;
  }

  /**
   * Get PDF footer template
   */
  private getFooterTemplate(context: ReportTemplateContext): string {
    return `
      <div style="font-size: 10px; padding: 10px; width: 100%; margin: 0;">
        <div style="float: left;">Generated: ${context.formattedGeneratedAt}</div>
        <div style="float: right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
        <div style="clear: both;"></div>
      </div>
    `;
  }

  /**
   * Validate report configuration
   */
  private validateReportConfig(config: ReportConfig): void {
    if (!config.format || !['pdf', 'excel'].includes(config.format)) {
      throw new ReportValidationError('Invalid report format. Must be pdf or excel');
    }

    if (config.fileName && !/^[a-zA-Z0-9._-]+$/.test(config.fileName)) {
      throw new ReportValidationError('Invalid file name. Only alphanumeric characters, dots, underscores, and hyphens are allowed');
    }
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `report_${timestamp}_${random}`;
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Cleanup method to close browser
   */
  public async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Delete expired reports
   */
  public async cleanupExpiredReports(): Promise<void> {
    try {
      const files = fs.readdirSync(this.outputPath);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(this.outputPath, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Deleted expired report: ${file}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired reports:', error);
    }
  }
}

export default ReportService.getInstance();