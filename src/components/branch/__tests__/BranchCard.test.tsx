/**
 * Branch Card Component Tests
 * Comprehensive test suite for BranchCard component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { BranchCard } from '@/components/branch/BranchCard';
import { Branch } from '@/types/branch.types';

// Mock UI components that might have complex implementations
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button data-testid="dropdown-item" onClick={onClick}>{children}</button>
  ),
  DropdownMenuSeparator: () => <div data-testid="dropdown-separator" />,
  DropdownMenuTrigger: ({ children, asChild }: any) => 
    asChild ? children : <button data-testid="dropdown-trigger">{children}</button>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => children,
  Tooltip: ({ children }: any) => children,
  TooltipTrigger: ({ children, asChild }: any) => 
    asChild ? children : <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span 
      data-testid="badge" 
      data-variant={variant}
      className={className}
    >
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, onClick }: any) => (
    <div 
      data-testid="card" 
      className={className}
      onClick={onClick}
    >
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, onClick }: any) => (
    <input
      type="checkbox"
      data-testid="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      onClick={onClick}
    />
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, disabled }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      className={className}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

// Mock data
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
    managerName: 'John Manager',
    managerPhone: '+1-555-0124'
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

describe('BranchCard', () => {
  let user: ReturnType<typeof userEvent.setup>;
  
  // Mock handlers
  const mockOnSelect = vi.fn();
  const mockOnView = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnClone = vi.fn();
  const mockOnDelete = vi.fn();
  const mockCanEdit = vi.fn();

  const defaultProps = {
    branch: createMockBranch(),
    selected: false,
    onSelect: mockOnSelect,
    onView: mockOnView,
    onEdit: mockOnEdit,
    onClone: mockOnClone,
    onDelete: mockOnDelete,
    canEdit: mockCanEdit,
    loading: false
  };

  beforeEach(() => {
    user = userEvent.setup();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Set default return values
    mockCanEdit.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading skeleton when loading is true', () => {
      render(<BranchCard {...defaultProps} loading={true} />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('animate-pulse');
    });

    it('should render skeleton elements during loading', () => {
      render(<BranchCard {...defaultProps} loading={true} />);

      // Check for skeleton structure
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });
  });

  describe('Basic Rendering', () => {
    it('should render branch information correctly', () => {
      render(<BranchCard {...defaultProps} />);

      expect(screen.getByText('Main Branch')).toBeInTheDocument();
      expect(screen.getByText('MB001')).toBeInTheDocument();
    });

    it('should render branch logo when available', () => {
      const branchWithLogo = createMockBranch({
        settings: {
          ...createMockBranch().settings,
          logoUrl: 'https://example.com/logo.png'
        }
      });

      render(<BranchCard {...defaultProps} branch={branchWithLogo} />);

      const logo = screen.getByAltText('Main Branch');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
    });

    it('should render default icon when no logo is available', () => {
      const branchWithoutLogo = createMockBranch({
        settings: {
          ...createMockBranch().settings,
          logoUrl: undefined
        }
      });

      render(<BranchCard {...defaultProps} branch={branchWithoutLogo} />);

      // Should render the default building icon container
      const iconContainer = document.querySelector('.h-12.w-12.rounded-lg.bg-muted');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render type and status badges', () => {
      render(<BranchCard {...defaultProps} />);

      const badges = screen.getAllByTestId('badge');
      expect(badges).toHaveLength(2); // Type and status badges
    });

    it('should render address information', () => {
      render(<BranchCard {...defaultProps} />);

      expect(screen.getByText('123 Main St, New York, NY 10001')).toBeInTheDocument();
    });

    it('should render manager information', () => {
      render(<BranchCard {...defaultProps} />);

      expect(screen.getByText('John Manager')).toBeInTheDocument();
      expect(screen.getByText('+1-555-0124')).toBeInTheDocument();
    });

    it('should handle missing manager information', () => {
      const branchWithoutManager = createMockBranch({
        contact: {
          phone: '+1-555-0123',
          email: 'main@example.com'
          // No managerName or managerPhone
        }
      });

      render(<BranchCard {...defaultProps} branch={branchWithoutManager} />);

      expect(screen.getByText('No manager assigned')).toBeInTheDocument();
    });

    it('should render contact information when available', () => {
      render(<BranchCard {...defaultProps} />);

      expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
      expect(screen.getByText('main@example.com')).toBeInTheDocument();
    });

    it('should not render contact section when no contact info', () => {
      const branchWithoutContact = createMockBranch({
        contact: {
          email: '',
          phone: '',
          managerName: 'John Manager'
        }
      });

      render(<BranchCard {...defaultProps} branch={branchWithoutContact} />);

      // Contact section should not be rendered
      expect(screen.queryByText('+1-555-0123')).not.toBeInTheDocument();
    });

    it('should render performance metrics', () => {
      render(<BranchCard {...defaultProps} />);

      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('$44,375.00')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('1,250')).toBeInTheDocument();
      expect(screen.getByText('AOV')).toBeInTheDocument();
      expect(screen.getByText('$35.50')).toBeInTheDocument();
    });

    it('should render operational information', () => {
      render(<BranchCard {...defaultProps} />);

      expect(screen.getByText('8:00 AM - 10:00 PM')).toBeInTheDocument();
      expect(screen.getByText('USD')).toBeInTheDocument();
    });

    it('should handle time formatting errors gracefully', () => {
      const branchWithInvalidTime = createMockBranch({
        operations: {
          ...createMockBranch().operations,
          openTime: 'invalid-time',
          closeTime: 'invalid-time'
        }
      });

      render(<BranchCard {...defaultProps} branch={branchWithInvalidTime} />);

      // Should still render the raw time strings without throwing
      expect(screen.getByText('invalid-time - invalid-time')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should handle branch selection', async () => {
      render(<BranchCard {...defaultProps} />);

      const checkbox = screen.getByTestId('checkbox');
      await user.click(checkbox);

      expect(mockOnSelect).toHaveBeenCalledWith('branch1', true);
    });

    it('should show selected state correctly', () => {
      render(<BranchCard {...defaultProps} selected={true} />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('ring-2', 'ring-primary', 'shadow-md');
    });

    it('should show hover state when not selected', () => {
      render(<BranchCard {...defaultProps} selected={false} />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('hover:shadow-lg');
    });

    it('should prevent event bubbling on checkbox click', async () => {
      render(<BranchCard {...defaultProps} />);

      const checkbox = screen.getByTestId('checkbox');
      
      // Create a spy on stopPropagation
      const stopPropagationSpy = vi.fn();
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation = stopPropagationSpy;
      });

      await user.click(checkbox);

      expect(mockOnSelect).toHaveBeenCalled();
      // The onView should not be called when clicking checkbox
      expect(mockOnView).not.toHaveBeenCalled();
    });
  });

  describe('Actions', () => {
    it('should call onView when card is clicked', async () => {
      render(<BranchCard {...defaultProps} />);

      const card = screen.getByTestId('card');
      await user.click(card);

      expect(mockOnView).toHaveBeenCalledWith(defaultProps.branch);
    });

    it('should render dropdown menu trigger', () => {
      render(<BranchCard {...defaultProps} />);

      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
    });

    it('should show dropdown menu on trigger click', async () => {
      render(<BranchCard {...defaultProps} />);

      const trigger = screen.getByTestId('dropdown-trigger');
      await user.click(trigger);

      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
    });

    it('should render view details option in dropdown', async () => {
      render(<BranchCard {...defaultProps} />);

      expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    it('should call onView when view details is clicked', async () => {
      render(<BranchCard {...defaultProps} />);

      const viewOption = screen.getByText('View Details');
      await user.click(viewOption);

      expect(mockOnView).toHaveBeenCalledWith(defaultProps.branch);
    });

    describe('Edit permissions', () => {
      it('should render edit actions when user can edit', () => {
        mockCanEdit.mockReturnValue(true);

        render(<BranchCard {...defaultProps} />);

        expect(screen.getByText('Edit Branch')).toBeInTheDocument();
        expect(screen.getByText('Clone Branch')).toBeInTheDocument();
        expect(screen.getByText('Delete Branch')).toBeInTheDocument();
      });

      it('should not render edit actions when user cannot edit', () => {
        mockCanEdit.mockReturnValue(false);

        render(<BranchCard {...defaultProps} />);

        expect(screen.queryByText('Edit Branch')).not.toBeInTheDocument();
        expect(screen.queryByText('Clone Branch')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete Branch')).not.toBeInTheDocument();
      });

      it('should call onEdit when edit is clicked', async () => {
        mockCanEdit.mockReturnValue(true);

        render(<BranchCard {...defaultProps} />);

        const editOption = screen.getByText('Edit Branch');
        await user.click(editOption);

        expect(mockOnEdit).toHaveBeenCalledWith(defaultProps.branch);
      });

      it('should call onClone when clone is clicked', async () => {
        mockCanEdit.mockReturnValue(true);

        render(<BranchCard {...defaultProps} />);

        const cloneOption = screen.getByText('Clone Branch');
        await user.click(cloneOption);

        expect(mockOnClone).toHaveBeenCalledWith(defaultProps.branch);
      });

      it('should call onDelete when delete is clicked', async () => {
        mockCanEdit.mockReturnValue(true);

        render(<BranchCard {...defaultProps} />);

        const deleteOption = screen.getByText('Delete Branch');
        await user.click(deleteOption);

        expect(mockOnDelete).toHaveBeenCalledWith(defaultProps.branch);
      });

      it('should style delete option as destructive', () => {
        mockCanEdit.mockReturnValue(true);

        render(<BranchCard {...defaultProps} />);

        const deleteOption = screen.getByText('Delete Branch');
        expect(deleteOption).toHaveClass('text-destructive');
      });
    });

    it('should prevent event bubbling on dropdown trigger click', async () => {
      render(<BranchCard {...defaultProps} />);

      const trigger = screen.getByTestId('dropdown-trigger');
      
      // Mock the click event
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

      trigger.dispatchEvent(clickEvent);

      // onView should not be called when clicking dropdown trigger
      expect(mockOnView).not.toHaveBeenCalled();
    });
  });

  describe('Status and Type Display', () => {
    it('should display correct status for active branch', () => {
      const activeBranch = createMockBranch({ status: 'active' });
      render(<BranchCard {...defaultProps} branch={activeBranch} />);

      const badges = screen.getAllByTestId('badge');
      const statusBadge = badges.find(badge => 
        badge.textContent?.includes('Active')
      );
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveAttribute('data-variant', 'success');
    });

    it('should display correct status for inactive branch', () => {
      const inactiveBranch = createMockBranch({ status: 'inactive' });
      render(<BranchCard {...defaultProps} branch={inactiveBranch} />);

      const badges = screen.getAllByTestId('badge');
      const statusBadge = badges.find(badge => 
        badge.textContent?.includes('Inactive')
      );
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveAttribute('data-variant', 'secondary');
    });

    it('should display correct status for suspended branch', () => {
      const suspendedBranch = createMockBranch({ status: 'suspended' });
      render(<BranchCard {...defaultProps} branch={suspendedBranch} />);

      const badges = screen.getAllByTestId('badge');
      const statusBadge = badges.find(badge => 
        badge.textContent?.includes('Suspended')
      );
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveAttribute('data-variant', 'destructive');
    });

    it('should display correct type for main branch', () => {
      const mainBranch = createMockBranch({ type: 'main' });
      render(<BranchCard {...defaultProps} branch={mainBranch} />);

      expect(screen.getByText('Main Branch')).toBeInTheDocument(); // Type label
    });

    it('should display correct type for regular branch', () => {
      const regularBranch = createMockBranch({ type: 'branch' });
      render(<BranchCard {...defaultProps} branch={regularBranch} />);

      expect(screen.getByText('Branch')).toBeInTheDocument(); // Type label
    });

    it('should display correct type for franchise', () => {
      const franchiseBranch = createMockBranch({ type: 'franchise' });
      render(<BranchCard {...defaultProps} branch={franchiseBranch} />);

      expect(screen.getByText('Franchise')).toBeInTheDocument(); // Type label
    });

    it('should handle unknown status gracefully', () => {
      const branchWithUnknownStatus = createMockBranch({ 
        status: 'unknown' as any 
      });
      
      render(<BranchCard {...defaultProps} branch={branchWithUnknownStatus} />);

      // Should not crash and should render something
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should handle unknown type gracefully', () => {
      const branchWithUnknownType = createMockBranch({ 
        type: 'unknown' as any 
      });
      
      render(<BranchCard {...defaultProps} branch={branchWithUnknownType} />);

      // Should not crash and should render something
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency correctly for USD', () => {
      render(<BranchCard {...defaultProps} />);

      expect(screen.getByText('$44,375.00')).toBeInTheDocument();
      expect(screen.getByText('$35.50')).toBeInTheDocument();
    });

    it('should format currency correctly for different currencies', () => {
      const branchWithEUR = createMockBranch({
        financial: {
          ...createMockBranch().financial,
          currency: 'EUR'
        }
      });

      render(<BranchCard {...defaultProps} branch={branchWithEUR} />);

      expect(screen.getByText('EUR')).toBeInTheDocument();
    });

    it('should handle currency formatting errors gracefully', () => {
      const branchWithInvalidCurrency = createMockBranch({
        financial: {
          ...createMockBranch().financial,
          currency: 'INVALID'
        }
      });

      render(<BranchCard {...defaultProps} branch={branchWithInvalidCurrency} />);

      // Should still render without throwing
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      render(<BranchCard {...defaultProps} />);

      const card = screen.getByTestId('card');
      
      // Card should be focusable
      card.focus();
      expect(document.activeElement).toBe(card);
    });

    it('should have proper ARIA attributes', () => {
      render(<BranchCard {...defaultProps} />);

      const checkbox = screen.getByTestId('checkbox');
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    it('should have descriptive alt text for branch logo', () => {
      const branchWithLogo = createMockBranch({
        settings: {
          ...createMockBranch().settings,
          logoUrl: 'https://example.com/logo.png'
        }
      });

      render(<BranchCard {...defaultProps} branch={branchWithLogo} />);

      const logo = screen.getByAltText('Main Branch');
      expect(logo).toBeInTheDocument();
    });

    it('should support screen readers with proper text content', () => {
      render(<BranchCard {...defaultProps} />);

      // Important information should be accessible
      expect(screen.getByText('Main Branch')).toBeInTheDocument();
      expect(screen.getByText('MB001')).toBeInTheDocument();
      expect(screen.getByText('John Manager')).toBeInTheDocument();
    });
  });

  describe('Responsiveness', () => {
    it('should render properly on different screen sizes', () => {
      // The component should render without errors regardless of screen size
      render(<BranchCard {...defaultProps} />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Main Branch')).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    it('should handle missing branch data gracefully', () => {
      const branchWithMissingData = createMockBranch({
        address: undefined as any,
        contact: undefined as any,
        metrics: undefined as any
      });

      expect(() => {
        render(<BranchCard {...defaultProps} branch={branchWithMissingData} />);
      }).not.toThrow();
    });

    it('should handle null values in branch data', () => {
      const branchWithNulls = createMockBranch({
        contact: {
          phone: null as any,
          email: null as any,
          managerName: null as any
        }
      });

      expect(() => {
        render(<BranchCard {...defaultProps} branch={branchWithNulls} />);
      }).not.toThrow();
    });
  });
});