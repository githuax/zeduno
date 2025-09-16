# BranchMetrics Component

A comprehensive branch performance analytics dashboard component built with React and TypeScript. This component provides detailed insights into branch performance, including revenue trends, order analytics, customer insights, and performance alerts.

## Features

- **📊 Comprehensive KPI Cards**: Revenue, Orders, AOV, Customer Retention with growth indicators
- **📈 Interactive Charts**: Revenue trends, order analysis, and performance metrics using Recharts
- **📅 Date Range Selection**: Presets (7 days, 30 days, 3 months, etc.) and custom date ranges
- **🏢 Branch Selection**: View metrics for specific branches or consolidated data across all branches
- **🔄 Real-time Updates**: Auto-refresh functionality with customizable intervals
- **📤 Export Functionality**: Export reports as PDF or CSV
- **🎨 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **⚠️ Performance Alerts**: Intelligent insights and notifications for key metrics
- **🔍 Advanced Analytics**: Customer insights, peak hours, best-selling categories

## Installation

The component is part of the branch components module. Make sure you have the required dependencies:

```bash
npm install recharts react-day-picker lucide-react
```

## Basic Usage

```tsx
import { BranchMetrics } from '@/components/branch';

function AnalyticsDashboard() {
  return (
    <div className="p-6">
      <h1>Branch Analytics</h1>
      <BranchMetrics />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `branchId` | `string` | `undefined` | Specific branch ID to analyze. If not provided, shows consolidated metrics |
| `className` | `string` | `undefined` | Additional CSS classes for styling |
| `autoRefresh` | `boolean` | `false` | Enable automatic data refresh |
| `refreshInterval` | `number` | `300000` | Auto-refresh interval in milliseconds (default: 5 minutes) |

## Advanced Usage

### With Auto-refresh

```tsx
<BranchMetrics 
  autoRefresh={true}
  refreshInterval={180000} // 3 minutes
/>
```

### For Specific Branch

```tsx
<BranchMetrics 
  branchId="branch-123"
  className="max-w-7xl mx-auto"
/>
```

### In Dashboard Layout

```tsx
<div className="dashboard-container">
  <header>Branch Analytics Dashboard</header>
  <BranchMetrics 
    autoRefresh={true}
    className="dashboard-metrics"
  />
</div>
```

## Data Structure

The component expects the following data structure from the API:

### Basic Metrics (from useBranches hook)
```typescript
interface BranchMetrics {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    totalItems: number;
  };
  daily: Array<{
    _id: string;
    orders: number;
    revenue: number;
  }>;
}
```

### Enhanced Metrics (transformed by component)
```typescript
interface EnhancedBranchMetrics {
  summary: {
    // Basic metrics plus
    orderGrowthRate: number;
    revenueGrowthRate: number;
    peakHour: string;
    bestSellingCategory: string;
    customerRetentionRate: number;
  };
  daily: Array<{
    date: string;
    orders: number;
    revenue: number;
    avgOrderValue: number;
    itemsSold: number;
    newCustomers: number;
  }>;
  customerInsights: {
    totalCustomers: number;
    returningCustomers: number;
    newCustomers: number;
    avgOrdersPerCustomer: number;
  };
  alerts: Array<{
    type: 'warning' | 'info' | 'success';
    message: string;
    metric: string;
    value: number;
  }>;
}
```

## API Integration

The component integrates with the existing `useBranches` hook and expects the following API endpoints:

- `GET /api/branches/{branchId}/metrics` - Branch-specific metrics
- `GET /api/branches/metrics/consolidated` - Consolidated metrics across all branches

### Query Parameters
- `startDate` - ISO date string for period start
- `endDate` - ISO date string for period end

## Features in Detail

### 1. KPI Cards
Displays key performance indicators with:
- Current values with proper currency formatting
- Growth indicators (positive/negative trends)
- Comparison with previous periods
- Visual icons for each metric

### 2. Interactive Charts
Built with Recharts library:
- **Revenue Trends**: Area chart showing daily revenue and orders
- **Order Analysis**: Bar charts for order volume and line charts for AOV
- **Performance Overview**: Key metrics visualization
- **Customer Insights**: Customer behavior analytics

### 3. Date Range Selection
- **Presets**: Last 7 days, 30 days, 3 months, 6 months, This year
- **Custom Range**: Date picker for specific periods
- **Smart Defaults**: Defaults to last 30 days for optimal performance

### 4. Export Functionality
- **PDF Export**: Formatted report with charts and data tables
- **CSV Export**: Raw data export for further analysis
- **Loading States**: Visual feedback during export operations

### 5. Real-time Updates
- Configurable auto-refresh intervals
- Visual indicators showing last update time
- Manual refresh capability
- Automatic pause when component is not visible

## Styling

The component uses Tailwind CSS for styling and follows the design system patterns:

```tsx
// Custom styling example
<BranchMetrics 
  className="bg-white rounded-lg shadow-lg p-6 space-y-8"
/>
```

## Performance Considerations

- **Data Caching**: Metrics are cached to avoid unnecessary API calls
- **Lazy Loading**: Charts are rendered only when visible
- **Responsive Images**: Optimized for different screen sizes
- **Memory Management**: Proper cleanup of intervals and subscriptions

## Error Handling

The component includes comprehensive error handling:
- API error display with user-friendly messages
- Loading states during data fetching
- Graceful fallbacks for missing data
- Retry mechanisms for failed requests

## Accessibility

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **High Contrast**: Compatible with high contrast themes
- **Focus Management**: Clear focus indicators

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Dependencies

- React 18+
- TypeScript 4.5+
- Recharts 2.5+
- Tailwind CSS 3.0+
- Lucide React (for icons)
- React Day Picker (for date selection)

## Contributing

When contributing to this component:
1. Follow the existing TypeScript patterns
2. Add proper error handling for new features
3. Update tests for any changes
4. Ensure accessibility compliance
5. Test on multiple screen sizes

## Examples

See `BranchMetrics.example.tsx` for complete usage examples including:
- Basic implementation
- Dashboard integration
- Auto-refresh setup
- Custom styling approaches