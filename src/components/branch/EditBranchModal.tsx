import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  DollarSign,
  Users,
  Settings,
  Save,
  X,
  AlertCircle,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Types
import { Branch, UpdateBranchData } from '@/types/branch.types';
import { useSubcounties } from '@/hooks/useSubcounties';
import { useWards } from '@/hooks/useWards';

interface EditBranchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: Branch | null;
  onSubmit: (data: UpdateBranchData) => Promise<void>;
  loading?: boolean;
  onSuccess?: () => void;
}

interface BranchEditFormData {
  name?: string;
  type?: 'main' | 'branch' | 'franchise';
  status?: 'active' | 'inactive' | 'suspended';
  parentBranchId?: string;
  wardId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    subcounty?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  contact?: {
    phone?: string;
    email?: string;
    managerName?: string;
    managerPhone?: string;
    managerEmail?: string;
  };
  operations?: {
    openTime?: string;
    closeTime?: string;
    timezone?: string;
    daysOpen?: string[];
    holidaySchedule?: any[];
    seatingCapacity?: number;
    deliveryRadius?: number;
  };
  financial?: {
    currency?: string;
    taxRate?: number;
    serviceChargeRate?: number;
    tipEnabled?: boolean;
    paymentMethods?: string[];
    bankAccount?: {
      accountName?: string;
      accountNumber?: string;
      bankName?: string;
      routingNumber?: string;
    };
  };
  inventory?: {
    trackInventory?: boolean;
    lowStockAlertEnabled?: boolean;
    autoReorderEnabled?: boolean;
    warehouseId?: string;
  };
  menuConfig?: {
    inheritFromParent?: boolean;
    priceMultiplier?: number;
    customPricing?: boolean;
    availableCategories?: string[];
  };
  staffing?: {
    maxStaff?: number;
    roles?: string[];
    shiftPattern?: string;
  };
  integrations?: {
    posSystemId?: string;
    posSystemType?: string;
    kitchenDisplayId?: string;
    onlineOrderingEnabled?: boolean;
  };
  settings?: {
    orderPrefix?: string;
    receiptHeader?: string;
    receiptFooter?: string;
    logoUrl?: string;
    theme?: string;
  };
}

// Restrict currency options to East African currencies
// Kenya (KES), Uganda (UGX), South Sudan (SSP), Tanzania (TZS), Rwanda (RWF), Burundi (BIF)
const currencies = [
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'UGX', name: 'Ugandan Shilling' },
  { code: 'SSP', name: 'South Sudanese Pound' },
  { code: 'TZS', name: 'Tanzanian Shilling' },
  { code: 'RWF', name: 'Rwandan Franc' },
  { code: 'BIF', name: 'Burundian Franc' },
];
const allowedCurrencyCodes = currencies.map((c) => c.code);
const timezones = Intl.supportedValuesOf('timeZone');
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
const posSystemTypes = ['square', 'clover', 'toast', 'lightspeed', 'revel', 'custom'];

