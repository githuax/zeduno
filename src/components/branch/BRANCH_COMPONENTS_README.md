# Branch Management Components

This document describes the comprehensive branch management system components created for the Dine Serve Hub application.

## Components Overview

### 1. BranchManagementDashboard.tsx
**Main dashboard component** providing complete branch management functionality.

**Features:**
- Branch overview with table and grid views
- Create, edit, delete, and clone branches
- Search and filtering capabilities
- Bulk operations (activate, deactivate, delete)
- Import/export functionality
- Branch hierarchy visualization
- Real-time auto-refresh
- Permission-based access control
- Responsive design for mobile and desktop

**Usage:**
```tsx
import { BranchManagementDashboard } from '@/components/branch';

function AdminPanel() {
  return <BranchManagementDashboard />;
}
```

### 2. BranchCard.tsx
**Individual branch display card** with comprehensive branch information.

**Features:**
- Branch logo/icon with fallback
- Status and type indicators
- Location and contact information
- Performance metrics (revenue, orders, AOV)
- Operational hours display
- Action buttons (view, edit, clone, delete)
- Selection checkbox for bulk operations
- Loading and error states
- Hover effects and tooltips

**Props:**
```tsx
interface BranchCardProps {
  branch: Branch;
  selected: boolean;
  onSelect: (branchId: string, checked: boolean) => void;
  onView: (branch: Branch) => void;
  onEdit: (branch: Branch) => void;
  onClone: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
  canEdit: (branch: Branch) => boolean;
  loading?: boolean;
}
```

### 3. CreateBranchModal.tsx
**Multi-step wizard modal** for creating new branches.

**Features:**
- 5-step wizard with validation
- Basic information (name, type, parent)
- Location and contact details
- Operations (hours, capacity, days)
- Financial settings (currency, taxes, payments)
- Additional settings (inventory, staffing, integrations)
- Form validation with error handling
- Step navigation with completion tracking
- Responsive design with sidebar navigation

**Usage:**
```tsx
import { CreateBranchModal } from '@/components/branch';

function BranchManagement() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <CreateBranchModal
      open={showModal}
      onOpenChange={setShowModal}
      onSubmit={handleCreateBranch}
      branches={branches}
      loading={loading}
    />
  );
}
```

### 4. EditBranchModal.tsx
**Tabbed modal** for editing existing branch settings.

**Features:**
- 6 organized tabs (Basic, Location, Operations, Financial, Staff, Settings)
- Live form validation
- Change tracking with unsaved changes indicator
- Support for all branch properties
- Integration settings (POS systems, kitchen displays)
- Bank account configuration
- Menu configuration options
- Responsive tabbed interface

**Props:**
```tsx
interface EditBranchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: Branch | null;
  onSubmit: (data: UpdateBranchData) => Promise<void>;
  loading?: boolean;
  onSuccess?: () => void;
}
```

### 5. BranchHierarchyView.tsx
**Tree view component** for visualizing branch relationships.

**Features:**
- Hierarchical tree structure with expand/collapse
- Search and status filtering
- Performance metrics display
- Summary statistics dashboard
- Interactive node selection
- Branch creation from parent nodes
- Visual indicators for branch types and status
- Responsive design with scrollable area

**Usage:**
```tsx
import { BranchHierarchyView } from '@/components/branch';

function HierarchyPage() {
  return (
    <BranchHierarchyView
      hierarchy={hierarchyData}
      onSelectBranch={handleSelectBranch}
      onEditBranch={handleEditBranch}
      showMetrics={true}
      showActions={true}
      canEdit={canEditBranch}
    />
  );
}
```

### 6. BranchMetricsCard.tsx
**Performance metrics display** with comprehensive analytics.

**Features:**
- Key performance indicators (KPIs)
- Period selection (today, week, month, quarter, year)
- Comparison with previous periods
- Target tracking with progress bars
- Performance indicators with color coding
- Daily averages calculation
- Branch operational information
- Refresh functionality
- Currency formatting

**Props:**
```tsx
interface BranchMetricsCardProps {
  branch: Branch;
  metrics?: BranchMetrics;
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
  onPeriodChange?: (period: string) => void;
  onRefresh?: () => void;
  showComparison?: boolean;
  comparisonData?: {
    previousPeriod: BranchMetrics;
    target?: { revenue: number; orders: number; };
  };
}
```

