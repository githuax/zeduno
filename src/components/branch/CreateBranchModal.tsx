import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  DollarSign,
  Users,
  Settings,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

// UI Components
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Types
import { Branch, CreateBranchData } from '@/types/branch.types';

// Hooks
import { useTenant } from '@/contexts/TenantContext';

interface CreateBranchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateBranchData) => Promise<void>;
  branches: Branch[];
  loading?: boolean;
  onSuccess?: () => void;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  optional?: boolean;
}

interface BranchFormData extends Omit<CreateBranchData, 'address' | 'contact'> {
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    phone: string;
    email: string;
    managerName?: string;
    managerPhone?: string;
    managerEmail?: string;
  };
  operations: {
    openTime: string;
    closeTime: string;
    timezone: string;
    daysOpen: string[];
    seatingCapacity?: number;
    deliveryRadius?: number;
  };
  financial: {
    currency: string;
    taxRate: number;
    serviceChargeRate?: number;
    tipEnabled: boolean;
    paymentMethods: string[];
  };
  inventory: {
    trackInventory: boolean;
    lowStockAlertEnabled: boolean;
    autoReorderEnabled: boolean;
  };
  staffing: {
    maxStaff: number;
    roles: string[];
  };
  integrations: {
    onlineOrderingEnabled: boolean;
  };
  settings: {
    orderPrefix: string;
    theme?: string;
  };
}

const defaultFormData: BranchFormData = {
  name: '',
  type: 'branch',
  address: {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  },
  contact: {
    phone: '',
    email: '',
  },
  operations: {
    openTime: '09:00',
    closeTime: '22:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    daysOpen: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  },
  financial: {
    currency: 'KES',
    taxRate: 0,
    tipEnabled: true,
    paymentMethods: ['cash'],
  },
  inventory: {
    trackInventory: true,
    lowStockAlertEnabled: true,
    autoReorderEnabled: false,
  },
  staffing: {
    maxStaff: 10,
    roles: ['cashier', 'kitchen_staff'],
  },
  integrations: {
    onlineOrderingEnabled: false,
  },
  settings: {
    orderPrefix: 'BR',
  },
};

const wizardSteps: WizardStep[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Branch name, type, and parent',
    icon: Building2,
    completed: false,
  },
  {
    id: 'location',
    title: 'Location & Contact',
    description: 'Address and contact details',
    icon: MapPin,
    completed: false,
  },
  {
    id: 'operations',
    title: 'Operations',
    description: 'Hours, capacity, and operational settings',
    icon: Clock,
    completed: false,
  },
  {
    id: 'financial',
    title: 'Financial Settings',
    description: 'Currency, taxes, and payment methods',
    icon: DollarSign,
    completed: false,
  },
  {
    id: 'additional',
    title: 'Additional Settings',
    description: 'Inventory, staffing, and integrations',
    icon: Settings,
    completed: false,
    optional: true,
  },
];

// Restrict currency options to East African currencies
const currencies = [
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'UGX', name: 'Ugandan Shilling' },
  { code: 'SSP', name: 'South Sudanese Pound' },
  { code: 'TZS', name: 'Tanzanian Shilling' },
  { code: 'RWF', name: 'Rwandan Franc' },
  { code: 'BIF', name: 'Burundian Franc' },
];
const allowedCurrencyCodes = currencies.map(c => c.code);
const commonTimezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
  'Africa/Cairo',
  'Africa/Johannesburg',
];
const paymentMethods = ['cash', 'credit_card', 'debit_card', 'mobile_payment', 'bank_transfer', 'cryptocurrency'];
const weekDays = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
];
const staffRoles = ['manager', 'assistant_manager', 'cashier', 'kitchen_staff', 'server', 'cleaner', 'security'];

