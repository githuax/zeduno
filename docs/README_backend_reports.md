# Report Generation System

This directory contains Handlebars templates for generating professional PDF and Excel reports for the restaurant management system.

## Available Report Templates

### 1. Sales Report (`sales-report.hbs`)
- **Purpose**: Comprehensive sales performance analysis
- **Features**:
  - Sales summary with key metrics
  - Revenue breakdown by period, branch, payment method
  - Order type analysis
  - Peak hours identification
  - Financial breakdown with taxes, discounts, tips

### 2. Menu Performance Report (`menu-performance.hbs`)
- **Purpose**: Analysis of menu item and category performance
- **Features**:
  - Top performing menu items
  - Category performance analysis
  - Underperforming items identification
  - Stock alerts and inventory management
  - Menu optimization recommendations

### 3. Customer Analytics Report (`customer-analytics.hbs`)
- **Purpose**: Customer behavior and segmentation analysis
- **Features**:
  - Customer segmentation (VIP, Premium, Regular, etc.)
  - Behavior patterns (order types, payment preferences)
  - Top valued customers
  - Customer satisfaction metrics
  - Retention and acquisition insights

### 4. Financial Summary Report (`financial-summary.hbs`)
- **Purpose**: Detailed financial breakdown and analysis
- **Features**:
  - Revenue waterfall analysis
  - Payment method performance
  - Tax breakdown by rates
  - Discount impact analysis
  - Financial KPIs and recommendations

### 5. Staff Performance Report (`staff-performance.hbs`)
- **Purpose**: Individual and team performance analysis
- **Features**:
  - Individual staff rankings
  - Performance by branch and role
  - Productivity metrics
  - Performance badges and ratings

### 6. Branch Performance Report (`branch-performance.hbs`)
- **Purpose**: Comparative branch performance analysis
- **Features**:
  - Branch ranking and market share
  - Performance metrics comparison
  - Top performing branches
  - Strategic recommendations
  - Resource allocation insights

## Template Structure

Each template follows a consistent structure:

1. **Header Section**: Company info, report title, generation details
2. **Summary Cards**: Key metrics in highlighted cards
3. **Data Sections**: Detailed tables and analysis
4. **Insights**: Recommendations and strategic insights
5. **Footer**: Generation metadata and confidentiality notices

## Styling Features

- **Responsive Design**: Works well in PDF and print formats
- **Professional Colors**: Each report type has its own color scheme
- **Data Visualization**: Progress bars, badges, and visual indicators
- **Typography**: Clear hierarchy with proper font sizes and weights
- **Print Optimization**: Page breaks and print-specific styling

## Handlebars Helpers

The templates use custom Handlebars helpers for:

- `formatCurrency`: Format numbers as currency
- `formatNumber`: Format numbers with commas
- `formatPercent`: Format percentages
- `formatDate`: Format dates
- `formatDateTime`: Format date and time
- Mathematical operations: `add`, `subtract`, `multiply`, `divide`
- Comparisons: `eq`, `gt`, `lt`

## Color Schemes

- **Sales Report**: Blue (#4472C4)
- **Menu Performance**: Green (#28a745)
- **Customer Analytics**: Teal (#17a2b8)
- **Financial Summary**: Purple (#6f42c1)
- **Staff Performance**: Orange (#fd7e14)
- **Branch Performance**: Pink (#e83e8c)

## Customization

To customize templates:

1. Modify the CSS styles in the `<style>` section
2. Adjust the color variables for different branding
3. Add new sections by following the existing structure
4. Ensure proper Handlebars syntax for data binding

## Data Requirements

Each template expects specific data structures. Refer to the TypeScript interfaces in `/types/report.types.ts` for complete data structure definitions.

## Print Considerations

- Templates use CSS media queries for print optimization
- Page breaks are strategically placed to avoid content splitting
- Headers and footers are designed for PDF generation
- Color schemes work well in both color and grayscale printing

## Best Practices

1. **Performance**: Keep templates lightweight with efficient CSS
2. **Accessibility**: Use proper heading hierarchy and contrast ratios
3. **Consistency**: Follow the established design patterns
4. **Responsiveness**: Ensure templates work across different screen sizes
5. **Print-Friendly**: Test templates in PDF format before deployment

## Adding New Templates

To add a new report template:

1. Create a new `.hbs` file in this directory
2. Follow the existing structure and styling patterns
3. Add corresponding TypeScript interfaces
4. Update the ReportService to handle the new template
5. Add appropriate controller methods and routes

## Support

For template-related issues or customization requests, refer to the main documentation or contact the development team.