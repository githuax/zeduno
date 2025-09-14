import React from 'react';

import { BranchMetrics } from './BranchMetrics';

/**
 * Example usage of the BranchMetrics component
 * 
 * This component provides comprehensive branch performance analytics including:
 * - KPI cards with key metrics (revenue, orders, AOV, retention)
 * - Interactive charts for revenue and order trends
 * - Date range selection with presets
 * - Branch comparison functionality
 * - Export capabilities (PDF/CSV)
 * - Real-time data refresh
 * - Performance insights and alerts
 * - Responsive design for all screen sizes
 */

// Basic usage - shows metrics for the current branch
export const BasicBranchMetricsExample: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Branch Performance Analytics</h2>
      <BranchMetrics />
    </div>
  );
};

// Usage with specific branch ID
export const SpecificBranchMetricsExample: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Specific Branch Analytics</h2>
      <BranchMetrics 
        branchId="branch-123"
        className="max-w-7xl mx-auto"
      />
    </div>
  );
};

// Usage with auto-refresh enabled
export const AutoRefreshBranchMetricsExample: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Real-time Branch Analytics</h2>
      <BranchMetrics 
        autoRefresh={true}
        refreshInterval={180000} // 3 minutes
        className="max-w-7xl mx-auto"
      />
    </div>
  );
};

// Usage in a dashboard layout
export const DashboardBranchMetricsExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor branch performance and key business metrics
          </p>
        </div>

        {/* Branch Metrics */}
        <BranchMetrics 
          autoRefresh={true}
          refreshInterval={300000} // 5 minutes
        />

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          Data updates automatically every 5 minutes
        </div>
      </div>
    </div>
  );
};

// Usage with custom styling
export const CustomStyledBranchMetricsExample: React.FC = () => {
  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <BranchMetrics 
          className="space-y-8"
          autoRefresh={true}
        />
      </div>
    </div>
  );
};

export default BasicBranchMetricsExample;