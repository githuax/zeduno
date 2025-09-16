# Branch Management Developer Guide

## Overview

This guide provides comprehensive information for developers working with the Branch Management system in Dine Serve Hub. It covers component architecture, API integration patterns, customization options, testing strategies, and development best practices.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Structure](#component-structure)
3. [State Management](#state-management)
4. [API Integration](#api-integration)
5. [Custom Hooks](#custom-hooks)
6. [Context Providers](#context-providers)
7. [UI Components](#ui-components)
8. [Testing Strategies](#testing-strategies)
9. [Performance Optimization](#performance-optimization)
10. [Customization and Extensions](#customization-and-extensions)
11. [Development Tools](#development-tools)
12. [Debugging Guide](#debugging-guide)

## Architecture Overview

### System Design

The Branch Management system follows a modular, layered architecture:

```
┌─────────────────────────┐
│     UI Components       │ ← React components with TypeScript
├─────────────────────────┤
│     Hooks & Context     │ ← State management and business logic
├─────────────────────────┤
│     API Services        │ ← HTTP client and data fetching
├─────────────────────────┤
│     Backend Controllers │ ← Express.js REST API
├─────────────────────────┤
│     Business Services   │ ← Core business logic
├─────────────────────────┤
│     Database Models     │ ← MongoDB/Mongoose models
└─────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- React Query for data fetching
- React Context for state management
- Radix UI for components
- Tailwind CSS for styling

**Backend:**
- Node.js with Express.js
- TypeScript
- MongoDB with Mongoose
- Express Validator
- JWT authentication

**Testing:**
- Vitest for unit testing
- React Testing Library
- MongoDB Memory Server
- Supertest for API testing

## Component Structure

### File Organization

```
src/
├── components/
│   ├── branch/
│   │   ├── __tests__/
│   │   │   ├── BranchCard.test.tsx
│   │   │   ├── BranchManagementDashboard.test.tsx
│   │   │   └── CreateBranchModal.test.tsx
│   │   ├── BranchCard.tsx
│   │   ├── BranchManagementDashboard.tsx
│   │   ├── BranchMetrics.tsx
│   │   ├── BranchHierarchyView.tsx
│   │   ├── BranchNavigationSwitcher.tsx
│   │   ├── BranchSelector.tsx
│   │   ├── BranchSwitcher.tsx
│   │   ├── CreateBranchModal.tsx
│   │   └── EditBranchModal.tsx
│   └── ui/ (Shared UI components)
├── hooks/
│   ├── __tests__/
│   │   └── useBranches.test.tsx
│   ├── useBranches.ts
│   └── useKeyboardShortcuts.ts
├── contexts/
│   ├── __tests__/
│   │   └── BranchContext.test.tsx
│   └── BranchContext.tsx
├── services/
│   ├── __tests__/
│   │   └── branch.service.test.ts
│   ├── branchApi.ts
│   └── branch.service.ts
└── types/
    └── branch.types.ts
```

### Core Components

#### BranchManagementDashboard
Main dashboard component providing comprehensive branch management interface.

```typescript
interface BranchManagementDashboardProps {
  initialFilters?: BranchFilters;
  viewMode?: 'table' | 'grid';
  onBranchSelect?: (branch: Branch) => void;
  customActions?: CustomAction[];
}

export const BranchManagementDashboard: React.FC<BranchManagementDashboardProps> = ({
  initialFilters,
  viewMode = 'table',
  onBranchSelect,
  customActions = []
}) => {
  // Component implementation
}
```

#### BranchCard
Individual branch display component with actions and metrics.

```typescript
interface BranchCardProps {
  branch: Branch;
  selected?: boolean;
  showMetrics?: boolean;
  actions?: BranchAction[];
  onClick?: (branch: Branch) => void;
  onAction?: (action: string, branch: Branch) => void;
}

export const BranchCard: React.FC<BranchCardProps> = ({
  branch,
  selected = false,
  showMetrics = true,
  actions = [],
  onClick,
  onAction
}) => {
  // Component implementation
}
```

#### CreateBranchModal
Wizard-based branch creation modal with step validation.

```typescript
interface CreateBranchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<CreateBranchData>;
  parentBranch?: Branch;
  onSuccess?: (branch: Branch) => void;
}

export const CreateBranchModal: React.FC<CreateBranchModalProps> = ({
  open,
  onOpenChange,
  initialData,
  parentBranch,
  onSuccess
}) => {
  // Wizard implementation with validation
}
```

### Component Best Practices

#### 1. TypeScript First
```typescript
// Always define proper interfaces
interface BranchComponentProps {
  branch: Branch;
  loading?: boolean;
  error?: string | null;
  onUpdate?: (branch: Branch) => void;
}

// Use generic types for reusable components
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowSelect?: (row: T) => void;
}
```

#### 2. Error Boundaries
```typescript
export const BranchErrorBoundary: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={BranchErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Branch component error:', error, errorInfo);
        // Log to error reporting service
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
```

#### 3. Memoization
```typescript
// Memoize expensive calculations
const BranchMetrics = React.memo<BranchMetricsProps>(({ branch, dateRange }) => {
  const metrics = useMemo(() => 
    calculateBranchMetrics(branch, dateRange), 
    [branch.metrics, dateRange]
  );

  return <MetricsDisplay metrics={metrics} />;
});
```

## State Management

### React Query Integration

#### Query Configuration
```typescript
// src/hooks/useBranches.ts
export const useBranches = (filters?: BranchFilters) => {
  return useQuery({
    queryKey: ['branches', filters],
    queryFn: () => branchApi.fetchBranches(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      return failureCount < 3 && error.status !== 403;
    },
  });
};
```

#### Mutation Handling
```typescript
export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateBranchData) => branchApi.createBranch(data),
    onSuccess: (newBranch) => {
      // Update branches cache
      queryClient.setQueryData<Branch[]>(['branches'], (old = []) => {
        return [...old, newBranch];
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['branches', 'hierarchy'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-context'] });
    },
    onError: (error) => {
      console.error('Failed to create branch:', error);
      // Handle error state
    },
  });
};
```

### Context Pattern
```typescript
// Optimized context with selectors
export const useBranchSelector = <T>(
  selector: (state: BranchContextType) => T
): T => {
  const context = useBranchContext();
  return useMemo(() => selector(context), [context, selector]);
};

// Usage
const currentBranch = useBranchSelector(state => state.currentBranch);
const branchCount = useBranchSelector(state => state.branches.length);
```

### State Synchronization
```typescript
// Sync local and remote state
export const useBranchSync = (branchId: string) => {
  const [localBranch, setLocalBranch] = useState<Branch | null>(null);
  const { data: remoteBranch } = useBranch(branchId);
  
  // Sync when remote data changes
  useEffect(() => {
    if (remoteBranch && (!localBranch || localBranch.updatedAt !== remoteBranch.updatedAt)) {
      setLocalBranch(remoteBranch);
    }
  }, [remoteBranch, localBranch]);
  
  // Handle conflicts
  const handleConflict = useCallback((local: Branch, remote: Branch) => {
    // Implement conflict resolution strategy
    return remote.updatedAt > local.updatedAt ? remote : local;
  }, []);
  
  return { branch: localBranch, setLocalBranch, hasConflict: false };
};
```

## API Integration

### API Client Configuration
```typescript
// src/utils/api.ts
export class BranchApiClient {
  private baseURL = '/api/branches';
  
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = getAuthToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': getCurrentTenantId(),
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new APIError(response.status, await response.text());
    }
    
    return response.json();
  }
  
  async fetchBranches(filters?: BranchFilters): Promise<Branch[]> {
    const params = this.buildQueryParams(filters);
    const response = await this.request<BranchApiResponse>(`?${params}`);
    return Array.isArray(response.data) ? response.data : [];
  }
  
  async createBranch(data: CreateBranchData): Promise<Branch> {
    const response = await this.request<BranchApiResponse>('', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.success || !response.data || Array.isArray(response.data)) {
      throw new Error(response.error || 'Failed to create branch');
    }
    
    return response.data;
  }
  
  private buildQueryParams(filters?: BranchFilters): string {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.includeInactive) params.append('includeInactive', 'true');
    
    return params.toString();
  }
}

export const branchApiClient = new BranchApiClient();
```

### Error Handling
```typescript
// API error types
export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Error handler hook
export const useAPIError = () => {
  const { toast } = useToast();
  
  const handleError = useCallback((error: unknown) => {
    if (error instanceof APIError) {
      switch (error.status) {
        case 401:
          // Handle unauthorized
          redirectToLogin();
          break;
        case 403:
          toast({
            title: "Access Denied",
            description: "You don't have permission to perform this action",
            variant: "destructive",
          });
          break;
        case 409:
          toast({
            title: "Conflict",
            description: error.message,
            variant: "destructive",
          });
          break;
        default:
          toast({
            title: "Error",
            description: error.message || "An unexpected error occurred",
            variant: "destructive",
          });
      }
    }
  }, [toast]);
  
  return { handleError };
};
```

### Request/Response Interceptors
```typescript
// Request interceptor for authentication
const requestInterceptor = (config: RequestInit): RequestInit => {
  const token = getAuthToken();
  const tenantId = getCurrentTenantId();
  
  return {
    ...config,
    headers: {
      ...config.headers,
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Tenant-ID': tenantId || '',
    },
  };
};

// Response interceptor for error handling
const responseInterceptor = async (response: Response): Promise<Response> => {
  if (response.status === 401) {
    // Token expired, redirect to login
    await refreshToken();
    // Retry original request
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new APIError(response.status, errorData.message || 'Request failed');
  }
  
  return response;
};
```

## Custom Hooks

### useBranches Hook
```typescript
// src/hooks/useBranches.ts
export const useBranches = (filters?: BranchFilters) => {
  // Query for branches
  const branchesQuery = useQuery({
    queryKey: ['branches', filters],
    queryFn: () => branchApiClient.fetchBranches(filters),
    staleTime: 5 * 60 * 1000,
  });
  
  // Mutations
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const deleteMutation = useDeleteBranch();
  
  // Computed values
  const activeBranches = useMemo(() => 
    branchesQuery.data?.filter(branch => branch.status === 'active') ?? [],
    [branchesQuery.data]
  );
  
  const branchesByType = useMemo(() => 
    groupBy(branchesQuery.data ?? [], 'type'),
    [branchesQuery.data]
  );
  
  // Actions
  const createBranch = useCallback(async (data: CreateBranchData) => {
    return await createMutation.mutateAsync(data);
  }, [createMutation]);
  
  const updateBranch = useCallback(async (branchId: string, data: UpdateBranchData) => {
    return await updateMutation.mutateAsync({ branchId, data });
  }, [updateMutation]);
  
  const deleteBranch = useCallback(async (branchId: string) => {
    await deleteMutation.mutateAsync(branchId);
  }, [deleteMutation]);
  
  return {
    // Data
    branches: branchesQuery.data ?? [],
    activeBranches,
    branchesByType,
    
    // State
    isLoading: branchesQuery.isLoading,
    isError: branchesQuery.isError,
    error: branchesQuery.error,
    
    // Actions
    createBranch,
    updateBranch,
    deleteBranch,
    refetch: branchesQuery.refetch,
    
    // Mutation states
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
  };
};
```

### useBranchMetrics Hook
```typescript
export const useBranchMetrics = (
  branchId: string,
  dateRange?: { start: Date; end: Date }
) => {
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  
  // Static metrics query
  const metricsQuery = useQuery({
    queryKey: ['branch-metrics', branchId, dateRange],
    queryFn: () => branchApiClient.fetchBranchMetrics(branchId, dateRange?.start, dateRange?.end),
    enabled: !!branchId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
  
  // Real-time updates
  useEffect(() => {
    if (!realTimeEnabled || !branchId) return;
    
    const eventSource = new EventSource(`/api/branches/${branchId}/metrics/stream`);
    
    eventSource.onmessage = (event) => {
      const updatedMetrics = JSON.parse(event.data);
      
      // Update query cache with real-time data
      queryClient.setQueryData(
        ['branch-metrics', branchId, dateRange],
        (oldData: BranchMetrics | undefined) => ({
          ...oldData,
          ...updatedMetrics,
        })
      );
    };
    
    eventSource.onerror = () => {
      console.error('Metrics stream error');
      setRealTimeEnabled(false);
    };
    
    return () => eventSource.close();
  }, [branchId, realTimeEnabled, dateRange]);
  
  return {
    metrics: metricsQuery.data,
    isLoading: metricsQuery.isLoading,
    error: metricsQuery.error,
    realTimeEnabled,
    setRealTimeEnabled,
    refetch: metricsQuery.refetch,
  };
};
```

### useKeyboardShortcuts Hook
```typescript
export const useKeyboardShortcuts = () => {
  const { createBranch, switchBranch } = useBranches();
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + N: New branch
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        // Open create branch modal
        openCreateModal();
      }
      
      // Ctrl/Cmd + B: Branch switcher
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        // Open branch switcher
        openBranchSwitcher();
      }
      
      // Escape: Close modals
      if (event.key === 'Escape') {
        closeAllModals();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};
```

## Context Providers

### BranchContext Implementation
```typescript
// src/contexts/BranchContext.tsx
interface BranchContextState {
  branches: Branch[];
  currentBranch?: Branch;
  loading: boolean;
  error?: string;
}

interface BranchContextActions {
  fetchBranches: (filters?: BranchFilters) => Promise<void>;
  createBranch: (data: CreateBranchData) => Promise<Branch>;
  updateBranch: (id: string, data: UpdateBranchData) => Promise<Branch>;
  deleteBranch: (id: string) => Promise<void>;
  switchBranch: (branchId: string) => Promise<void>;
}

type BranchContextType = BranchContextState & BranchContextActions;

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [state, setState] = useState<BranchContextState>({
    branches: [],
    loading: false,
  });
  
  const queryClient = useQueryClient();
  const branchesHook = useBranches();
  
  // Sync hook state with context state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      branches: branchesHook.branches,
      loading: branchesHook.isLoading,
      error: branchesHook.error?.message,
    }));
  }, [branchesHook.branches, branchesHook.isLoading, branchesHook.error]);
  
  // Actions implementation
  const actions: BranchContextActions = {
    fetchBranches: async (filters) => {
      await branchesHook.refetch();
    },
    
    createBranch: async (data) => {
      return await branchesHook.createBranch(data);
    },
    
    updateBranch: async (id, data) => {
      return await branchesHook.updateBranch(id, data);
    },
    
    deleteBranch: async (id) => {
      await branchesHook.deleteBranch(id);
    },
    
    switchBranch: async (branchId) => {
      await branchApiClient.switchBranch(branchId);
      // Invalidate user context
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  };
  
  const value = { ...state, ...actions };
  
  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
};

// Hook to use branch context
export const useBranchContext = (): BranchContextType => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranchContext must be used within BranchProvider');
  }
  return context;
};
```

### Performance Optimization for Context
```typescript
// Split context for better performance
const BranchStateContext = createContext<BranchContextState | undefined>(undefined);
const BranchActionsContext = createContext<BranchContextActions | undefined>(undefined);

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [state, setState] = useState<BranchContextState>({
    branches: [],
    loading: false,
  });
  
  const actions = useMemo<BranchContextActions>(() => ({
    fetchBranches: async (filters) => {
      // Implementation
    },
    // ... other actions
  }), []);
  
  return (
    <BranchStateContext.Provider value={state}>
      <BranchActionsContext.Provider value={actions}>
        {children}
      </BranchActionsContext.Provider>
    </BranchStateContext.Provider>
  );
};