### 7. BranchNavigationSwitcher.tsx
**Enhanced branch switching component** for navigation.

**Features:**
- Three variants: default, compact, minimal
- Recent branches tracking
- Search functionality
- Branch grouping (current, recent, all)
- Avatar/logo display
- Performance metrics preview
- Quick actions (create, manage)
- Keyboard navigation support

**Variants:**
- **Default**: Full-featured dropdown with search and grouping
- **Compact**: Streamlined version with essential info
- **Minimal**: Icon-only button for limited space

**Usage:**
```tsx
import { BranchNavigationSwitcher } from '@/components/branch';

function Header() {
  return (
    <BranchNavigationSwitcher
      variant="compact"
      showCreateButton={true}
      showManageButton={true}
      onCreateBranch={handleCreateBranch}
      onManageBranches={handleManageBranches}
    />
  );
}
```

## Integration with Existing System

### Hooks Integration
All components integrate with the existing `useBranches` hook:
```tsx
import { useBranches } from '@/hooks/useBranches';

const {
  branches,
  currentBranch,
  createBranch,
  updateBranch,
  deleteBranch,
  switchBranch,
  canUserAccessBranch,
  canUserSwitchBranches
} = useBranches();
```

### Permission System
Components respect the existing permission system:
- **Admin/SuperAdmin**: Full access to all branches and operations
- **Branch Staff**: Limited to assigned branches
- **Role-based actions**: Edit, delete, and create permissions

### Type Safety
All components use TypeScript with comprehensive type definitions from:
- `@/types/branch.types`
- Full IntelliSense support
- Runtime type checking

## UI/UX Features

### Design System
- **shadcn/ui components**: Consistent with existing design system
- **Lucide React icons**: Modern iconography
- **Responsive design**: Works on mobile, tablet, and desktop
- **Accessibility**: WCAG compliant with keyboard navigation
- **Dark mode**: Supports theme switching

### Performance
- **Loading states**: Skeleton loaders and loading indicators
- **Error handling**: Graceful error states with retry options
- **Optimistic updates**: Immediate UI feedback
- **Memoization**: Optimized re-renders

### User Experience
- **Progressive disclosure**: Step-by-step workflows
- **Contextual help**: Tooltips and descriptions
- **Confirmation dialogs**: Prevent accidental destructive actions
- **Search and filters**: Quick data discovery
- **Bulk operations**: Efficient management of multiple branches

## File Structure

```
src/components/branch/
├── BranchManagementDashboard.tsx    # Main dashboard
├── BranchCard.tsx                   # Individual branch card
├── CreateBranchModal.tsx            # Branch creation wizard
├── EditBranchModal.tsx              # Branch editing interface
├── BranchHierarchyView.tsx          # Hierarchy tree view
├── BranchMetricsCard.tsx            # Performance metrics
├── BranchNavigationSwitcher.tsx     # Navigation switcher
├── index.ts                         # Component exports
└── BRANCH_COMPONENTS_README.md      # This documentation
```

## Dependencies

### Required UI Components
- All components from `@/components/ui/*`
- Progress bar, Avatar, Tooltip components
- Form components (Input, Select, Checkbox, Switch)

### External Libraries
- Lucide React (icons)
- React Query (data fetching)
- Date-fns (date formatting)

## Example Implementation

```tsx
// pages/BranchManagement.tsx
import React, { useState } from 'react';
import {
  BranchManagementDashboard,
  BranchNavigationSwitcher,
  CreateBranchModal,
  EditBranchModal
} from '@/components/branch';
import { useBranches } from '@/hooks/useBranches';

export function BranchManagementPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <h1>Branch Management</h1>
        <BranchNavigationSwitcher
          showCreateButton={true}
          onCreateBranch={() => setShowCreateModal(true)}
        />
      </div>
      
      {/* Main Dashboard */}
      <BranchManagementDashboard />
      
      {/* Modals */}
      <CreateBranchModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        // ... other props
      />
    </div>
  );
}
```

This comprehensive branch management system provides a complete solution for multi-branch restaurant operations with modern UI patterns, robust functionality, and seamless integration with the existing codebase.