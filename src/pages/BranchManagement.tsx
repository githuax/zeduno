import React from 'react';

import { BranchManagementDashboard } from '@/components/branch';
import { BranchProvider } from '@/contexts/BranchContext';

const BranchManagement = () => {
  return (
    <BranchProvider>
      <div className="min-h-screen bg-gray-50">
        <BranchManagementDashboard />
      </div>
    </BranchProvider>
  );
};

export default BranchManagement;