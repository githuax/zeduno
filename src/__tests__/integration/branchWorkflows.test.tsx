/**
 * Branch Management Integration Tests
 * End-to-end workflows and user journey testing
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { 
  branchMockServer, 
  configureMockApi, 
  resetMockApi, 
  testScenarios,
  seedMockData
} from '@/__tests__/mocks/branchMockApi';
import { 
  createMockBranches, 
  branchPresets,
  createMockUser,
  createMockCreateBranchData
} from '@/__tests__/mocks/branchMockData';
import { BranchManagementDashboard } from '@/components/branch/BranchManagementDashboard';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { BranchProvider } from '@/contexts/BranchContext';

// Mock dependencies that aren't relevant to integration tests
vi.mock('@/contexts/AuthContext');
vi.mock('@/components/ui/use-toast');

const mockUseAuth = vi.mocked(useAuth);
const mockUseToast = vi.mocked(useToast);

// Test wrapper with all necessary providers
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        gcTime: 0 // Disable caching for tests
      },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BranchProvider>
        {children}
      </BranchProvider>
    </QueryClientProvider>
  );
};

describe('Branch Management Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockToast = vi.fn();

  // Mock users for different permission levels
  const adminUser = createMockUser({
    role: 'admin',
    assignedBranches: ['branch1', 'branch2', 'branch3']
  });

  const regularUser = createMockUser({
    role: 'user',
    assignedBranches: ['branch1', 'branch2']
  });

  const superAdminUser = createMockUser({
    role: 'superadmin',
    assignedBranches: []
  });

  beforeAll(() => {
    // Start the mock server
    branchMockServer.listen();
  });

  beforeEach(() => {
    user = userEvent.setup();
    
    // Setup default mocks
    mockUseAuth.mockReturnValue({ user: adminUser });
    mockUseToast.mockReturnValue({ toast: mockToast });

    // Configure mock API for normal operation
    testScenarios.instant();
    
    // Seed with default test data
    const testBranches = [
      branchPresets.mainBranch(),
      branchPresets.activeBranch(),
      branchPresets.inactiveBranch(),
      branchPresets.franchiseBranch()
    ];
    seedMockData(testBranches);
  });

  afterEach(() => {
    vi.clearAllMocks();
    resetMockApi();
    branchMockServer.resetHandlers();
  });

  afterAll(() => {
    branchMockServer.close();
  });

  describe('Complete Branch CRUD Workflow', () => {
    it('should complete full branch lifecycle: create -> view -> edit -> delete', async () => {
      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByText('Main Branch')).toBeInTheDocument();
      });

      // Step 1: Create a new branch
      const addButton = screen.getByRole('button', { name: /add branch/i });
      await user.click(addButton);

      // Wait for create modal to open
      await waitFor(() => {
        expect(screen.getByTestId('create-branch-modal')).toBeInTheDocument();
      });

      // Fill out and submit create form (simplified for mock)
      const createSubmitButton = screen.getByTestId('create-branch-submit');
      await user.click(createSubmitButton);

      // Wait for success toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Branch created successfully",
          description: expect.any(String)
        });
      });

      // Step 2: View branch details
      // Find the newly created branch in the list
      await waitFor(() => {
        // Should have one more branch than before
        const branchRows = screen.getAllByRole('row');
        expect(branchRows.length).toBeGreaterThan(4); // Header + initial branches + new one
      });

      // Click on a branch to view details
      const branchNames = screen.getAllByText(/branch/i);
      if (branchNames.length > 0) {
        await user.click(branchNames[0]);

        await waitFor(() => {
          expect(screen.getByTestId('branch-details-dialog')).toBeInTheDocument();
        });
      }

      // Step 3: Edit the branch
      // Close details dialog first
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('edit-branch-modal')).toBeInTheDocument();
      });

      const editSubmitButton = screen.getByTestId('edit-branch-submit');
      await user.click(editSubmitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Branch updated successfully",
          description: expect.any(String)
        });
      });

      // Step 4: Delete the branch
      // Find delete action in dropdown
      const moreButtons = screen.getAllByRole('button', { name: /more/i });
      if (moreButtons.length > 0) {
        await user.click(moreButtons[0]);

        const deleteOption = screen.getByText(/delete/i);
        await user.click(deleteOption);

        // Confirm deletion
        await waitFor(() => {
          expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
        });

        const confirmButton = screen.getByTestId('alert-dialog-action');
        await user.click(confirmButton);

        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith({
            title: "Branch deleted successfully",
            description: expect.any(String)
          });
        });
      }
    });
  });

  describe('Search and Filter Workflows', () => {
    it('should filter branches by status and search', async () => {
      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Showing 4 of 4 branches')).toBeInTheDocument();
      });

      // Step 1: Open filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Step 2: Apply status filter
      await waitFor(() => {
        expect(screen.getByText('Status')).toBeInTheDocument();
      });

      // Filter by active status
      const statusSelect = screen.getByDisplayValue('All statuses');
      await user.selectOptions(statusSelect, 'active');

      // Should see fewer branches now
      await waitFor(() => {
        expect(screen.getByText(/showing \d+ of 4 branches/i)).toBeInTheDocument();
      });

      // Step 3: Add search filter
      const searchInput = screen.getByPlaceholderText(/search branches/i);
      await user.type(searchInput, 'main');

      // Should filter further
      await waitFor(() => {
        expect(screen.getByText('Main Branch')).toBeInTheDocument();
      });

      // Step 4: Clear filters
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      // Should return to full list
      await waitFor(() => {
        expect(screen.getByText('Showing 4 of 4 branches')).toBeInTheDocument();
      });
    });

    it('should handle complex filter combinations', async () => {
      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Branch Management')).toBeInTheDocument();
      });

      // Open filters
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Apply multiple filters
      const statusSelect = screen.getByDisplayValue('All statuses');
      await user.selectOptions(statusSelect, 'active');

      const typeSelect = screen.getByDisplayValue('All types');
      await user.selectOptions(typeSelect, 'branch');

      const searchInput = screen.getByPlaceholderText(/search branches/i);
      await user.type(searchInput, 'downtown');

      // Results should be filtered by all criteria
      await waitFor(() => {
        const resultsText = screen.getByText(/showing \d+ of 4 branches/i);
        expect(resultsText).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Operations Workflow', () => {
    it('should perform bulk status update', async () => {
      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Main Branch')).toBeInTheDocument();
      });

      // Step 1: Select multiple branches
      const checkboxes = screen.getAllByRole('checkbox');
      
      // Select first few branches (skip the "select all" checkbox)
      if (checkboxes.length > 3) {
        await user.click(checkboxes[1]); // First branch
        await user.click(checkboxes[2]); // Second branch
      }

      // Should show selected count
      await waitFor(() => {
        expect(screen.getByText(/2 selected/)).toBeInTheDocument();
      });

      // Step 2: Open bulk actions
      const actionsButton = screen.getByRole('button', { name: /actions/i });
      await user.click(actionsButton);

      // Should see bulk actions menu
      await waitFor(() => {
        expect(screen.getByText(/bulk actions/i)).toBeInTheDocument();
      });

      // Step 3: Perform bulk activation
      const activateOption = screen.getByText(/activate selected/i);
      await user.click(activateOption);

      // Step 4: Confirm bulk action
      await waitFor(() => {
        expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByTestId('alert-dialog-action');
      await user.click(confirmButton);

      // Should show success message
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Branches activated",
          description: "2 branches have been activated"
        });
      });
    });

    it('should handle select all functionality', async () => {
      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Main Branch')).toBeInTheDocument();
      });

      // Click select all checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      const selectAllCheckbox = checkboxes[0];
      await user.click(selectAllCheckbox);

      // Should select all branches
      await waitFor(() => {
        expect(screen.getByText(/4 selected/)).toBeInTheDocument();
      });

      // Unselect all
      await user.click(selectAllCheckbox);

      await waitFor(() => {
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Branch Clone Workflow', () => {
    it('should clone branch with inherited settings', async () => {
      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Main Branch')).toBeInTheDocument();
      });

      // Find and open branch actions menu
      const moreButtons = screen.getAllByRole('button', { name: /more/i });
      if (moreButtons.length > 0) {
        await user.click(moreButtons[0]);

        // Click clone option
        const cloneOption = screen.getByText(/clone/i);
        await user.click(cloneOption);

        // Should show success message
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith({
            title: "Branch cloned successfully",
            description: expect.stringContaining('Copy')
          });
        });

        // Should see the cloned branch in the list
        await waitFor(() => {
          expect(screen.getByText(/copy/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('View Mode Toggle Workflow', () => {
    it('should switch between table and grid views', async () => {
      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Main Branch')).toBeInTheDocument();
      });

      // Should start in table view (has table headers)
      expect(screen.getByText('Branch')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();

      // Switch to grid view
      const gridButton = screen.getByRole('button', { name: /grid/i });
      await user.click(gridButton);

      // Table headers should disappear
      await waitFor(() => {
        expect(screen.queryByText('Branch')).not.toBeInTheDocument();
      });

      // Switch back to table view
      const tableButton = screen.getByRole('button', { name: /table/i });
      await user.click(tableButton);

      // Table headers should reappear
      await waitFor(() => {
        expect(screen.getByText('Branch')).toBeInTheDocument();
      });
    });
  });

  describe('Permission-based Workflows', () => {
    it('should restrict actions for regular users', async () => {
      mockUseAuth.mockReturnValue({ user: regularUser });

      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Branch Management')).toBeInTheDocument();
      });

      // Should not show add branch button
      expect(screen.queryByRole('button', { name: /add branch/i })).not.toBeInTheDocument();

      // Should not show edit/delete options in action menus
      const moreButtons = screen.queryAllByRole('button', { name: /more/i });
      if (moreButtons.length > 0) {
        await user.click(moreButtons[0]);

        // Should only show view option
        expect(screen.getByText('View Details')).toBeInTheDocument();
        expect(screen.queryByText('Edit Branch')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete Branch')).not.toBeInTheDocument();
      }
    });

    it('should allow all actions for superadmin users', async () => {
      mockUseAuth.mockReturnValue({ user: superAdminUser });

      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Branch Management')).toBeInTheDocument();
      });

      // Should show add branch button
      expect(screen.getByRole('button', { name: /add branch/i })).toBeInTheDocument();

      // Should show all action options
      const moreButtons = screen.getAllByRole('button', { name: /more/i });
      if (moreButtons.length > 0) {
        await user.click(moreButtons[0]);

        expect(screen.getByText('View Details')).toBeInTheDocument();
        expect(screen.getByText('Edit Branch')).toBeInTheDocument();
        expect(screen.getByText('Clone Branch')).toBeInTheDocument();
        expect(screen.getByText('Delete Branch')).toBeInTheDocument();
      }
    });
  });

  describe('Error Handling Workflows', () => {
    it('should handle network errors gracefully', async () => {
      // Configure mock to simulate network errors
      testScenarios.offline();

      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should handle server errors with retry', async () => {
      // Configure mock to simulate intermittent errors
      testScenarios.unreliable();

      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      // Wait for either success or error
      await waitFor(() => {
        const hasContent = screen.queryByText('Main Branch') || screen.queryByText(/error/i);
        expect(hasContent).toBeInTheDocument();
      }, { timeout: 5000 });

      // If error occurred, try manual refresh
      const refreshButton = screen.queryByRole('button', { name: /refresh/i });
      if (refreshButton) {
        await user.click(refreshButton);
        
        // Should eventually succeed or show error
        await waitFor(() => {
          const hasContent = screen.queryByText('Main Branch') || screen.queryByText(/error/i);
          expect(hasContent).toBeInTheDocument();
        }, { timeout: 5000 });
      }
    });

    it('should handle validation errors during creation', async () => {
      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Main Branch')).toBeInTheDocument();
      });

      // Try to create branch with invalid data
      const addButton = screen.getByRole('button', { name: /add branch/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-branch-modal')).toBeInTheDocument();
      });

      // Submit without filling required fields
      const submitButton = screen.getByTestId('create-branch-submit');
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Failed to create branch",
          description: expect.any(String),
          variant: "destructive"
        });
      });
    });
  });

  describe('Real-time Updates Workflow', () => {
    it('should handle auto-refresh functionality', async () => {
      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Main Branch')).toBeInTheDocument();
      });

      // Check auto-refresh toggle
      const autoRefreshToggle = screen.getByLabelText('Auto-refresh');
      expect(autoRefreshToggle).toBeInTheDocument();
      expect(autoRefreshToggle).toBeChecked();

      // Disable auto-refresh
      await user.click(autoRefreshToggle);
      expect(autoRefreshToggle).not.toBeChecked();

      // Manual refresh should still work
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Data refreshed",
          description: "Branch information has been updated"
        });
      });
    });
  });

  describe('Import/Export Workflows', () => {
    it('should export branch data', async () => {
      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Main Branch')).toBeInTheDocument();
      });

      // Open actions menu
      const actionsButton = screen.getByRole('button', { name: /actions/i });
      await user.click(actionsButton);

      // Click export option
      const exportOption = screen.getByText(/export branches/i);
      await user.click(exportOption);

      // Should show success toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Export completed",
          description: expect.stringContaining('branches exported')
        });
      });
    });

    it('should handle import workflow', async () => {
      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Main Branch')).toBeInTheDocument();
      });

      // Open import dialog
      const actionsButton = screen.getByRole('button', { name: /actions/i });
      await user.click(actionsButton);

      const importOption = screen.getByText(/import branches/i);
      await user.click(importOption);

      // Should open import dialog
      await waitFor(() => {
        expect(screen.getByTestId('import-branches-dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Branch Hierarchy Workflows', () => {
    it('should display and interact with branch hierarchy', async () => {
      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Branch Hierarchy')).toBeInTheDocument();
      });

      // Should show hierarchy tree
      expect(screen.getByTestId('branch-hierarchy-tree')).toBeInTheDocument();

      // Should be able to click on hierarchy nodes
      const hierarchyNodes = screen.getAllByTestId(/hierarchy-node/);
      if (hierarchyNodes.length > 0) {
        await user.click(hierarchyNodes[0]);
        
        // Should open branch details
        await waitFor(() => {
          expect(screen.getByTestId('branch-details-dialog')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Performance and Loading States', () => {
    it('should show loading states during operations', async () => {
      // Configure slow network
      testScenarios.slowNetwork();

      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      // Should show loading skeleton initially
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Main Branch')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Reset to normal speed for subsequent operations
      testScenarios.instant();
    });

    it('should handle concurrent operations', async () => {
      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Main Branch')).toBeInTheDocument();
      });

      // Start multiple operations simultaneously
      const promises = [
        // Refresh data
        user.click(screen.getByRole('button', { name: /refresh/i })),
        // Open create modal
        user.click(screen.getByRole('button', { name: /add branch/i }))
      ];

      await Promise.all(promises);

      // Both operations should complete successfully
      await waitFor(() => {
        expect(screen.getByTestId('create-branch-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile and Responsive Workflows', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const wrapper = createTestWrapper();
      render(<BranchManagementDashboard />, { wrapper });

      await waitFor(() => {
        expect(screen.getByText('Branch Management')).toBeInTheDocument();
      });

      // Should still be functional on mobile
      expect(screen.getByPlaceholderText(/search branches/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add branch/i })).toBeInTheDocument();
    });
  });
});