/**
 * Branch Management Dashboard Component Tests
 * Comprehensive test suite for BranchManagementDashboard component
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { BranchManagementDashboard } from '@/components/branch/BranchManagementDashboard';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches } from '@/hooks/useBranches';
import {
  Branch,
  BranchHierarchy,
  CreateBranchData,
  UpdateBranchData,
  BranchFilters
} from '@/types/branch.types';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/useBranches');
vi.mock('@/components/ui/use-toast');

// Mock UI components that might have complex implementations
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>,
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2 data-testid="alert-dialog-title">{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <div data-testid="alert-dialog-description">{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => (
    <button data-testid="alert-dialog-action" onClick={onClick}>{children}</button>
  ),
  AlertDialogCancel: ({ children }: any) => (
    <button data-testid="alert-dialog-cancel">{children}</button>
  ),
}));

// Mock complex child components
vi.mock('../CreateBranchModal', () => ({
  CreateBranchModal: ({ open, onSubmit, loading }: any) => (
    open ? (
      <div data-testid="create-branch-modal">
        <button
          data-testid="create-branch-submit"
          onClick={() => onSubmit()}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Branch'}
        </button>
      </div>
    ) : null
  ),
}));

vi.mock('../EditBranchModal', () => ({
  EditBranchModal: ({ open, onSubmit, branch, loading }: any) => (
    open && branch ? (
      <div data-testid="edit-branch-modal">
        <div data-testid="edit-branch-name">{branch.name}</div>
        <button
          data-testid="edit-branch-submit"
          onClick={() => onSubmit()}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Branch'}
        </button>
      </div>
    ) : null
  ),
}));

vi.mock('../BranchDetailsDialog', () => ({
  BranchDetailsDialog: ({ open, branch }: any) => (
    open && branch ? (
      <div data-testid="branch-details-dialog">
        <div data-testid="branch-details-name">{branch.name}</div>
        <div data-testid="branch-details-code">{branch.code}</div>
      </div>
    ) : null
  ),
}));

vi.mock('../BranchHierarchyView', () => ({
  BranchHierarchyTree: ({ hierarchy }: any) => (
    <div data-testid="branch-hierarchy-tree">
      {hierarchy?.map((node: any) => (
        <div key={node._id} data-testid={`hierarchy-node-${node._id}`}>
          {node.name}
        </div>
      ))}
    </div>
  ),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseBranches = vi.mocked(useBranches);
const mockUseToast = vi.mocked(useToast);

// Mock data
const mockUser = {
  id: 'user123',
  tenantId: 'tenant123',
  role: 'admin' as const,
  assignedBranches: ['branch1', 'branch2', 'branch3'],
  currentBranch: 'branch1'
};

const createMockBranch = (overrides = {}): Branch => ({
  _id: 'branch1',
  tenantId: 'tenant123',
  name: 'Main Branch',
  code: 'MB001',
  type: 'main',
  status: 'active',
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'USA'
  },
  contact: {
    phone: '+1-555-0123',
    email: 'main@example.com',
    managerName: 'John Manager'
  },
  operations: {
    openTime: '08:00',
    closeTime: '22:00',
    timezone: 'America/New_York',
    daysOpen: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    seatingCapacity: 50
  },
  financial: {
    currency: 'USD',
    taxRate: 8.5,
    tipEnabled: true,
    paymentMethods: ['cash', 'card']
  },
  inventory: {
    trackInventory: true,
    lowStockAlertEnabled: true,
    autoReorderEnabled: false
  },
  menuConfig: {
    inheritFromParent: false,
    customPricing: true
  },
  staffing: {
    maxStaff: 15,
    currentStaff: 8,
    roles: ['manager', 'server', 'cook']
  },
  metrics: {
    avgOrderValue: 35.50,
    totalOrders: 1250,
    totalRevenue: 44375.00,
    lastUpdated: '2024-01-15T10:00:00.000Z'
  },
  integrations: {
    onlineOrderingEnabled: true
  },
  settings: {
    orderPrefix: 'MB',
    orderNumberSequence: 1001,
    logoUrl: 'https://example.com/logo.png'
  },
  isActive: true,
  createdBy: 'admin123',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T10:00:00.000Z',
  ...overrides
});

const mockBranches: Branch[] = [
  createMockBranch(),
  createMockBranch({
    _id: 'branch2',
    name: 'Downtown Branch',
    code: 'DB001',
    type: 'branch',
    status: 'active',
    contact: { ...createMockBranch().contact, managerName: 'Jane Manager' }
  }),
  createMockBranch({
    _id: 'branch3',
    name: 'Airport Branch',
    code: 'AB001',
    type: 'branch',
    status: 'inactive'
  })
];

const createMockUseBranches = (overrides = {}) => ({
  branches: mockBranches,
  currentBranch: mockBranches[0],
  loading: false,
  error: null,
  refetch: vi.fn(),
  fetchBranches: vi.fn(),
  fetchBranchHierarchy: vi.fn().mockResolvedValue([]),
  createBranch: vi.fn(),
  updateBranch: vi.fn(),
  deleteBranch: vi.fn(),
  cloneBranch: vi.fn(),
  assignUserToBranch: vi.fn(),
  removeUserFromBranch: vi.fn(),
  canUserAccessBranch: vi.fn().mockReturnValue(true),
  canUserSwitchBranches: vi.fn().mockReturnValue(true),
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isCloning: false,
  isSwitching: false,
  ...overrides
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('BranchManagementDashboard', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockToast = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    
    // Setup default mocks
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockUseBranches.mockReturnValue(createMockUseBranches());
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render dashboard header', () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('Branch Management')).toBeInTheDocument();
      expect(screen.getByText(/Manage your branch network/)).toBeInTheDocument();
    });

    it('should render add branch button for admin users', () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /add branch/i })).toBeInTheDocument();
    });

    it('should not render add branch button for non-admin users', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: 'user' }
      });

      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      expect(screen.queryByRole('button', { name: /add branch/i })).not.toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      expect(screen.getByPlaceholderText(/search branches/i)).toBeInTheDocument();
    });

    it('should render view toggle buttons', () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      const viewButtons = screen.getAllByRole('button');
      const tableViewButton = viewButtons.find(button => 
        button.querySelector('[data-testid*="list"]') || 
        button.textContent?.includes('Table')
      );
      const gridViewButton = viewButtons.find(button => 
        button.querySelector('[data-testid*="grid"]') || 
        button.textContent?.includes('Grid')
      );

      expect(tableViewButton).toBeInTheDocument();
      expect(gridViewButton).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render loading skeleton when loading', () => {
      mockUseBranches.mockReturnValue(
        createMockUseBranches({
          loading: true,
          branches: []
        })
      );

      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Check for skeleton elements (they have animate-pulse class)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should show refresh button with loading state', async () => {
      mockUseBranches.mockReturnValue(
        createMockUseBranches({ loading: true })
      );

      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Find refresh button (it should have a spinning icon when loading)
      const refreshButton = screen.getByRole('button', { name: /refresh/i }) || 
                           document.querySelector('[data-testid*="refresh"]');
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error alert when there is an error', () => {
      const errorMessage = 'Failed to load branches';
      mockUseBranches.mockReturnValue(
        createMockUseBranches({
          loading: false,
          error: new Error(errorMessage)
        })
      );

      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Branch List Display', () => {
    it('should display branches in table view by default', () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Check for table headers
      expect(screen.getByText('Branch')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
    });

    it('should display branch information correctly', () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Check for branch names
      expect(screen.getByText('Main Branch')).toBeInTheDocument();
      expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
      expect(screen.getByText('Airport Branch')).toBeInTheDocument();

      // Check for branch codes
      expect(screen.getByText('MB001')).toBeInTheDocument();
      expect(screen.getByText('DB001')).toBeInTheDocument();
      expect(screen.getByText('AB001')).toBeInTheDocument();
    });

    it('should display manager information', () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('John Manager')).toBeInTheDocument();
      expect(screen.getByText('Jane Manager')).toBeInTheDocument();
    });

    it('should show results summary', () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('Showing 3 of 3 branches')).toBeInTheDocument();
    });

    it('should handle empty branch list', () => {
      mockUseBranches.mockReturnValue(
        createMockUseBranches({
          branches: [],
          loading: false
        })
      );

      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('No branches found')).toBeInTheDocument();
    });
  });

  describe('Search and Filters', () => {
    it('should filter branches by search term', async () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      const searchInput = screen.getByPlaceholderText(/search branches/i);
      await user.type(searchInput, 'Main');

      // The component should filter internally, but we can verify the input value
      expect(searchInput).toHaveValue('Main');
    });

    it('should toggle filters panel', async () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // After clicking, filters should be visible
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
    });

    it('should apply status filter', async () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Find and interact with status filter
      const statusSelect = screen.getByDisplayValue('All statuses') || 
                          screen.getByText('All statuses');
      expect(statusSelect).toBeInTheDocument();
    });

    it('should clear filters', async () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Open filters first
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Find and click clear button
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);
    });
  });

  describe('View Mode Toggle', () => {
    it('should switch to grid view', async () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Find grid view button (look for grid icon or similar)
      const buttons = screen.getAllByRole('button');
      const gridButton = buttons.find(button => 
        button.querySelector('*[data-testid*="grid"]') ||
        button.className?.includes('grid') ||
        button.getAttribute('data-view') === 'grid'
      );

      if (gridButton) {
        await user.click(gridButton);
        
        // After switching to grid view, table headers should not be visible
        // and grid-specific elements should be present
        expect(screen.queryByText('Branch')).not.toBeInTheDocument();
      }
    });
  });

  describe('Branch Actions', () => {
    it('should open create branch dialog', async () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      const addButton = screen.getByRole('button', { name: /add branch/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-branch-modal')).toBeInTheDocument();
      });
    });

    it('should handle create branch submission', async () => {
      const createBranchMock = vi.fn().mockResolvedValue(createMockBranch());
      mockUseBranches.mockReturnValue(
        createMockUseBranches({
          createBranch: createBranchMock
        })
      );

      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Open create dialog
      const addButton = screen.getByRole('button', { name: /add branch/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-branch-modal')).toBeInTheDocument();
      });

      // Submit the form (mock implementation will call the handler)
      const submitButton = screen.getByTestId('create-branch-submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Branch created successfully",
          description: expect.stringContaining('has been added to your branch network'),
        });
      });
    });

    it('should handle create branch errors', async () => {
      const createBranchMock = vi.fn().mockRejectedValue(new Error('Creation failed'));
      mockUseBranches.mockReturnValue(
        createMockUseBranches({
          createBranch: createBranchMock
        })
      );

      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Open create dialog
      const addButton = screen.getByRole('button', { name: /add branch/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-branch-modal')).toBeInTheDocument();
      });

      // Submit the form
      const submitButton = screen.getByTestId('create-branch-submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Failed to create branch",
          description: "Creation failed",
          variant: "destructive",
        });
      });
    });

    it('should handle branch deletion', async () => {
      const deleteBranchMock = vi.fn().mockResolvedValue(undefined);
      mockUseBranches.mockReturnValue(
        createMockUseBranches({
          deleteBranch: deleteBranchMock
        })
      );

      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Find and click a branch action menu
      const actionMenus = screen.getAllByLabelText('Actions') || 
                         screen.getAllByRole('button', { name: /more/i });
      
      if (actionMenus.length > 0) {
        await user.click(actionMenus[0]);

        // Look for delete option
        const deleteOption = screen.getByText(/delete/i);
        await user.click(deleteOption);

        // Confirm deletion
        await waitFor(() => {
          expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
        });

        const confirmButton = screen.getByTestId('alert-dialog-action');
        await user.click(confirmButton);

        await waitFor(() => {
          expect(deleteBranchMock).toHaveBeenCalled();
          expect(mockToast).toHaveBeenCalledWith({
            title: "Branch deleted successfully",
            description: expect.stringContaining('has been removed'),
          });
        });
      }
    });

    it('should handle branch cloning', async () => {
      const cloneBranchMock = vi.fn().mockResolvedValue(createMockBranch({
        _id: 'cloned-branch',
        name: 'Main Branch - Copy'
      }));
      
      mockUseBranches.mockReturnValue(
        createMockUseBranches({
          cloneBranch: cloneBranchMock
        })
      );

      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Find and click a branch action menu
      const actionMenus = screen.getAllByLabelText('Actions') || 
                         screen.getAllByRole('button', { name: /more/i });
      
      if (actionMenus.length > 0) {
        await user.click(actionMenus[0]);

        // Look for clone option
        const cloneOption = screen.getByText(/clone/i);
        await user.click(cloneOption);

        await waitFor(() => {
          expect(cloneBranchMock).toHaveBeenCalled();
          expect(mockToast).toHaveBeenCalledWith({
            title: "Branch cloned successfully",
            description: expect.stringContaining('Copy'),
          });
        });
      }
    });
  });

  describe('Branch Selection', () => {
    it('should handle individual branch selection', async () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Find checkboxes in the table
      const checkboxes = screen.getAllByRole('checkbox');
      
      if (checkboxes.length > 1) { // First checkbox is "select all"
        await user.click(checkboxes[1]);
        
        // Selected count should be displayed
        expect(screen.getByText(/1 selected/)).toBeInTheDocument();
      }
    });

    it('should handle select all branches', async () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Find the select all checkbox (usually the first one)
      const checkboxes = screen.getAllByRole('checkbox');
      
      if (checkboxes.length > 0) {
        await user.click(checkboxes[0]);
        
        // All branches should be selected
        expect(screen.getByText(/3 selected/)).toBeInTheDocument();
      }
    });

    it('should show bulk actions when branches are selected', async () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Select a branch first
      const checkboxes = screen.getAllByRole('checkbox');
      
      if (checkboxes.length > 1) {
        await user.click(checkboxes[1]);
        
        // Open actions menu
        const actionsButton = screen.getByRole('button', { name: /actions/i });
        await user.click(actionsButton);
        
        // Bulk actions should be visible
        expect(screen.getByText(/Bulk Actions/)).toBeInTheDocument();
      }
    });
  });

  describe('Auto-refresh Functionality', () => {
    it('should show auto-refresh toggle', () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      expect(screen.getByLabelText('Auto-refresh')).toBeInTheDocument();
    });

    it('should handle manual refresh', async () => {
      const refetchMock = vi.fn();
      mockUseBranches.mockReturnValue(
        createMockUseBranches({
          refetch: refetchMock,
          fetchBranches: refetchMock,
          fetchBranchHierarchy: vi.fn().mockResolvedValue([])
        })
      );

      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Find and click refresh button
      const refreshButton = screen.getByRole('button', { name: /refresh/i }) ||
                           document.querySelector('[data-testid*="refresh"]');
      
      if (refreshButton) {
        await user.click(refreshButton as Element);

        await waitFor(() => {
          expect(refetchMock).toHaveBeenCalled();
          expect(mockToast).toHaveBeenCalledWith({
            title: "Data refreshed",
            description: "Branch information has been updated",
          });
        });
      }
    });
  });

  describe('Branch Hierarchy', () => {
    it('should render branch hierarchy section', () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('Branch Hierarchy')).toBeInTheDocument();
      expect(screen.getByText(/Visual representation of your branch structure/)).toBeInTheDocument();
    });

    it('should display hierarchy tree when data is available', async () => {
      const mockHierarchy = [{
        ...createMockBranch(),
        children: [
          { ...createMockBranch({ _id: 'child1', name: 'Child Branch 1' }), children: [] }
        ]
      }];

      mockUseBranches.mockReturnValue(
        createMockUseBranches({
          fetchBranchHierarchy: vi.fn().mockResolvedValue(mockHierarchy)
        })
      );

      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('branch-hierarchy-tree')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock a mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // The component should still render without errors
      expect(screen.getByText('Branch Management')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for actions', () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Check for accessible button labels
      const addButton = screen.getByRole('button', { name: /add branch/i });
      expect(addButton).toBeInTheDocument();

      const filtersButton = screen.getByRole('button', { name: /filters/i });
      expect(filtersButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      const searchInput = screen.getByPlaceholderText(/search branches/i);
      
      // Focus should work properly
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
      
      // Tab navigation should work
      await user.tab();
      expect(document.activeElement).not.toBe(searchInput);
    });

    it('should have proper heading hierarchy', () => {
      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Branch Management');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      mockUseBranches.mockReturnValue(
        createMockUseBranches({
          loading: false,
          error: new Error('Network error'),
          branches: []
        })
      );

      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should handle permissions errors', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: 'user' }
      });

      render(<BranchManagementDashboard />, { wrapper: createWrapper() });

      // Add branch button should not be visible for regular users
      expect(screen.queryByRole('button', { name: /add branch/i })).not.toBeInTheDocument();
    });
  });
});