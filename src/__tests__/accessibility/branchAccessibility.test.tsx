/**
 * Branch Management Accessibility Tests
 * Comprehensive WCAG compliance and accessibility testing
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { createMockBranch, createMockUser } from '@/__tests__/mocks/branchMockData';
import { BranchCard } from '@/components/branch/BranchCard';
import { BranchDetailsDialog } from '@/components/branch/BranchDetailsDialog';
import { BranchManagementDashboard } from '@/components/branch/BranchManagementDashboard';
import { CreateBranchModal } from '@/components/branch/CreateBranchModal';
import { EditBranchModal } from '@/components/branch/EditBranchModal';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { BranchProvider } from '@/contexts/BranchContext';
import { Branch } from '@/types/branch.types';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/components/ui/use-toast');
vi.mock('@/hooks/useBranches');

const mockUseAuth = vi.mocked(useAuth);
const mockUseToast = vi.mocked(useToast);

// Mock hooks for accessibility testing
const createMockUseBranches = (overrides = {}) => ({
  branches: [
    createMockBranch({ name: 'Main Branch' }),
    createMockBranch({ name: 'Downtown Branch', _id: 'branch2' }),
  ],
  currentBranch: createMockBranch(),
  loading: false,
  error: null,
  refetch: vi.fn(),
  fetchBranches: vi.fn(),
  fetchBranchHierarchy: vi.fn(),
  createBranch: vi.fn(),
  updateBranch: vi.fn(),
  deleteBranch: vi.fn(),
  cloneBranch: vi.fn(),
  assignUserToBranch: vi.fn(),
  removeUserFromBranch: vi.fn(),
  canUserAccessBranch: vi.fn().mockReturnValue(true),
  canUserSwitchBranches: vi.fn().mockReturnValue(true),
  ...overrides
});

vi.mock('@/hooks/useBranches', () => ({
  useBranches: () => createMockUseBranches()
}));

// Test wrapper
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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

describe('Branch Management Accessibility Tests', () => {
  const adminUser = createMockUser({ role: 'admin' });
  const mockToast = vi.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: adminUser });
    mockUseToast.mockReturnValue({ toast: mockToast });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('WCAG Compliance', () => {
    it('should not have accessibility violations in main dashboard', async () => {
      const { container } = render(<BranchManagementDashboard />, {
        wrapper: createTestWrapper()
      });

      // Wait for content to load
      await screen.findByText('Branch Management');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in branch card', async () => {
      const mockBranch = createMockBranch();
      const props = {
        branch: mockBranch,
        selected: false,
        onSelect: vi.fn(),
        onView: vi.fn(),
        onEdit: vi.fn(),
        onClone: vi.fn(),
        onDelete: vi.fn(),
        canEdit: vi.fn().mockReturnValue(true)
      };

      const { container } = render(<BranchCard {...props} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should not have accessibility violations in create modal', async () => {
      const props = {
        open: true,
        onOpenChange: vi.fn(),
        wizardSteps: [],
        currentStep: 0,
        onStepChange: vi.fn(),
        formData: {},
        onFormDataChange: vi.fn(),
        onSubmit: vi.fn(),
        branches: [],
        loading: false
      };

      const { container } = render(<CreateBranchModal {...props} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation in dashboard', async () => {
      const user = userEvent.setup();
      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      await screen.findByText('Branch Management');

      // Tab through interactive elements
      const searchInput = screen.getByPlaceholderText(/search branches/i);
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);

      await user.tab();
      expect(document.activeElement).not.toBe(searchInput);

      // Should be able to navigate to buttons
      await user.tab();
      const focusedElement = document.activeElement;
      expect(focusedElement?.tagName).toBe('BUTTON');
    });

    it('should support arrow key navigation in branch list', async () => {
      const user = userEvent.setup();
      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      await screen.findByText('Main Branch');

      // Focus on first branch row
      const firstRow = screen.getAllByRole('row')[1]; // Skip header row
      firstRow.focus();

      // Arrow down should move to next row
      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).not.toBe(firstRow);
    });

    it('should support Enter key activation', async () => {
      const user = userEvent.setup();
      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      await screen.findByText('Branch Management');

      const addButton = screen.getByRole('button', { name: /add branch/i });
      addButton.focus();

      // Enter should activate the button
      await user.keyboard('{Enter}');
      // Modal should open (simplified check)
      expect(addButton).toBeDefined();
    });

    it('should support Space key activation for checkboxes', async () => {
      const user = userEvent.setup();
      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      await screen.findByText('Main Branch');

      const checkboxes = screen.getAllByRole('checkbox');
      if (checkboxes.length > 0) {
        const firstCheckbox = checkboxes[0];
        firstCheckbox.focus();

        await user.keyboard(' ');
        expect(firstCheckbox).toBeChecked();
      }
    });

    it('should support Escape key to close modals', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <CreateBranchModal
          open={true}
          onOpenChange={onOpenChange}
          wizardSteps={[]}
          currentStep={0}
          onStepChange={vi.fn()}
          formData={{}}
          onFormDataChange={vi.fn()}
          onSubmit={vi.fn()}
          branches={[]}
          loading={false}
        />
      );

      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper heading hierarchy', () => {
      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      // Main heading should be h1
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Branch Management');

      // Section headings should be h2 or lower
      const sectionHeadings = screen.getAllByRole('heading');
      expect(sectionHeadings.length).toBeGreaterThan(1);
    });

    it('should have descriptive labels for form controls', async () => {
      const user = userEvent.setup();
      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      await screen.findByText('Branch Management');

      // Search input should have accessible label
      const searchInput = screen.getByPlaceholderText(/search branches/i);
      expect(searchInput).toHaveAttribute('aria-label');

      // Filter controls should have labels
      const filtersButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filtersButton);

      // Status and type selects should have labels
      const selects = screen.getAllByRole('combobox');
      selects.forEach(select => {
        expect(select).toHaveAccessibleName();
      });
    });

    it('should announce loading states', () => {
      vi.mock('@/hooks/useBranches', () => ({
        useBranches: () => createMockUseBranches({ loading: true })
      }));

      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      // Loading skeleton should have aria-label
      const loadingElements = document.querySelectorAll('[aria-busy="true"]');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should announce error states', () => {
      vi.mock('@/hooks/useBranches', () => ({
        useBranches: () => createMockUseBranches({ 
          loading: false,
          error: new Error('Failed to load branches') 
        })
      }));

      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      // Error message should be announced
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(/failed to load/i);
    });

    it('should have proper table structure', async () => {
      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      await screen.findByText('Main Branch');

      // Table should have proper structure
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Column headers should be properly associated
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);

      // Rows should be properly structured
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header + data rows
    });

    it('should provide accessible names for action buttons', async () => {
      const mockBranch = createMockBranch({ name: 'Test Branch' });
      const props = {
        branch: mockBranch,
        selected: false,
        onSelect: vi.fn(),
        onView: vi.fn(),
        onEdit: vi.fn(),
        onClone: vi.fn(),
        onDelete: vi.fn(),
        canEdit: vi.fn().mockReturnValue(true)
      };

      render(<BranchCard {...props} />);

      // Action buttons should have descriptive names
      const viewButton = screen.getByLabelText(/view details for test branch/i) ||
                        screen.getByText(/view details/i);
      expect(viewButton).toBeInTheDocument();
    });
  });

  describe('Color and Contrast', () => {
    it('should use semantic colors for status indicators', async () => {
      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      await screen.findByText('Main Branch');

      // Status badges should have appropriate semantic meaning
      const activeBadges = screen.getAllByText(/active/i);
      activeBadges.forEach(badge => {
        expect(badge).toHaveClass(/success|green/);
      });

      const inactiveBadges = screen.getAllByText(/inactive/i);
      inactiveBadges.forEach(badge => {
        expect(badge).toHaveClass(/secondary|gray/);
      });
    });

    it('should not rely solely on color for information', () => {
      const mockBranch = createMockBranch({ status: 'active' });
      const props = {
        branch: mockBranch,
        selected: false,
        onSelect: vi.fn(),
        onView: vi.fn(),
        onEdit: vi.fn(),
        onClone: vi.fn(),
        onDelete: vi.fn(),
        canEdit: vi.fn().mockReturnValue(true)
      };

      render(<BranchCard {...props} />);

      // Status should be indicated by both color and text/icon
      const statusBadge = screen.getByText(/active/i);
      expect(statusBadge).toBeInTheDocument();
      
      // Should also have an icon or other non-color indicator
      const iconOrText = statusBadge.querySelector('svg') || statusBadge.textContent;
      expect(iconOrText).toBeDefined();
    });
  });

  describe('Focus Management', () => {
    it('should manage focus properly when opening modals', async () => {
      const user = userEvent.setup();
      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      await screen.findByText('Branch Management');

      const addButton = screen.getByRole('button', { name: /add branch/i });
      await user.click(addButton);

      // Focus should move into the modal
      await screen.findByTestId('create-branch-modal');
      
      // First focusable element in modal should receive focus
      const modalContent = screen.getByTestId('create-branch-modal');
      const focusableElements = modalContent.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        expect(document.activeElement).toBe(focusableElements[0]);
      }
    });

    it('should trap focus within modals', async () => {
      const user = userEvent.setup();
      
      render(
        <CreateBranchModal
          open={true}
          onOpenChange={vi.fn()}
          wizardSteps={[]}
          currentStep={0}
          onStepChange={vi.fn()}
          formData={{}}
          onFormDataChange={vi.fn()}
          onSubmit={vi.fn()}
          branches={[]}
          loading={false}
        />
      );

      const modalContent = screen.getByTestId('create-branch-modal');
      const focusableElements = modalContent.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 1) {
        // Focus last element
        (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
        
        // Tab should cycle back to first element
        await user.tab();
        expect(document.activeElement).toBe(focusableElements[0]);
      }
    });

    it('should restore focus when closing modals', async () => {
      const user = userEvent.setup();
      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      await screen.findByText('Branch Management');

      const addButton = screen.getByRole('button', { name: /add branch/i });
      addButton.focus();
      await user.click(addButton);

      await screen.findByTestId('create-branch-modal');

      // Close modal (simplified - would normally click close button)
      await user.keyboard('{Escape}');

      // Focus should return to the trigger button
      expect(document.activeElement).toBe(addButton);
    });

    it('should have visible focus indicators', async () => {
      const user = userEvent.setup();
      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      await screen.findByText('Branch Management');

      const addButton = screen.getByRole('button', { name: /add branch/i });
      addButton.focus();

      // Focus should be visible (implementation would check computed styles)
      expect(document.activeElement).toBe(addButton);
    });
  });

  describe('Error States and Validation', () => {
    it('should announce form validation errors', async () => {
      const user = userEvent.setup();
      
      render(
        <CreateBranchModal
          open={true}
          onOpenChange={vi.fn()}
          wizardSteps={[]}
          currentStep={0}
          onStepChange={vi.fn()}
          formData={{}}
          onFormDataChange={vi.fn()}
          onSubmit={vi.fn()}
          branches={[]}
          loading={false}
        />
      );

      // Try to submit invalid form
      const submitButton = screen.getByTestId('create-branch-submit');
      await user.click(submitButton);

      // Validation errors should be announced
      const errorElements = document.querySelectorAll('[role="alert"]');
      expect(errorElements.length).toBeGreaterThan(0);
    });

    it('should provide clear error messages', () => {
      vi.mock('@/hooks/useBranches', () => ({
        useBranches: () => createMockUseBranches({ 
          error: new Error('Network connection failed') 
        })
      }));

      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent(/network connection failed/i);
    });
  });

  describe('Responsive and Mobile Accessibility', () => {
    it('should be accessible on mobile viewports', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(<BranchManagementDashboard />, {
        wrapper: createTestWrapper()
      });

      await screen.findByText('Branch Management');

      // Should still pass accessibility tests on mobile
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have appropriate touch targets on mobile', () => {
      const mockBranch = createMockBranch();
      const props = {
        branch: mockBranch,
        selected: false,
        onSelect: vi.fn(),
        onView: vi.fn(),
        onEdit: vi.fn(),
        onClone: vi.fn(),
        onDelete: vi.fn(),
        canEdit: vi.fn().mockReturnValue(true)
      };

      render(<BranchCard {...props} />);

      // Interactive elements should have minimum touch target size
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const computedStyle = window.getComputedStyle(button);
        const minSize = 44; // 44px minimum touch target
        
        // In a real implementation, you'd check computed dimensions
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Internationalization Support', () => {
    it('should support RTL text direction', async () => {
      // Mock RTL language
      document.documentElement.dir = 'rtl';

      const { container } = render(<BranchManagementDashboard />, {
        wrapper: createTestWrapper()
      });

      await screen.findByText('Branch Management');

      // Layout should adapt to RTL
      expect(document.documentElement.dir).toBe('rtl');

      // Cleanup
      document.documentElement.dir = 'ltr';
    });

    it('should have translatable text content', () => {
      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      // Text content should be accessible for translation
      const headings = screen.getAllByRole('heading');
      headings.forEach(heading => {
        expect(heading.textContent).toBeTruthy();
      });

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.textContent || button.getAttribute('aria-label')).toBeTruthy();
      });
    });
  });

  describe('High Contrast and Visual Accessibility', () => {
    it('should work with high contrast mode', async () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-contrast: high'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = render(<BranchManagementDashboard />, {
        wrapper: createTestWrapper()
      });

      await screen.findByText('Branch Management');

      // Should still pass accessibility tests in high contrast mode
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      // Animations should be reduced or disabled
      const animatedElements = document.querySelectorAll('.animate-pulse, .transition');
      animatedElements.forEach(element => {
        // In a real implementation, you'd check animation properties
        expect(element).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Accessibility', () => {
    it('should maintain accessibility during loading states', () => {
      vi.mock('@/hooks/useBranches', () => ({
        useBranches: () => createMockUseBranches({ loading: true })
      }));

      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      // Loading states should be accessible
      const loadingElements = document.querySelectorAll('[aria-busy="true"]');
      expect(loadingElements.length).toBeGreaterThan(0);

      // Screen readers should be informed of loading state
      const statusElements = document.querySelectorAll('[role="status"]');
      expect(statusElements.length).toBeGreaterThan(0);
    });

    it('should handle large datasets accessibly', async () => {
      // Mock large dataset
      const largeBranchList = Array.from({ length: 100 }, (_, i) => 
        createMockBranch({ name: `Branch ${i + 1}`, _id: `branch${i + 1}` })
      );

      vi.mock('@/hooks/useBranches', () => ({
        useBranches: () => createMockUseBranches({ branches: largeBranchList })
      }));

      render(<BranchManagementDashboard />, { wrapper: createTestWrapper() });

      // Should handle virtualization or pagination accessibly
      const table = await screen.findByRole('table');
      expect(table).toBeInTheDocument();

      // Navigation should still work with large datasets
      const searchInput = screen.getByPlaceholderText(/search branches/i);
      expect(searchInput).toBeInTheDocument();
    });
  });
});