// Separate hooks for state and actions
export const useBranchState = () => {
  const state = useContext(BranchStateContext);
  if (!state) throw new Error('useBranchState must be used within BranchProvider');
  return state;
};

export const useBranchActions = () => {
  const actions = useContext(BranchActionsContext);
  if (!actions) throw new Error('useBranchActions must be used within BranchProvider');
  return actions;
};
```

## UI Components

### Design System Integration
```typescript
// src/components/ui/branch-status-badge.tsx
interface BranchStatusBadgeProps {
  status: Branch['status'];
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const BranchStatusBadge: React.FC<BranchStatusBadgeProps> = ({
  status,
  variant = 'default',
  size = 'md'
}) => {
  const config = {
    active: { color: 'green', icon: CheckCircle2, label: 'Active' },
    inactive: { color: 'gray', icon: XCircle, label: 'Inactive' },
    suspended: { color: 'red', icon: AlertCircle, label: 'Suspended' }
  };
  
  const { color, icon: Icon, label } = config[status];
  
  return (
    <Badge 
      variant={variant} 
      className={cn(
        'gap-1',
        size === 'sm' && 'text-xs px-1.5 py-0.5',
        size === 'lg' && 'text-sm px-3 py-1'
      )}
      style={{ color: `var(--${color}-600)` }}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};
```

### Custom Component Patterns
```typescript
// Compound component pattern for branch forms
export const BranchForm = {
  Root: ({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) => (
    <form className="space-y-6" {...props}>
      {children}
    </form>
  ),
  
  Section: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{title}</h3>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  ),
  
  Field: ({ label, error, required, children }: {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
  }) => (
    <div className="space-y-2">
      <Label className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
        {label}
      </Label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  ),
  
  Actions: ({ children }: { children: React.ReactNode }) => (
    <div className="flex justify-end gap-3 pt-6 border-t">
      {children}
    </div>
  ),
};

// Usage
<BranchForm.Root onSubmit={handleSubmit}>
  <BranchForm.Section title="Basic Information">
    <BranchForm.Field label="Branch Name" required error={errors.name}>
      <Input {...register('name')} />
    </BranchForm.Field>
  </BranchForm.Section>
  
  <BranchForm.Actions>
    <Button type="button" variant="outline">Cancel</Button>
    <Button type="submit">Create Branch</Button>
  </BranchForm.Actions>
</BranchForm.Root>
```

### Responsive Design Patterns
```typescript
// Responsive branch grid
export const BranchGrid: React.FC<{
  branches: Branch[];
  columns?: { sm: number; md: number; lg: number; xl: number };
}> = ({ 
  branches, 
  columns = { sm: 1, md: 2, lg: 3, xl: 4 }
}) => {
  const gridClasses = cn(
    'grid gap-4',
    `grid-cols-${columns.sm}`,
    `md:grid-cols-${columns.md}`,
    `lg:grid-cols-${columns.lg}`,
    `xl:grid-cols-${columns.xl}`
  );
  
  return (
    <div className={gridClasses}>
      {branches.map(branch => (
        <BranchCard key={branch._id} branch={branch} />
      ))}
    </div>
  );
};
```

## Testing Strategies

### Unit Testing
```typescript
// src/components/branch/__tests__/BranchCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BranchCard } from '../BranchCard';
import { mockBranch } from '../../../__tests__/mocks/branchMockData';

describe('BranchCard', () => {
  it('renders branch information correctly', () => {
    render(<BranchCard branch={mockBranch} />);
    
    expect(screen.getByText(mockBranch.name)).toBeInTheDocument();
    expect(screen.getByText(mockBranch.code)).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<BranchCard branch={mockBranch} onClick={onClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith(mockBranch);
  });
  
  it('shows loading state', () => {
    render(<BranchCard branch={mockBranch} loading />);
    expect(screen.getByTestId('branch-card-skeleton')).toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
// src/hooks/__tests__/useBranches.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBranches } from '../useBranches';
import { branchApiClient } from '../../services/branchApi';

// Mock API client
vi.mock('../../services/branchApi');
const mockBranchApiClient = vi.mocked(branchApiClient);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useBranches', () => {
  beforeEach(() => {
    mockBranchApiClient.fetchBranches.mockResolvedValue([mockBranch]);
  });
  
  it('fetches branches successfully', async () => {
    const { result } = renderHook(() => useBranches(), {
      wrapper: createWrapper(),
    });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.branches).toEqual([mockBranch]);
    expect(mockBranchApiClient.fetchBranches).toHaveBeenCalledWith(undefined);
  });
  
  it('creates branch successfully', async () => {
    mockBranchApiClient.createBranch.mockResolvedValue(mockBranch);
    
    const { result } = renderHook(() => useBranches(), {
      wrapper: createWrapper(),
    });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const createData: CreateBranchData = {
      name: 'Test Branch',
      type: 'branch',
      address: mockBranch.address,
      contact: mockBranch.contact,
    };
    
    await result.current.createBranch(createData);
    
    expect(mockBranchApiClient.createBranch).toHaveBeenCalledWith(createData);
  });
});
```

### API Testing
```typescript
// backend/src/controllers/__tests__/branch.controller.test.ts
import request from 'supertest';
import { app } from '../../app';
import { connectTestDB, clearTestDB, closeTestDB } from '../../__tests__/setup';

describe('Branch Controller', () => {
  beforeAll(async () => {
    await connectTestDB();
  });
  
  beforeEach(async () => {
    await clearTestDB();
  });
  
  afterAll(async () => {
    await closeTestDB();
  });
  
  describe('POST /api/branches', () => {
    it('creates a new branch', async () => {
      const branchData = {
        name: 'Test Branch',
        type: 'branch',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'Test Country'
        },
        contact: {
          phone: '555-1234',
          email: 'test@example.com'
        }
      };
      
      const response = await request(app)
        .post('/api/branches')
        .set('Authorization', `Bearer ${authToken}`)
        .send(branchData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(branchData.name);
      expect(response.body.data.code).toBeDefined();
    });
    
    it('validates required fields', async () => {
      const response = await request(app)
        .post('/api/branches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
      
      expect(response.body.errors).toBeDefined();
    });
  });
});
```

### E2E Testing
```typescript
// src/__tests__/integration/branchWorkflows.test.tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../setup/testUtils';
import { BranchManagementDashboard } from '../../components/branch/BranchManagementDashboard';

describe('Branch Management Workflows', () => {
  it('completes branch creation workflow', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<BranchManagementDashboard />);
    
    // Open create branch modal
    await user.click(screen.getByRole('button', { name: /add branch/i }));
    
    // Fill out form steps
    const modal = screen.getByRole('dialog');
    
    // Step 1: Basic Information
    await user.type(
      within(modal).getByLabelText(/branch name/i),
      'New Test Branch'
    );
    await user.selectOptions(
      within(modal).getByLabelText(/branch type/i),
      'branch'
    );
    await user.click(within(modal).getByRole('button', { name: /next/i }));
    
    // Step 2: Address & Contact
    await user.type(
      within(modal).getByLabelText(/street/i),
      '123 Test Street'
    );
    await user.type(
      within(modal).getByLabelText(/city/i),
      'Test City'
    );
    // ... fill other fields
    
    await user.click(within(modal).getByRole('button', { name: /create/i }));
    
    // Verify branch was created
    await waitFor(() => {
      expect(screen.getByText('New Test Branch')).toBeInTheDocument();
    });
  });
});
```

## Performance Optimization

### Code Splitting
```typescript
// Lazy load branch components
const BranchManagementDashboard = lazy(() => 
  import('./components/branch/BranchManagementDashboard').then(module => ({
    default: module.BranchManagementDashboard
  }))
);

const BranchMetrics = lazy(() => 
  import('./components/branch/BranchMetrics')
);

// Usage with suspense
<Suspense fallback={<BranchDashboardSkeleton />}>
  <BranchManagementDashboard />
</Suspense>
```

### Memoization Strategies
```typescript
// Memoize expensive calculations
const BranchList = React.memo<BranchListProps>(({ branches, filters }) => {
  const filteredBranches = useMemo(() => {
    return branches.filter(branch => {
      if (filters.status && branch.status !== filters.status) return false;
      if (filters.type && branch.type !== filters.type) return false;
      return true;
    });
  }, [branches, filters]);
  
  return (
    <div>
      {filteredBranches.map(branch => (
        <BranchCard key={branch._id} branch={branch} />
      ))}
    </div>
  );
});

// Callback memoization
const BranchActions = ({ onEdit, onDelete }: BranchActionsProps) => {
  const handleEdit = useCallback((branch: Branch) => {
    onEdit(branch);
  }, [onEdit]);
  
  const handleDelete = useCallback((branch: Branch) => {
    onDelete(branch);
  }, [onDelete]);
  
  return (
    <DropdownMenu>
      <DropdownMenuItem onClick={() => handleEdit(branch)}>
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleDelete(branch)}>
        Delete
      </DropdownMenuItem>
    </DropdownMenu>
  );
};
```

### Virtual Scrolling
```typescript
// Virtual list for large branch datasets
import { FixedSizeList as List } from 'react-window';

interface VirtualBranchListProps {
  branches: Branch[];
  height: number;
  itemHeight: number;
}

const VirtualBranchList: React.FC<VirtualBranchListProps> = ({
  branches,
  height,
  itemHeight
}) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <BranchCard branch={branches[index]} />
    </div>
  );
  
