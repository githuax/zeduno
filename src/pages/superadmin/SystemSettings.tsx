import React from 'react';

import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

const SystemSettings = () => {
  return (
    <SuperAdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">System Settings</h1>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                System Configuration
              </h2>
              <p className="text-gray-600 mb-6">
                Simplified version loaded successfully. The full system settings features are temporarily disabled to resolve loading issues.
              </p>
              <div className="text-sm text-gray-500">
                This component has been temporarily simplified to fix dynamic import errors.
                The full functionality will be restored once the underlying issues are resolved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SystemSettings;