export const CreateBranchModal: React.FC<CreateBranchModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  branches,
  loading = false,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<BranchFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get current tenant context
  const { context, isLoading: isTenantLoading } = useTenant();
  
  // Debug tenant context
  console.log('CreateBranchModal - Tenant Context:', context);
  console.log('CreateBranchModal - Tenant Loading:', isTenantLoading);
  const currentTenant = context?.tenant;
  console.log('CreateBranchModal - Current Tenant:', currentTenant);

  // Available parent branches (main and branch types only)
  const availableParents = useMemo(() => {
    return branches.filter(b => b.type === 'main' || b.type === 'branch');
  }, [branches]);

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setFormData(defaultFormData);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open]);

  // Form validation
  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};
    const step = wizardSteps[stepIndex];

    switch (step.id) {
      case 'basic':
        if (!formData.name.trim()) newErrors.name = 'Branch name is required';
        if (!formData.type) newErrors.type = 'Branch type is required';
        break;

      case 'location':
        if (!formData.address.street.trim()) newErrors.street = 'Street address is required';
        if (!formData.address.city.trim()) newErrors.city = 'City is required';
        if (!formData.address.state.trim()) newErrors.state = 'State is required';
        if (!formData.address.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
        if (!formData.address.country.trim()) newErrors.country = 'Country is required';
        if (!formData.contact.phone.trim()) newErrors.phone = 'Phone is required';
        if (!formData.contact.email.trim()) newErrors.email = 'Email is required';
        if (formData.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        break;

      case 'operations':
        if (!formData.operations.openTime) newErrors.openTime = 'Opening time is required';
        if (!formData.operations.closeTime) newErrors.closeTime = 'Closing time is required';
        if (!formData.operations.timezone) newErrors.timezone = 'Timezone is required';
        if (formData.operations.daysOpen.length === 0) newErrors.daysOpen = 'At least one day must be selected';
        break;

      case 'financial':
        if (!formData.financial.currency) newErrors.currency = 'Currency is required';
        if (formData.financial.taxRate < 0 || formData.financial.taxRate > 100) {
          newErrors.taxRate = 'Tax rate must be between 0 and 100';
        }
        if (formData.financial.paymentMethods.length === 0) {
          newErrors.paymentMethods = 'At least one payment method must be selected';
        }
        break;

      case 'additional':
        if (formData.staffing.maxStaff <= 0) newErrors.maxStaff = 'Max staff must be greater than 0';
        if (!formData.settings.orderPrefix.trim()) newErrors.orderPrefix = 'Order prefix is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation handlers
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < wizardSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow jumping to previous steps or if current step is valid
    if (stepIndex <= currentStep || validateStep(currentStep)) {
      setCurrentStep(stepIndex);
    }
  };

  // Form handlers
  const updateFormData = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const updatedData = { ...prev };
      let current: any = updatedData;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return updatedData;
    });

    // Clear error when user starts typing
    if (errors[path.split('.').pop() || '']) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[path.split('.').pop() || ''];
        return newErrors;
      });
    }
  };

  const handleArrayToggle = (path: string, value: string) => {
    const keys = path.split('.');
    let current = formData;
    for (let i = 0; i < keys.length - 1; i++) {
      current = (current as any)[keys[i]];
    }
    const array = (current as any)[keys[keys.length - 1]] as string[];
    
    const newArray = array.includes(value) 
      ? array.filter(item => item !== value)
      : [...array, value];
    
    updateFormData(path, newArray);
  };

  // Submit handler
  const handleSubmit = async () => {
    // Validate all steps
    const allValid = wizardSteps.every((_, index) => validateStep(index));
    
    if (!allValid) {
      // Find first invalid step
      const firstInvalidStep = wizardSteps.findIndex((_, index) => !validateStep(index));
      setCurrentStep(firstInvalidStep);
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: CreateBranchData = {
        name: formData.name,
        type: formData.type,
        parentBranchId: formData.parentBranchId,
        address: formData.address,
        contact: formData.contact,
        operations: formData.operations,
        financial: formData.financial,
        inventory: formData.inventory,
        staffing: formData.staffing,
        integrations: formData.integrations,
        settings: formData.settings,
      };

      await onSubmit(submitData);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create branch:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step completion status
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <div className="flex h-full">
          {/* Step Navigation Sidebar */}
          <div className="w-80 border-r bg-muted/50 p-6">
            <DialogHeader className="mb-6">
              <DialogTitle>Create New Branch</DialogTitle>
              <DialogDescription>
                Set up a new branch location with all necessary settings
              </DialogDescription>
            </DialogHeader>

            <nav className="space-y-2">
              {wizardSteps.map((step, index) => {
                const status = getStepStatus(index);
                const StepIcon = step.icon;

                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      status === 'current' 
                        ? 'bg-primary text-primary-foreground' 
                        : status === 'completed'
                        ? 'bg-muted text-foreground hover:bg-muted/80'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${
                        status === 'completed' ? 'text-green-600' : ''
                      }`}>
                        {status === 'completed' ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {step.title}
                          {step.optional && (
                            <Badge variant="outline" className="text-xs">
                              Optional
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm opacity-70 mt-1">
                          {step.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-6">
              {/* Step Content */}
              {currentStep === 0 && (
                <BasicInformationStep
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                  availableParents={availableParents}
                  currentTenant={currentTenant}
                  isTenantLoading={isTenantLoading}
                  context={context}
                />
              )}
              
              {currentStep === 1 && (
                <LocationContactStep
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                />
              )}
              
              {currentStep === 2 && (
                <OperationsStep
                  formData={formData}
                  updateFormData={updateFormData}
                  handleArrayToggle={handleArrayToggle}
                  errors={errors}
                />
              )}
              
              {currentStep === 3 && (
                <FinancialStep
                  formData={formData}
                  updateFormData={updateFormData}
                  handleArrayToggle={handleArrayToggle}
                  errors={errors}
                />
              )}
              
              {currentStep === 4 && (
                <AdditionalSettingsStep
                  formData={formData}
                  updateFormData={updateFormData}
                  handleArrayToggle={handleArrayToggle}
                  errors={errors}
                />
              )}
            </ScrollArea>

            {/* Navigation Footer */}
            <div className="border-t p-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Step {currentStep + 1} of {wizardSteps.length}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {currentStep < wizardSteps.length - 1 ? (
                  <Button onClick={handleNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || loading}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Branch'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Step Components
const BasicInformationStep: React.FC<{
  formData: BranchFormData;
  updateFormData: (path: string, value: any) => void;
  errors: Record<string, string>;
  availableParents: Branch[];
  currentTenant?: { name: string; _id: string } | null;
  isTenantLoading?: boolean;
  context?: any;
}> = ({ formData, updateFormData, errors, availableParents, currentTenant, isTenantLoading, context }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Provide the basic details for your new branch location.
      </p>
    </div>

    {/* Tenant Information Display */}
    <Card className="bg-muted/30 border-dashed">
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <Label className="text-sm font-medium">Tenant Organization</Label>
            <p className="text-sm text-muted-foreground mt-1">
              This branch will be created under: <span className="font-semibold text-foreground">
                {isTenantLoading ? 'Loading tenant...' : (currentTenant?.name || 'No tenant found')}
              </span>
            </p>
            {!isTenantLoading && !currentTenant && (
              <div className="text-xs text-red-600 mt-1 space-y-1">
                <p>⚠️ Debug: No tenant context found</p>
                <p>Context: {context ? 'Present' : 'Null'}</p>
                <p>User Data: {typeof window !== 'undefined' ? localStorage.getItem('user')?.substring(0, 50) + '...' : 'N/A'}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Branch Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          placeholder="Enter branch name"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Branch Type *</Label>
        <Select value={formData.type} onValueChange={(value) => updateFormData('type', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select branch type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="main">Main Branch</SelectItem>
            <SelectItem value="branch">Branch</SelectItem>
            <SelectItem value="franchise">Franchise</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type}</p>
        )}
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="parent">Parent Branch (Optional)</Label>
      <Select value={formData.parentBranchId || 'none'} onValueChange={(value) => updateFormData('parentBranchId', value === 'none' ? undefined : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Select parent branch (if any)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No parent branch</SelectItem>
          {availableParents.map(branch => (
            <SelectItem key={branch._id} value={branch._id}>
              {branch.name} ({branch.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Select a parent branch to inherit settings and create a hierarchy.
      </p>
    </div>

    {formData.type === 'franchise' && (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Franchise branches may have different operational restrictions and requirements.
        </AlertDescription>
      </Alert>
    )}
  </div>
);

const LocationContactStep: React.FC<{
  formData: BranchFormData;
  updateFormData: (path: string, value: any) => void;
  errors: Record<string, string>;
}> = ({ formData, updateFormData, errors }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Location & Contact</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Enter the physical address and contact information for this branch.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Address Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="street">Street Address *</Label>
          <Input
            id="street"
            value={formData.address.street}
            onChange={(e) => updateFormData('address.street', e.target.value)}
            placeholder="Enter street address"
            className={errors.street ? 'border-destructive' : ''}
          />
          {errors.street && (
            <p className="text-sm text-destructive">{errors.street}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={formData.address.city}
              onChange={(e) => updateFormData('address.city', e.target.value)}
              placeholder="Enter city"
              className={errors.city ? 'border-destructive' : ''}
            />
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State/Province *</Label>
            <Input
              id="state"
              value={formData.address.state}
              onChange={(e) => updateFormData('address.state', e.target.value)}
              placeholder="Enter state or province"
              className={errors.state ? 'border-destructive' : ''}
            />
            {errors.state && (
              <p className="text-sm text-destructive">{errors.state}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code *</Label>
            <Input
              id="postalCode"
              value={formData.address.postalCode}
              onChange={(e) => updateFormData('address.postalCode', e.target.value)}
              placeholder="Enter postal code"
              className={errors.postalCode ? 'border-destructive' : ''}
            />
            {errors.postalCode && (
              <p className="text-sm text-destructive">{errors.postalCode}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={formData.address.country}
              onChange={(e) => updateFormData('address.country', e.target.value)}
              placeholder="Enter country"
              className={errors.country ? 'border-destructive' : ''}
            />
            {errors.country && (
              <p className="text-sm text-destructive">{errors.country}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.contact.phone}
              onChange={(e) => updateFormData('contact.phone', e.target.value)}
              placeholder="Enter phone number"
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.contact.email}
              onChange={(e) => updateFormData('contact.email', e.target.value)}
              placeholder="Enter email address"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Manager Information (Optional)</h4>
          
          <div className="space-y-2">
            <Label htmlFor="managerName">Manager Name</Label>
            <Input
              id="managerName"
              value={formData.contact.managerName || ''}
              onChange={(e) => updateFormData('contact.managerName', e.target.value)}
              placeholder="Enter manager name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="managerPhone">Manager Phone</Label>
              <Input
                id="managerPhone"
                type="tel"
                value={formData.contact.managerPhone || ''}
                onChange={(e) => updateFormData('contact.managerPhone', e.target.value)}
                placeholder="Enter manager phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="managerEmail">Manager Email</Label>
              <Input
                id="managerEmail"
                type="email"
                value={formData.contact.managerEmail || ''}
                onChange={(e) => updateFormData('contact.managerEmail', e.target.value)}
                placeholder="Enter manager email"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const OperationsStep: React.FC<{
  formData: BranchFormData;
  updateFormData: (path: string, value: any) => void;
  handleArrayToggle: (path: string, value: string) => void;
  errors: Record<string, string>;
}> = ({ formData, updateFormData, handleArrayToggle, errors }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Operations</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Configure operational hours and capacity settings.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Operating Hours</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="openTime">Opening Time *</Label>
            <Input
              id="openTime"
              type="time"
              value={formData.operations.openTime}
              onChange={(e) => updateFormData('operations.openTime', e.target.value)}
              className={errors.openTime ? 'border-destructive' : ''}
            />
            {errors.openTime && (
              <p className="text-sm text-destructive">{errors.openTime}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="closeTime">Closing Time *</Label>
            <Input
              id="closeTime"
              type="time"
              value={formData.operations.closeTime}
              onChange={(e) => updateFormData('operations.closeTime', e.target.value)}
              className={errors.closeTime ? 'border-destructive' : ''}
            />
            {errors.closeTime && (
              <p className="text-sm text-destructive">{errors.closeTime}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone *</Label>
          <Select value={formData.operations.timezone} onValueChange={(value) => updateFormData('operations.timezone', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {commonTimezones.map(tz => (
                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.timezone && (
            <p className="text-sm text-destructive">{errors.timezone}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Operating Days *</Label>
          <div className="grid grid-cols-2 gap-2">
            {weekDays.map(day => (
              <div key={day.id} className="flex items-center space-x-2">
                <Checkbox
                  id={day.id}
                  checked={formData.operations.daysOpen.includes(day.id)}
                  onCheckedChange={() => handleArrayToggle('operations.daysOpen', day.id)}
                />
                <Label htmlFor={day.id}>{day.label}</Label>
              </div>
            ))}
          </div>
          {errors.daysOpen && (
            <p className="text-sm text-destructive">{errors.daysOpen}</p>
          )}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Capacity Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="seatingCapacity">Seating Capacity</Label>
            <Input
              id="seatingCapacity"
              type="number"
              min="0"
              value={formData.operations.seatingCapacity || ''}
              onChange={(e) => updateFormData('operations.seatingCapacity', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Enter seating capacity"
            />
            <p className="text-sm text-muted-foreground">
              Maximum number of seated customers
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
            <Input
              id="deliveryRadius"
              type="number"
              min="0"
              step="0.1"
              value={formData.operations.deliveryRadius || ''}
              onChange={(e) => updateFormData('operations.deliveryRadius', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Enter delivery radius"
            />
            <p className="text-sm text-muted-foreground">
              Maximum delivery distance from branch
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const FinancialStep: React.FC<{
  formData: BranchFormData;
  updateFormData: (path: string, value: any) => void;
  handleArrayToggle: (path: string, value: string) => void;
  errors: Record<string, string>;
}> = ({ formData, updateFormData, handleArrayToggle, errors }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Financial Settings</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Configure currency, taxes, and payment methods.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Currency & Taxes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency *</Label>
            <Select value={formData.financial.currency} onValueChange={(value) => updateFormData('financial.currency', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.currency && (
              <p className="text-sm text-destructive">{errors.currency}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.financial.taxRate}
              onChange={(e) => updateFormData('financial.taxRate', parseFloat(e.target.value) || 0)}
              placeholder="Enter tax rate"
              className={errors.taxRate ? 'border-destructive' : ''}
            />
            {errors.taxRate && (
              <p className="text-sm text-destructive">{errors.taxRate}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="serviceChargeRate">Service Charge Rate (%)</Label>
            <Input
              id="serviceChargeRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.financial.serviceChargeRate || ''}
              onChange={(e) => updateFormData('financial.serviceChargeRate', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Enter service charge rate"
            />
            <p className="text-sm text-muted-foreground">
              Additional service charge percentage
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="tipEnabled"
              checked={formData.financial.tipEnabled}
              onCheckedChange={(checked) => updateFormData('financial.tipEnabled', checked)}
            />
            <Label htmlFor="tipEnabled">Enable Tips</Label>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map(method => (
            <div key={method} className="flex items-center space-x-2">
              <Checkbox
                id={method}
                checked={formData.financial.paymentMethods.includes(method)}
                onCheckedChange={() => handleArrayToggle('financial.paymentMethods', method)}
              />
              <Label htmlFor={method} className="capitalize">
                {method.replace('_', ' ')}
              </Label>
            </div>
          ))}
        </div>
        {errors.paymentMethods && (
          <p className="text-sm text-destructive">{errors.paymentMethods}</p>
        )}
      </CardContent>
    </Card>
  </div>
);

const AdditionalSettingsStep: React.FC<{
  formData: BranchFormData;
  updateFormData: (path: string, value: any) => void;
  handleArrayToggle: (path: string, value: string) => void;
  errors: Record<string, string>;
}> = ({ formData, updateFormData, handleArrayToggle, errors }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold mb-4">Additional Settings</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Configure inventory, staffing, and integration settings.
      </p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Inventory Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="trackInventory"
              checked={formData.inventory.trackInventory}
              onCheckedChange={(checked) => updateFormData('inventory.trackInventory', checked)}
            />
            <Label htmlFor="trackInventory">Track Inventory</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="lowStockAlert"
              checked={formData.inventory.lowStockAlertEnabled}
              onCheckedChange={(checked) => updateFormData('inventory.lowStockAlertEnabled', checked)}
            />
            <Label htmlFor="lowStockAlert">Low Stock Alerts</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="autoReorder"
              checked={formData.inventory.autoReorderEnabled}
              onCheckedChange={(checked) => updateFormData('inventory.autoReorderEnabled', checked)}
            />
            <Label htmlFor="autoReorder">Auto Reorder</Label>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Staffing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="maxStaff">Maximum Staff *</Label>
          <Input
            id="maxStaff"
            type="number"
            min="1"
            value={formData.staffing.maxStaff}
            onChange={(e) => updateFormData('staffing.maxStaff', parseInt(e.target.value) || 1)}
            placeholder="Enter maximum staff count"
            className={errors.maxStaff ? 'border-destructive' : ''}
          />
          {errors.maxStaff && (
            <p className="text-sm text-destructive">{errors.maxStaff}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Staff Roles</Label>
          <div className="grid grid-cols-2 gap-2">
            {staffRoles.map(role => (
              <div key={role} className="flex items-center space-x-2">
                <Checkbox
                  id={role}
                  checked={formData.staffing.roles.includes(role)}
                  onCheckedChange={() => handleArrayToggle('staffing.roles', role)}
                />
                <Label htmlFor={role} className="capitalize">
                  {role.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="orderPrefix">Order Prefix *</Label>
          <Input
            id="orderPrefix"
            value={formData.settings.orderPrefix}
            onChange={(e) => updateFormData('settings.orderPrefix', e.target.value)}
            placeholder="Enter order prefix"
            maxLength={5}
            className={errors.orderPrefix ? 'border-destructive' : ''}
          />
          <p className="text-sm text-muted-foreground">
            Prefix for order numbers (e.g., "BR" for orders like BR-001)
          </p>
          {errors.orderPrefix && (
            <p className="text-sm text-destructive">{errors.orderPrefix}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="onlineOrdering"
            checked={formData.integrations.onlineOrderingEnabled}
            onCheckedChange={(checked) => updateFormData('integrations.onlineOrderingEnabled', checked)}
          />
          <Label htmlFor="onlineOrdering">Enable Online Ordering</Label>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default CreateBranchModal;