  return (
    <List
      height={height}
      itemCount={branches.length}
      itemSize={itemHeight}
      overscanCount={5}
    >
      {Row}
    </List>
  );
};
```

### Data Fetching Optimization
```typescript
// Implement data prefetching
export const useBranchPrefetch = () => {
  const queryClient = useQueryClient();
  
  const prefetchBranches = useCallback(async (filters?: BranchFilters) => {
    await queryClient.prefetchQuery({
      queryKey: ['branches', filters],
      queryFn: () => branchApiClient.fetchBranches(filters),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
  
  const prefetchBranchMetrics = useCallback(async (branchId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['branch-metrics', branchId],
      queryFn: () => branchApiClient.fetchBranchMetrics(branchId),
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient]);
  
  return { prefetchBranches, prefetchBranchMetrics };
};

// Usage in components
const BranchList = ({ branches }: { branches: Branch[] }) => {
  const { prefetchBranchMetrics } = useBranchPrefetch();
  
  const handleBranchHover = (branchId: string) => {
    // Prefetch metrics on hover
    prefetchBranchMetrics(branchId);
  };
  
  return (
    <div>
      {branches.map(branch => (
        <div
          key={branch._id}
          onMouseEnter={() => handleBranchHover(branch._id)}
        >
          <BranchCard branch={branch} />
        </div>
      ))}
    </div>
  );
};
```

## Customization and Extensions

### Plugin Architecture
```typescript
// Branch plugin interface
interface BranchPlugin {
  name: string;
  version: string;
  init: (context: BranchContext) => void;
  cleanup?: () => void;
}

// Plugin manager
export class BranchPluginManager {
  private plugins: Map<string, BranchPlugin> = new Map();
  
  register(plugin: BranchPlugin) {
    this.plugins.set(plugin.name, plugin);
    plugin.init(this.getBranchContext());
  }
  
  unregister(pluginName: string) {
    const plugin = this.plugins.get(pluginName);
    if (plugin?.cleanup) {
      plugin.cleanup();
    }
    this.plugins.delete(pluginName);
  }
  
  private getBranchContext(): BranchContext {
    return {
      // Provide access to branch functionality
    };
  }
}

// Example plugin
const analyticsPlugin: BranchPlugin = {
  name: 'branch-analytics',
  version: '1.0.0',
  init: (context) => {
    // Add analytics tracking to branch operations
    context.onBranchCreate((branch) => {
      analytics.track('branch_created', { branchId: branch._id });
    });
  },
};
```

### Custom Field Extensions
```typescript
// Extensible branch schema
interface BaseBranch {
  _id: string;
  name: string;
  // ... core fields
}

interface ExtendableBranch<T = Record<string, unknown>> extends BaseBranch {
  customFields?: T;
  metadata?: Record<string, unknown>;
}

// Type-safe custom fields
interface RestaurantBranch extends ExtendableBranch<{
  cuisineTypes: string[];
  seatingArrangement: 'indoor' | 'outdoor' | 'both';
  parkingAvailable: boolean;
}> {}

// Custom field renderer
const CustomFieldRenderer: React.FC<{
  fields: Record<string, unknown>;
  schema: FieldSchema[];
}> = ({ fields, schema }) => {
  return (
    <div className="space-y-4">
      {schema.map(field => (
        <div key={field.name}>
          <Label>{field.label}</Label>
          {renderFieldByType(field, fields[field.name])}
        </div>
      ))}
    </div>
  );
};
```

### Theme Customization
```typescript
// Branch-specific theme configuration
interface BranchThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: {
    fontSize: 'sm' | 'md' | 'lg';
    fontFamily: string;
  };
  layout: {
    density: 'compact' | 'comfortable' | 'spacious';
    cardStyle: 'minimal' | 'detailed' | 'rich';
  };
}

const BranchThemeProvider: React.FC<{
  theme: BranchThemeConfig;
  children: React.ReactNode;
}> = ({ theme, children }) => {
  const cssVariables = {
    '--branch-primary': theme.colors.primary,
    '--branch-secondary': theme.colors.secondary,
    '--branch-accent': theme.colors.accent,
  };
  
  return (
    <div style={cssVariables} className={`branch-theme-${theme.layout.density}`}>
      {children}
    </div>
  );
};
```

## Development Tools

### Developer Console
```typescript
// Development utilities for branch management
if (process.env.NODE_ENV === 'development') {
  (window as any).__branchDevTools = {
    // Debug branch state
    getBranchState: () => {
      const state = store.getState().branches;
      console.table(state.branches);
      return state;
    },
    
    // Simulate branch operations
    simulateCreateBranch: async (data: Partial<CreateBranchData>) => {
      const mockBranch: Branch = {
        _id: `mock-${Date.now()}`,
        name: data.name || 'Mock Branch',
        type: data.type || 'branch',
        // ... other mock data
      };
      
      store.dispatch(addBranch(mockBranch));
      return mockBranch;
    },
    
    // Performance profiling
    profileBranchQueries: () => {
      const startTime = performance.now();
      
      // Measure query performance
      return {
        duration: performance.now() - startTime,
        queryCount: queryClient.getQueryCache().getAll().length,
      };
    },
  };
}
```

### Debugging Utilities
```typescript
// Debug hooks
export const useBranchDebug = (branchId: string) => {
  const branch = useBranch(branchId);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`Branch Debug: ${branchId}`);
      console.log('Branch data:', branch);
      console.log('Query state:', {
        isLoading: branch.isLoading,
        isError: branch.isError,
        dataUpdatedAt: branch.dataUpdatedAt,
      });
      console.groupEnd();
    }
  }, [branch, branchId]);
  
  return branch;
};

