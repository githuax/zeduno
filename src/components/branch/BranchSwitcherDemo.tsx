import { Building2, ChevronDown } from 'lucide-react';
import React, { useState } from 'react';

import { useBranches } from '@/hooks/useBranches';

import BranchSwitcher from './BranchSwitcher';


/**
 * Demo component showing how to integrate the BranchSwitcher
 * This component can be used in headers, navigation bars, or as a standalone trigger
 */
const BranchSwitcherDemo: React.FC = () => {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const { currentBranch, canUserSwitchBranches } = useBranches();

  const handleOpenSwitcher = () => {
    if (canUserSwitchBranches()) {
      setIsSwitcherOpen(true);
    }
  };

  const handleCloseSwitcher = () => {
    setIsSwitcherOpen(false);
  };

  if (!canUserSwitchBranches()) {
    // Show current branch info without switching capability
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
        <Building2 className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {currentBranch?.name || 'No Branch Selected'}
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Branch Switcher Trigger Button */}
      <button
        onClick={handleOpenSwitcher}
        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group"
        title="Switch Branch (Ctrl+B)"
      >
        <Building2 className="w-4 h-4 text-gray-500 group-hover:text-blue-500" />
        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
          {currentBranch?.name || 'Select Branch'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
      </button>

      {/* Alternative: Header bar version */}
      <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-sm text-gray-600">Current Branch:</span>
        </div>
        <button
          onClick={handleOpenSwitcher}
          className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
        >
          {currentBranch?.name || 'Select Branch'}
        </button>
        <span className="text-xs text-gray-400">Press Ctrl+B</span>
      </div>

      {/* Branch Switcher Modal */}
      <BranchSwitcher
        isOpen={isSwitcherOpen}
        onClose={handleCloseSwitcher}
      />
    </>
  );
};

export default BranchSwitcherDemo;