export const EditBranchModal: React.FC<EditBranchModalProps> = ({
  open,
  onOpenChange,
  branch,
  onSubmit,
  loading = false,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<BranchEditFormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Initialize form data when branch changes
  useEffect(() => {
    if (branch && open) {
      const initialData: BranchEditFormData = {
        name: branch.name,
        type: branch.type,
        status: branch.status,
        parentBranchId: branch.parentBranchId,
        wardId: branch.ward?._id,
        address: { ...branch.address },
        contact: { ...branch.contact },
        operations: { ...branch.operations },
        financial: { ...branch.financial },
        inventory: { ...branch.inventory },
        menuConfig: { ...branch.menuConfig },
        staffing: { ...branch.staffing },
        integrations: { ...branch.integrations },
        settings: { ...branch.settings },
      };

      // If existing branch currency isn't in the allowed list, default to KES
      const currentCurrency = initialData.financial?.currency;
      const currencyNeedsDefault = !currentCurrency || !allowedCurrencyCodes.includes(currentCurrency);
      if (!initialData.financial) initialData.financial = {};
      if (currencyNeedsDefault) {
        initialData.financial.currency = 'KES';
      }

      setFormData(initialData);
      // Mark as changed only if we defaulted an unsupported currency
      setHasChanges(currencyNeedsDefault);
      setErrors({});
      setActiveTab('basic');
    }
  }, [branch, open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({});
      setErrors({});
      setHasChanges(false);
      setIsSubmitting(false);
    }
  }, [open]);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.name && !formData.name.trim()) {
      newErrors.name = 'Branch name cannot be empty';
    }

    if (formData.contact?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.contact?.managerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.managerEmail)) {
      newErrors.managerEmail = 'Please enter a valid manager email address';
    }

    if (formData.financial?.taxRate && (formData.financial.taxRate < 0 || formData.financial.taxRate > 100)) {
      newErrors.taxRate = 'Tax rate must be between 0 and 100';
    }

    if (formData.financial?.serviceChargeRate && (formData.financial.serviceChargeRate < 0 || formData.financial.serviceChargeRate > 100)) {
      newErrors.serviceChargeRate = 'Service charge rate must be between 0 and 100';
    }

    if (formData.financial?.alcoholTaxRate !== undefined && (formData.financial.alcoholTaxRate < 0 || formData.financial.alcoholTaxRate > 100)) {
      newErrors.alcoholTaxRate = 'Alcohol tax rate must be between 0 and 100';
    }

    if (formData.staffing?.maxStaff && formData.staffing.maxStaff <= 0) {
      newErrors.maxStaff = 'Max staff must be greater than 0';
    }

    if (formData.menuConfig?.priceMultiplier && formData.menuConfig.priceMultiplier <= 0) {
      newErrors.priceMultiplier = 'Price multiplier must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

    setHasChanges(true);

    // Clear error when user starts typing
    const fieldKey = path.split('.').pop() || '';
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
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
    const array = (current as any)?.[keys[keys.length - 1]] as string[] || [];
    
    const newArray = array.includes(value) 
      ? array.filter(item => item !== value)
      : [...array, value];
    
    updateFormData(path, newArray);
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Only include changed fields in the update
      const updateData: UpdateBranchData = {};
      
      // Compare with original branch data and only include changed fields
      if (formData.name !== branch?.name) updateData.name = formData.name;
      if (formData.type !== branch?.type) updateData.type = formData.type;
      if (formData.status !== branch?.status) updateData.status = formData.status;
      if (formData.parentBranchId !== branch?.parentBranchId) updateData.parentBranchId = formData.parentBranchId;
      if (formData.wardId !== branch?.ward?._id) updateData.wardId = formData.wardId;
      
      if (JSON.stringify(formData.address) !== JSON.stringify(branch?.address)) {
        updateData.address = formData.address;
      }
      
      if (JSON.stringify(formData.contact) !== JSON.stringify(branch?.contact)) {
        updateData.contact = formData.contact;
      }
      
      if (JSON.stringify(formData.operations) !== JSON.stringify(branch?.operations)) {
        updateData.operations = formData.operations;
      }
      
      if (JSON.stringify(formData.financial) !== JSON.stringify(branch?.financial)) {
        updateData.financial = formData.financial;
      }

      await onSubmit(updateData);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update branch:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!branch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Edit Branch: {branch.name}
          </DialogTitle>
          <DialogDescription>
            Update branch settings and configuration. Changes are saved immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic" className="text-xs">
                  <Building2 className="h-4 w-4 mr-1" />
                  Basic
                </TabsTrigger>
                <TabsTrigger value="location" className="text-xs">
                  <MapPin className="h-4 w-4 mr-1" />
                  Location
                </TabsTrigger>
                <TabsTrigger value="operations" className="text-xs">
                  <Clock className="h-4 w-4 mr-1" />
                  Operations
                </TabsTrigger>
                <TabsTrigger value="financial" className="text-xs">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Financial
                </TabsTrigger>
                <TabsTrigger value="staff" className="text-xs">
                  <Users className="h-4 w-4 mr-1" />
                  Staff
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 px-6">
              <div className="py-4">
                <TabsContent value="basic" className="space-y-6 mt-0">
                  <BasicInfoTab
                    formData={formData}
                    updateFormData={updateFormData}
                    errors={errors}
                    branch={branch}
                  />
                </TabsContent>

                <TabsContent value="location" className="space-y-6 mt-0">
                  <LocationTab
                    formData={formData}
                    updateFormData={updateFormData}
                    errors={errors}
                  />
                </TabsContent>

                <TabsContent value="operations" className="space-y-6 mt-0">
                  <OperationsTab
                    formData={formData}
                    updateFormData={updateFormData}
                    handleArrayToggle={handleArrayToggle}
                    errors={errors}
                  />
                </TabsContent>

                <TabsContent value="financial" className="space-y-6 mt-0">
                  <FinancialTab
                    formData={formData}
                    updateFormData={updateFormData}
                    handleArrayToggle={handleArrayToggle}
                    errors={errors}
                  />
                </TabsContent>

                <TabsContent value="staff" className="space-y-6 mt-0">
                  <StaffTab
                    formData={formData}
                    updateFormData={updateFormData}
                    handleArrayToggle={handleArrayToggle}
                    errors={errors}
                  />
                </TabsContent>

                <TabsContent value="settings" className="space-y-6 mt-0">
                  <SettingsTab
                    formData={formData}
                    updateFormData={updateFormData}
                    errors={errors}
                  />
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Alert className="max-w-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  You have unsaved changes
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!hasChanges || isSubmitting || loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Tab Components
const BasicInfoTab: React.FC<{
  formData: BranchEditFormData;
  updateFormData: (path: string, value: any) => void;
  errors: Record<string, string>;
  branch: Branch;
}> = ({ formData, updateFormData, errors, branch }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Branch Name</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="Enter branch name"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Branch Type</Label>
            <Select value={formData.type || branch.type} onValueChange={(value) => updateFormData('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main Branch</SelectItem>
                <SelectItem value="branch">Branch</SelectItem>
                <SelectItem value="franchise">Franchise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status || branch.status} onValueChange={(value) => updateFormData('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <Label className="text-muted-foreground">Branch Code</Label>
            <p className="font-mono">{branch.code}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Created</Label>
            <p>{new Date(branch.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

import { useSubcounties } from '@/hooks/useSubcounties';
import { useWards } from '@/hooks/useWards';

const LocationTab: React.FC<{
  formData: BranchEditFormData;
  updateFormData: (path: string, value: any) => void;
  errors: Record<string, string>;
}> = ({ formData, updateFormData, errors }) => {
  const { subcounties, loading: subcountiesLoading } = useSubcounties();
  const { wards, loading: wardsLoading } = useWards(formData.address?.subcounty);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={formData.address?.street || ''}
              onChange={(e) => updateFormData('address.street', e.target.value)}
              placeholder="Enter street address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.address?.city || ''}
                onChange={(e) => updateFormData('address.city', e.target.value)}
                placeholder="Enter city"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={formData.address?.state || ''}
                onChange={(e) => updateFormData('address.state', e.target.value)}
                placeholder="Enter state or province"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subcounty">Subcounty</Label>
              <Select
                value={formData.address?.subcounty || ''}
                onValueChange={(value) => {
                  updateFormData('address.subcounty', value);
                  updateFormData('wardId', undefined); // Reset ward when subcounty changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcounty" />
                </SelectTrigger>
                <SelectContent>
                  {subcountiesLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    subcounties.map((subcounty) => (
                      <SelectItem key={subcounty._id} value={subcounty._id}>
                        {subcounty.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ward">Ward</Label>
              <Select
                value={formData.wardId || ''}
                onValueChange={(value) => updateFormData('wardId', value)}
                disabled={!formData.address?.subcounty || wardsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ward" />
                </SelectTrigger>
                <SelectContent>
                  {wardsLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    wards.map((ward) => (
                      <SelectItem key={ward._id} value={ward._id}>
                        {ward.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={formData.address?.postalCode || ''}
                onChange={(e) => updateFormData('address.postalCode', e.target.value)}
                placeholder="Enter postal code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.address?.country || ''}
                onChange={(e) => updateFormData('address.country', e.target.value)}
                placeholder="Enter country"
              />
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
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.contact?.phone || ''}
                onChange={(e) => updateFormData('contact.phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.contact?.email || ''}
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
            <h4 className="font-medium">Manager Information</h4>
            
            <div className="space-y-2">
              <Label htmlFor="managerName">Manager Name</Label>
              <Input
                id="managerName"
                value={formData.contact?.managerName || ''}
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
                  value={formData.contact?.managerPhone || ''}
                  onChange={(e) => updateFormData('contact.managerPhone', e.target.value)}
                  placeholder="Enter manager phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerEmail">Manager Email</Label>
                <Input
                  id="managerEmail"
                  type="email"
                  value={formData.contact?.managerEmail || ''}
                  onChange={(e) => updateFormData('contact.managerEmail', e.target.value)}
                  placeholder="Enter manager email"
                  className={errors.managerEmail ? 'border-destructive' : ''}
                />
                {errors.managerEmail && (
                  <p className="text-sm text-destructive">{errors.managerEmail}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const OperationsTab: React.FC<{
  formData: BranchEditFormData;
  updateFormData: (path: string, value: any) => void;
  handleArrayToggle: (path: string, value: string) => void;
  errors: Record<string, string>;
}> = ({ formData, updateFormData, handleArrayToggle, errors }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Operating Hours</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="openTime">Opening Time</Label>
            <Input
              id="openTime"
              type="time"
              value={formData.operations?.openTime || ''}
              onChange={(e) => updateFormData('operations.openTime', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="closeTime">Closing Time</Label>
            <Input
              id="closeTime"
              type="time"
              value={formData.operations?.closeTime || ''}
              onChange={(e) => updateFormData('operations.closeTime', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select value={formData.operations?.timezone || ''} onValueChange={(value) => updateFormData('operations.timezone', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {timezones.map(tz => (
                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Operating Days</Label>
          <div className="grid grid-cols-2 gap-2">
            {weekDays.map(day => (
              <div key={day.id} className="flex items-center space-x-2">
                <Checkbox
                  id={day.id}
                  checked={formData.operations?.daysOpen?.includes(day.id) || false}
                  onCheckedChange={() => handleArrayToggle('operations.daysOpen', day.id)}
                />
                <Label htmlFor={day.id}>{day.label}</Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Capacity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="seatingCapacity">Seating Capacity</Label>
            <Input
              id="seatingCapacity"
              type="number"
              min="0"
              value={formData.operations?.seatingCapacity || ''}
              onChange={(e) => updateFormData('operations.seatingCapacity', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Enter seating capacity"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
            <Input
              id="deliveryRadius"
              type="number"
              min="0"
              step="0.1"
              value={formData.operations?.deliveryRadius || ''}
              onChange={(e) => updateFormData('operations.deliveryRadius', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Enter delivery radius"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const FinancialTab: React.FC<{
  formData: BranchEditFormData;
  updateFormData: (path: string, value: any) => void;
  handleArrayToggle: (path: string, value: string) => void;
  errors: Record<string, string>;
}> = ({ formData, updateFormData, handleArrayToggle, errors }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Currency & Taxes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={formData.financial?.currency || ''} onValueChange={(value) => updateFormData('financial.currency', value)}>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.financial?.taxRate || ''}
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
              <Label htmlFor="alcoholTaxRate">Alcohol Tax Rate (%)</Label>
              <Input
                id="alcoholTaxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.financial?.alcoholTaxRate ?? ''}
                onChange={(e) => updateFormData('financial.alcoholTaxRate', e.target.value === '' ? undefined : (parseFloat(e.target.value) || 0))}
                placeholder="Optional override for alcohol"
                className={errors.alcoholTaxRate ? 'border-destructive' : ''}
              />
              {errors.alcoholTaxRate && (
                <p className="text-sm text-destructive">{errors.alcoholTaxRate}</p>
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
              value={formData.financial?.serviceChargeRate || ''}
              onChange={(e) => updateFormData('financial.serviceChargeRate', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Enter service charge rate"
              className={errors.serviceChargeRate ? 'border-destructive' : ''}
            />
            {errors.serviceChargeRate && (
              <p className="text-sm text-destructive">{errors.serviceChargeRate}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="tipEnabled"
              checked={formData.financial?.tipEnabled || false}
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
                checked={formData.financial?.paymentMethods?.includes(method) || false}
                onCheckedChange={() => handleArrayToggle('financial.paymentMethods', method)}
              />
              <Label htmlFor={method} className="capitalize">
                {method.replace('_', ' ')}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const StaffTab: React.FC<{
  formData: BranchEditFormData;
  updateFormData: (path: string, value: any) => void;
  handleArrayToggle: (path: string, value: string) => void;
  errors: Record<string, string>;
}> = ({ formData, updateFormData, handleArrayToggle, errors }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Staffing Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="maxStaff">Maximum Staff</Label>
          <Input
            id="maxStaff"
            type="number"
            min="1"
            value={formData.staffing?.maxStaff || ''}
            onChange={(e) => updateFormData('staffing.maxStaff', parseInt(e.target.value) || 1)}
            placeholder="Enter maximum staff count"
            className={errors.maxStaff ? 'border-destructive' : ''}
          />
          {errors.maxStaff && (
            <p className="text-sm text-destructive">{errors.maxStaff}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Available Staff Roles</Label>
          <div className="grid grid-cols-2 gap-2">
            {staffRoles.map(role => (
              <div key={role} className="flex items-center space-x-2">
                <Checkbox
                  id={role}
                  checked={formData.staffing?.roles?.includes(role) || false}
                  onCheckedChange={() => handleArrayToggle('staffing.roles', role)}
                />
                <Label htmlFor={role} className="capitalize">
                  {role.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shiftPattern">Shift Pattern</Label>
          <Input
            id="shiftPattern"
            value={formData.staffing?.shiftPattern || ''}
            onChange={(e) => updateFormData('staffing.shiftPattern', e.target.value)}
            placeholder="e.g., 8-hour shifts, split shifts"
          />
          <p className="text-sm text-muted-foreground">
            Describe the standard shift pattern for this branch
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

const SettingsTab: React.FC<{
  formData: BranchEditFormData;
  updateFormData: (path: string, value: any) => void;
  errors: Record<string, string>;
}> = ({ formData, updateFormData, errors }) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="orderPrefix">Order Prefix</Label>
            <Input
              id="orderPrefix"
              value={formData.settings?.orderPrefix || ''}
              onChange={(e) => updateFormData('settings.orderPrefix', e.target.value)}
              placeholder="Enter order prefix"
              maxLength={5}
              className={errors.orderPrefix ? 'border-destructive' : ''}
            />
            {errors.orderPrefix && (
              <p className="text-sm text-destructive">{errors.orderPrefix}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={formData.settings?.theme || ''} onValueChange={(value) => updateFormData('settings.theme', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Default</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            type="url"
            value={formData.settings?.logoUrl || ''}
            onChange={(e) => updateFormData('settings.logoUrl', e.target.value)}
            placeholder="Enter logo URL"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="receiptHeader">Receipt Header</Label>
          <Textarea
            id="receiptHeader"
            value={formData.settings?.receiptHeader || ''}
            onChange={(e) => updateFormData('settings.receiptHeader', e.target.value)}
            placeholder="Enter receipt header text"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="receiptFooter">Receipt Footer</Label>
          <Textarea
            id="receiptFooter"
            value={formData.settings?.receiptFooter || ''}
            onChange={(e) => updateFormData('settings.receiptFooter', e.target.value)}
            placeholder="Enter receipt footer text"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="onlineOrdering"
            checked={formData.integrations?.onlineOrderingEnabled || false}
            onCheckedChange={(checked) => updateFormData('integrations.onlineOrderingEnabled', checked)}
          />
          <Label htmlFor="onlineOrdering">Enable Online Ordering</Label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="posSystemType">POS System Type</Label>
            <Select value={formData.integrations?.posSystemType || ''} onValueChange={(value) => updateFormData('integrations.posSystemType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select POS system" />
              </SelectTrigger>
              <SelectContent>
                {posSystemTypes.map(type => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="posSystemId">POS System ID</Label>
            <Input
              id="posSystemId"
              value={formData.integrations?.posSystemId || ''}
              onChange={(e) => updateFormData('integrations.posSystemId', e.target.value)}
              placeholder="Enter POS system ID"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="kitchenDisplayId">Kitchen Display System ID</Label>
          <Input
            id="kitchenDisplayId"
            value={formData.integrations?.kitchenDisplayId || ''}
            onChange={(e) => updateFormData('integrations.kitchenDisplayId', e.target.value)}
            placeholder="Enter kitchen display system ID"
          />
        </div>
      </CardContent>
    </Card>
  </div>
);

export default EditBranchModal;