// Performance monitor
export const useBranchPerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<{
    renderCount: number;
    lastRenderTime: number;
    averageRenderTime: number;
  }>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
  });
  
  useEffect(() => {
    const startTime = performance.now();
    
    setMetrics(prev => {
      const renderTime = performance.now() - startTime;
      const newRenderCount = prev.renderCount + 1;
      const newAverageRenderTime = (
        (prev.averageRenderTime * prev.renderCount + renderTime) / 
        newRenderCount
      );
      
      return {
        renderCount: newRenderCount,
        lastRenderTime: renderTime,
        averageRenderTime: newAverageRenderTime,
      };
    });
  });
  
  return metrics;
};
```

### Code Generation Tools
```bash
#!/bin/bash
# scripts/generate-branch-component.sh

COMPONENT_NAME=$1
COMPONENT_DIR="src/components/branch"

if [ -z "$COMPONENT_NAME" ]; then
  echo "Usage: $0 <ComponentName>"
  exit 1
fi

# Create component file
cat > "$COMPONENT_DIR/$COMPONENT_NAME.tsx" << EOF
import React from 'react';
import { Branch } from '../../types/branch.types';

interface ${COMPONENT_NAME}Props {
  branch: Branch;
  // Add more props as needed
}

export const ${COMPONENT_NAME}: React.FC<${COMPONENT_NAME}Props> = ({
  branch
}) => {
  return (
    <div>
      <h3>{branch.name}</h3>
      {/* Component implementation */}
    </div>
  );
};

