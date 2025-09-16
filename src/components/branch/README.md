# Branch Switcher Component

A professional, interactive branch switching interface for multi-branch restaurant management systems.

## Features

### Core Functionality
- **Modal Interface**: Clean, modern modal dialog for branch selection
- **Grid Layout**: Responsive grid showing branch cards (1 col mobile, 2-3 cols desktop)
- **Current Branch Highlighting**: Visual indication of active branch with blue accent
- **Status Indicators**: Live status badges (active/inactive/suspended)
- **Permission-Based Filtering**: Only shows branches user can access
- **Recent Branches**: Quick access to recently used branches
- **Search & Filter**: Real-time search across branch names, locations, codes, and types

### Interactive Features
- **Hover Details**: Comprehensive branch information sidebar on card hover
- **Quick Switch**: One-click branch switching with confirmation
- **Loading States**: Smooth loading animations during branch operations
- **Error Handling**: Graceful error display and recovery
- **Keyboard Navigation**: Full keyboard support including shortcuts

### Accessibility & UX
- **Keyboard Shortcuts**: Ctrl+B to open switcher globally
- **ARIA Labels**: Full screen reader support
- **Focus Management**: Proper focus handling and tab navigation
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Professional Styling**: Modern cards with smooth animations and hover effects

## Components

### `BranchSwitcher`
Main modal component for branch switching interface.

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Callback when modal should close

**Features:**
- Integrates with `useBranches` hook automatically
- Handles permissions and access control
- Manages recent branches in localStorage
- Provides detailed branch information on hover

### `BranchSwitcherProvider`
Wrapper component that adds global keyboard shortcut support.

**Props:**
- `children?: React.ReactNode` - Child components to wrap

**Features:**
- Enables Ctrl+B global shortcut
- Manages modal state internally
- Can be placed at app root level

### `BranchSwitcherDemo`
Example implementation showing integration patterns.

**Features:**
- Header button integration
- Permission-aware rendering
- Multiple trigger button styles
- Current branch display

## Usage

### Basic Integration

```tsx
import { BranchSwitcher } from '@/components/branch';

function Header() {
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  
  return (
    <header>
      <button onClick={() => setIsSwitcherOpen(true)}>
        Switch Branch
      </button>
      
      <BranchSwitcher
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
      />
    </header>
  );
}
```

### Global Keyboard Shortcuts

```tsx
import { BranchSwitcherProvider } from '@/components/branch';

function App() {
  return (
    <BranchSwitcherProvider>
      {/* Your app content */}
      <Routes>
        {/* Routes */}
      </Routes>
    </BranchSwitcherProvider>
  );
}
```

### Header Integration

```tsx
import { BranchSwitcherDemo } from '@/components/branch';

function AppHeader() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1>Restaurant Manager</h1>
      <BranchSwitcherDemo />
    </header>
  );
}
```

## Dependencies

### Required Hooks
- `useBranches` - Branch data and operations
- `useKeyboardShortcuts` - Global keyboard shortcut support

### Required Types
- `Branch` - Branch interface from `types/branch.types.ts`

### UI Dependencies
- Lucide React icons
- Tailwind CSS for styling

## Branch Data Requirements

The component expects branches to have this structure:

```typescript
interface Branch {
  _id: string;
  name: string;
  code: string;
  type: 'main' | 'branch' | 'franchise';
  status: 'active' | 'inactive' | 'suspended';
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    managerName?: string;
  };
  staffing?: {
    currentStaff: number;
    maxStaff: number;
  };
  operations?: {
    seatingCapacity?: number;
  };
  financial?: {
    currency: string;
  };
}
```

## Keyboard Shortcuts

- **Ctrl+B**: Open branch switcher (global)
- **Escape**: Close modal
- **Enter/Space**: Select focused branch card
- **Tab**: Navigate between elements

## Styling

The component uses Tailwind CSS with these key design elements:

- **Modern Cards**: Rounded corners, subtle shadows, hover effects
- **Status Badges**: Color-coded status indicators
- **Responsive Grid**: Adapts to screen size automatically  
- **Smooth Animations**: Transform and color transitions
- **Professional Typography**: Clear hierarchy and readable fonts

## Customization

### Theme Colors
- Primary: Blue (500/600) for active states and highlights
- Success: Green (400/500) for active branch status
- Warning: Red for suspended branches
- Neutral: Gray scale for inactive states

### Grid Breakpoints
- Mobile: 1 column
- Tablet: 2 columns (md)
- Desktop: 3 columns (lg)

### Animation Timing
- Hover effects: 300ms
- Modal transitions: Standard CSS transitions
- Loading states: Spin animation

## Performance Considerations

- **Search Filtering**: Optimized with useMemo for large branch lists
- **Recent Branches**: Limited to 5 most recent for performance
- **Hover State**: Efficient state management to prevent unnecessary renders
- **Permission Checks**: Cached results prevent repeated API calls

## Error Handling

- **Network Errors**: Graceful fallback with error messages
- **Permission Errors**: Clear messaging when access denied  
- **Loading States**: Prevents user interaction during operations
- **Validation**: Input validation with user-friendly messages

## Browser Compatibility

- Modern browsers supporting ES2018+
- CSS Grid and Flexbox support required
- Keyboard event handling (standard)
- LocalStorage support for recent branches