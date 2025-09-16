import React from 'react';

import BranchSelector from './BranchSelector';

/**
 * Example usage of the BranchSelector component
 */

// Basic usage with full details
const BasicExample = () => {
  return (
    <div className="max-w-md mx-auto p-4">
      <BranchSelector />
    </div>
  );
};

// Compact version without details
const CompactExample = () => {
  return (
    <div className="max-w-sm mx-auto p-4">
      <BranchSelector compact={true} showDetails={false} />
    </div>
  );
};

// With custom styling
const CustomStyledExample = () => {
  return (
    <div className="max-w-lg mx-auto p-4">
      <BranchSelector 
        className="border-2 border-blue-200 shadow-lg"
        showDetails={true}
      />
    </div>
  );
};

// In a sidebar or dashboard layout
const SidebarExample = () => {
  return (
    <div className="w-64 p-4 bg-gray-50">
      <BranchSelector compact={true} />
    </div>
  );
};

export {
  BasicExample,
  CompactExample,
  CustomStyledExample,
  SidebarExample
};