export default ${COMPONENT_NAME};
EOF

# Create test file
cat > "$COMPONENT_DIR/__tests__/$COMPONENT_NAME.test.tsx" << EOF
import { render, screen } from '@testing-library/react';
import { ${COMPONENT_NAME} } from '../${COMPONENT_NAME}';
import { mockBranch } from '../../../__tests__/mocks/branchMockData';

describe('${COMPONENT_NAME}', () => {
  it('renders correctly', () => {
    render(<${COMPONENT_NAME} branch={mockBranch} />);
    expect(screen.getByText(mockBranch.name)).toBeInTheDocument();
  });
});
EOF

echo "Generated ${COMPONENT_NAME} component and test files"
```

## Debugging Guide

### Common Issues and Solutions

#### State Synchronization Issues
```typescript
// Debug state sync between context and components
export const useBranchStateDiff = (branchId: string) => {
  const contextBranch = useBranchContext().currentBranch;
  const queryBranch = useBranch(branchId).data;
  
  useEffect(() => {
    if (contextBranch && queryBranch && contextBranch._id === queryBranch._id) {
      const diff = {
        contextUpdatedAt: contextBranch.updatedAt,
        queryUpdatedAt: queryBranch.updatedAt,
        isOutOfSync: contextBranch.updatedAt !== queryBranch.updatedAt,
      };
      
      if (diff.isOutOfSync) {
        console.warn('Branch state out of sync:', diff);
      }
    }
  }, [contextBranch, queryBranch]);
};
```

#### Memory Leaks
```typescript
// Monitor component mount/unmount cycles
export const useBranchComponentTracker = (componentName: string) => {
  useEffect(() => {
    console.log(`${componentName} mounted`);
    
    return () => {
      console.log(`${componentName} unmounted`);
    };
  }, [componentName]);
  
  // Track re-renders
  const renderCount = useRef(0);
  renderCount.current += 1;
  
  useEffect(() => {
    if (renderCount.current > 10) {
      console.warn(`${componentName} has re-rendered ${renderCount.current} times`);
    }
  });
};
```

#### API Request Debugging
```typescript
// Request/response logger
const apiDebugger = {
  logRequest: (method: string, url: string, data?: unknown) => {
    console.group(`🚀 ${method} ${url}`);
    if (data) console.log('Request data:', data);
    console.time('Request duration');
  },
  
  logResponse: (status: number, data: unknown) => {
    console.timeEnd('Request duration');
    console.log(`📥 Response ${status}:`, data);
    console.groupEnd();
  },
  
  logError: (error: Error) => {
    console.timeEnd('Request duration');
    console.error('❌ Request failed:', error);
    console.groupEnd();
  },
};
```

### Performance Debugging
```typescript
// React DevTools Profiler integration
export const BranchProfiler: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const onRender = (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number
  ) => {
    if (actualDuration > 16) { // Frame budget exceeded
      console.warn(`Slow render in ${id}:`, {
        phase,
        actualDuration,
        baseDuration,
      });
    }
  };
  
  return (
    <Profiler id="BranchManagement" onRender={onRender}>
      {children}
    </Profiler>
  );
};
```

## Best Practices Summary

### Code Organization
1. Use TypeScript for all components and services
2. Implement proper error boundaries
3. Separate concerns with custom hooks
4. Use compound component patterns for complex UI

### State Management
1. Leverage React Query for server state
2. Use Context sparingly for truly global state
3. Implement optimistic updates for better UX
4. Cache frequently accessed data

### Performance
1. Implement code splitting for large components
2. Use memo, useMemo, and useCallback appropriately
3. Implement virtual scrolling for large lists
4. Prefetch data on user interactions

### Testing
1. Write unit tests for all hooks and utilities
2. Test component integration with React Testing Library
3. Mock API calls consistently
4. Test error states and loading states

### Accessibility
1. Use semantic HTML elements
2. Implement proper ARIA labels
3. Ensure keyboard navigation support
4. Test with screen readers

This developer guide provides a comprehensive foundation for working with the Branch Management system. Follow these patterns and practices to maintain code quality and system reliability.

---
*Last Updated: January 2025*
*Version: 2.0*