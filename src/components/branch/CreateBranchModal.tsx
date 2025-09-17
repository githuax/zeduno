import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, PlusCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BranchFormData, BranchType, BranchStatus, IBranch } from '@/types/branch.types';
import { useToast } from '@/components/ui/use-toast';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSubcounties } from '@/hooks/useSubcounties';
import { useWards } from '@/hooks/useWards';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check } from 'lucide-react';

interface CreateBranchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: BranchFormData) => Promise<void>;
  branches: IBranch[];
  loading?: boolean;
  onSuccess?: () => void;
}

const defaultFormData: BranchFormData = {
  name: '',
  code: '',
  type: 'branch',
  status: 'active',
  parentBranchId: '',
  address: {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    subcounty: '',
    ward: '',
    coordinates: { latitude: 0, longitude: 0 },
  },
  contact: {
    phone: '',
    email: '',
    managerName: '',
    managerPhone: '',
    managerEmail: '',
  },
  operations: {
    openTime: '09:00',
    closeTime: '22:00',
    timezone: 'Africa/Nairobi',
    daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    holidaySchedule: [],
    seatingCapacity: undefined,
    deliveryRadius: undefined,
  },
  financial: {
    currency: 'KES',
    taxRate: 0,
    serviceChargeRate: 0,
    tipEnabled: true,
    paymentMethods: ['cash'],
    bankAccount: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      routingNumber: '',
    },
  },
  inventory: {
    trackInventory: true,
    lowStockAlertEnabled: true,
    autoReorderEnabled: false,
    warehouseId: undefined,
  },
  menuConfig: {
    inheritFromParent: true,
    priceMultiplier: 1,
    customPricing: false,
    availableCategories: [],
  },
  staffing: {
    maxStaff: 50,
    currentStaff: 0,
    roles: ['manager', 'cashier', 'waiter', 'chef', 'delivery'],
    shiftPattern: '',
  },
  metrics: {
    avgOrderValue: 0,
    totalOrders: 0,
    totalRevenue: 0,
    rating: undefined,
    lastUpdated: new Date(),
  },
  integrations: {
    posSystemId: '',
    posSystemType: '',
    kitchenDisplayId: '',
    onlineOrderingEnabled: true,
  },
  settings: {
    orderPrefix: '',
    orderNumberSequence: 1,
    receiptHeader: '',
    receiptFooter: '',
    logoUrl: '',
    theme: '',
  },
  isActive: true,
  createdBy: '',
};

const daysOfWeek = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
];
const staffRoles = ['manager', 'assistant_manager', 'cashier', 'kitchen_staff', 'server', 'cleaner', 'security'];


export const CreateBranchModal = ({
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
  const { toast } = useToast();
  const { user } = useAuth();
  const { subcounties, isLoading: isLoadingSubcounties } = useSubcounties();
  const { wards, isLoading: isLoadingWards } = useWards(formData.address.subcounty);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        createdBy: user._id,
      }));
    }
  }, [user]);

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const keys = name.split('.');
      if (keys.length > 1) {
        let updated = { ...prev };
        let current: any = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return updated;
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSelectChange = (name: string, value: string | string[]) => {
    setFormData((prev) => {
      const keys = name.split('.');
      if (keys.length > 1) {
        let updated = { ...prev };
        let current: any = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return updated;
      }
      return { ...prev, [name]: value };
    });
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => {
      const keys = name.split('.');
      if (keys.length > 1) {
        let updated = { ...prev };
        let current: any = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = checked;
        return updated;
      }
      return { ...prev, [name]: checked };
    });
  };

  const handleMultiSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      const keys = name.split('.');
      if (keys.length > 1) {
        let updated = { ...prev };
        let current: any = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }
        const currentValues = current[keys[keys.length - 1]] || [];
        current[keys[keys.length - 1]] = currentValues.includes(value)
          ? currentValues.filter((item: string) => item !== value)
          : [...currentValues, value];
        return updated;
      }
      const currentValues = (prev as any)[name] || [];
      return {
        ...prev,
        [name]: currentValues.includes(value)
          ? currentValues.filter((item: string) => item !== value)
          : [...currentValues, value],
      };
    });
  };

  const validateStep = (step: number) => {
    let currentErrors: Record<string, string> = {};
    let isValid = true;

    if (step === 0) { // Basic Info
      if (!formData.name) {
        currentErrors.name = 'Branch name is required';
        isValid = false;
      }
      if (!formData.type) {
        currentErrors.type = 'Branch type is required';
        isValid = false;
      }
      if (!formData.status) {
        currentErrors.status = 'Branch status is required';
        isValid = false;
      }
      if (formData.type !== 'main' && !formData.parentBranchId) {
        currentErrors.parentBranchId = 'Parent branch is required for non-main branches';
        isValid = false;
      }
    } else if (step === 1) { // Address Info
      if (!formData.address.street) {
        currentErrors['address.street'] = 'Street is required';
        isValid = false;
      }
      if (!formData.address.city) {
        currentErrors['address.city'] = 'City is required';
        isValid = false;
      }
      if (!formData.address.state) {
        currentErrors['address.state'] = 'State is required';
        isValid = false;
      }
      if (!formData.address.postalCode) {
        currentErrors['address.postalCode'] = 'Postal Code is required';
        isValid = false;
      }
      if (!formData.address.country) {
        currentErrors['address.country'] = 'Country is required';
        isValid = false;
      }
      if (!formData.address.subcounty) {
        currentErrors['address.subcounty'] = 'Subcounty is required';
        isValid = false;
      }
      if (!formData.address.ward) {
        currentErrors['address.ward'] = 'Ward is required';
        isValid = false;
      }
    } else if (step === 2) { // Contact Info
      if (!formData.contact.phone) {
        currentErrors['contact.phone'] = 'Phone number is required';
        isValid = false;
      }
      if (!formData.contact.email) {
        currentErrors['contact.email'] = 'Email is required';
        isValid = false;
      } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.contact.email)) {
        currentErrors['contact.email'] = 'Invalid email format';
        isValid = false;
      }
    } else if (step === 3) { // Operations Info
      if (!formData.operations.openTime) {
        currentErrors['operations.openTime'] = 'Opening time is required';
        isValid = false;
      }
      if (!formData.operations.closeTime) {
        currentErrors['operations.closeTime'] = 'Closing time is required';
        isValid = false;
      }
      if (!formData.operations.timezone) {
        currentErrors['operations.timezone'] = 'Timezone is required';
        isValid = false;
      }
      if (formData.operations.daysOpen.length === 0) {
        currentErrors['operations.daysOpen'] = 'At least one day of operation is required';
        isValid = false;
      }
    } else if (step === 4) { // Financial Info
      if (!formData.financial.currency) {
        currentErrors['financial.currency'] = 'Currency is required';
        isValid = false;
      }
      if (formData.financial.taxRate === undefined || formData.financial.taxRate < 0) {
        currentErrors['financial.taxRate'] = 'Valid tax rate is required';
        isValid = false;
      }
      if (formData.financial.paymentMethods.length === 0) {
        currentErrors['financial.paymentMethods'] = 'At least one payment method is required';
        isValid = false;
      }
    } else if (step === 5) { // Inventory Config
      // No specific required fields for this step based on current schema
    } else if (step === 6) { // Menu Config
      // No specific required fields for this step based on current schema
    } else if (step === 7) { // Staffing Config
      if (formData.staffing.maxStaff === undefined || formData.staffing.maxStaff <= 0) {
        currentErrors['staffing.maxStaff'] = 'Max staff must be a positive number';
        isValid = false;
      }
      if (formData.staffing.roles.length === 0) {
        currentErrors['staffing.roles'] = 'At least one staff role is required';
        isValid = false;
      }
    } else if (step === 8) { // Integration Settings
      // No specific required fields for this step based on current schema
    } else if (step === 9) { // Branch Specific Settings
      if (!formData.settings.orderPrefix) {
        currentErrors['settings.orderPrefix'] = 'Order prefix is required';
        isValid = false;
      }
    }

    setErrors(currentErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields for the current step.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast({
        title: 'Branch Created',
        description: 'The new branch has been successfully created.',
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create branch.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = useMemo(() => {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Branch Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="col-span-3"
              />
              {errors.name && <p className="col-span-4 text-right text-red-500 text-sm">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">Branch Code</Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                className="col-span-3"
                placeholder="Auto-generated if left blank"
              />
              {errors.code && <p className="col-span-4 text-right text-red-500 text-sm">{errors.code}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Branch Type</Label>
              <Select
                name="type"
                value={formData.type}
                onValueChange={(value) => handleSelectChange('type', value as BranchType)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select branch type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main</SelectItem>
                  <SelectItem value="branch">Branch</SelectItem>
                  <SelectItem value="franchise">Franchise</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="col-span-4 text-right text-red-500 text-sm">{errors.type}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select
                name="status"
                value={formData.status}
                onValueChange={(value) => handleSelectChange('status', value as BranchStatus)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="col-span-4 text-right text-red-500 text-sm">{errors.status}</p>}
            </div>
            {formData.type !== 'main' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="parentBranchId" className="text-right">Parent Branch</Label>
                <Select
                  name="parentBranchId"
                  value={formData.parentBranchId || ''}
                  onValueChange={(value) => handleSelectChange('parentBranchId', value)}
                  disabled={!branches || branches.length === 0}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select parent branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch._id} value={branch._id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.parentBranchId && <p className="col-span-4 text-right text-red-500 text-sm">{errors.parentBranchId}</p>}
              </div>
            )}
          </div>
        );
      case 1:
        return (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address.street" className="text-right">Street</Label>
              <Input
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleFormChange}
                className="col-span-3"
              />
              {errors['address.street'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['address.street']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address.city" className="text-right">City</Label>
              <Input
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleFormChange}
                className="col-span-3"
              />
              {errors['address.city'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['address.city']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address.state" className="text-right">State</Label>
              <Input
                id="address.state"
                name="address.state"
                value={formData.address.state}
                onChange={handleFormChange}
                className="col-span-3"
              />
              {errors['address.state'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['address.state']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address.postalCode" className="text-right">Postal Code</Label>
              <Input
                id="address.postalCode"
                name="address.postalCode"
                value={formData.address.postalCode}
                onChange={handleFormChange}
                className="col-span-3"
              />
              {errors['address.postalCode'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['address.postalCode']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address.country" className="text-right">Country</Label>
              <Input
                id="address.country"
                name="address.country"
                value={formData.address.country}
                onChange={handleFormChange}
                className="col-span-3"
              />
              {errors['address.country'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['address.country']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address.subcounty" className="text-right">Subcounty</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "col-span-3 justify-between",
                      !formData.address.subcounty && "text-muted-foreground"
                    )}
                  >
                    {formData.address.subcounty
                      ? subcounties.find((s) => s._id === formData.address.subcounty)?.name
                      : "Select subcounty"}
                    <Check className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search subcounty..." />
                    <CommandEmpty>No subcounty found.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-[200px]">
                        {isLoadingSubcounties ? (
                          <CommandItem>Loading subcounties...</CommandItem>
                        ) : (
                          subcounties.map((s) => (
                            <CommandItem
                              key={s._id}
                              value={s.name}
                              onSelect={() => {
                                handleSelectChange('address.subcounty', s._id);
                                handleSelectChange('address.ward', ''); // Reset ward when subcounty changes
                              }}
                            >
                              {s.name}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  formData.address.subcounty === s._id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))
                        )}
                      </ScrollArea>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors['address.subcounty'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['address.subcounty']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address.ward" className="text-right">Ward</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "col-span-3 justify-between",
                      !formData.address.ward && "text-muted-foreground"
                    )}
                    disabled={!formData.address.subcounty || isLoadingWards}
                  >
                    {formData.address.ward
                      ? wards.find((w) => w._id === formData.address.ward)?.name
                      : "Select ward"}
                    <Check className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search ward..." />
                    <CommandEmpty>No ward found.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-[200px]">
                        {isLoadingWards ? (
                          <CommandItem>Loading wards...</CommandItem>
                        ) : (
                          wards.map((w) => (
                            <CommandItem
                              key={w._id}
                              value={w.name}
                              onSelect={() => {
                                handleSelectChange('address.ward', w._id);
                              }}
                            >
                              {w.name}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  formData.address.ward === w._id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))
                        )}
                      </ScrollArea>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors['address.ward'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['address.ward']}</p>}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact.phone" className="text-right">Phone</Label>
              <Input
                id="contact.phone"
                name="contact.phone"
                value={formData.contact.phone}
                onChange={handleFormChange}
                className="col-span-3"
              />
              {errors['contact.phone'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['contact.phone']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact.email" className="text-right">Email</Label>
              <Input
                id="contact.email"
                name="contact.email"
                value={formData.contact.email}
                onChange={handleFormChange}
                className="col-span-3"
              />
              {errors['contact.email'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['contact.email']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact.managerName" className="text-right">Manager Name</Label>
              <Input
                id="contact.managerName"
                name="contact.managerName"
                value={formData.contact.managerName || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact.managerPhone" className="text-right">Manager Phone</Label>
              <Input
                id="contact.managerPhone"
                name="contact.managerPhone"
                value={formData.contact.managerPhone || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact.managerEmail" className="text-right">Manager Email</Label>
              <Input
                id="contact.managerEmail"
                name="contact.managerEmail"
                value={formData.contact.managerEmail || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="operations.openTime" className="text-right">Opening Time</Label>
              <Input
                id="operations.openTime"
                name="operations.openTime"
                type="time"
                value={formData.operations.openTime}
                onChange={handleFormChange}
                className="col-span-3"
              />
              {errors['operations.openTime'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['operations.openTime']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="operations.closeTime" className="text-right">Closing Time</Label>
              <Input
                id="operations.closeTime"
                name="operations.closeTime"
                type="time"
                value={formData.operations.closeTime}
                onChange={handleFormChange}
                className="col-span-3"
              />
              {errors['operations.closeTime'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['operations.closeTime']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="operations.timezone" className="text-right">Timezone</Label>
              <Select
                name="operations.timezone"
                value={formData.operations.timezone}
                onValueChange={(value) => handleSelectChange('operations.timezone', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  {/* Add more timezones as needed */}
                </SelectContent>
              </Select>
              {errors['operations.timezone'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['operations.timezone']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Days Open</Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.id}`}
                      checked={formData.operations.daysOpen.includes(day.label)}
                      onCheckedChange={(checked) => {
                        handleMultiSelectChange('operations.daysOpen', day.label);
                      }}
                    />
                    <Label htmlFor={`day-${day.id}`}>{day.label}</Label>
                  </div>
                ))}
              </div>
              {errors['operations.daysOpen'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['operations.daysOpen']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="operations.seatingCapacity" className="text-right">Seating Capacity</Label>
              <Input
                id="operations.seatingCapacity"
                name="operations.seatingCapacity"
                type="number"
                value={formData.operations.seatingCapacity || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="operations.deliveryRadius" className="text-right">Delivery Radius (km)</Label>
              <Input
                id="operations.deliveryRadius"
                name="operations.deliveryRadius"
                type="number"
                value={formData.operations.deliveryRadius || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="financial.currency" className="text-right">Currency</Label>
              <Select
                name="financial.currency"
                value={formData.financial.currency}
                onValueChange={(value) => handleSelectChange('financial.currency', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KES">KES</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  {/* Add more currencies as needed */}
                </SelectContent>
              </Select>
              {errors['financial.currency'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['financial.currency']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="financial.taxRate" className="text-right">Tax Rate (%)</Label>
              <Input
                id="financial.taxRate"
                name="financial.taxRate"
                type="number"
                step="0.01"
                value={formData.financial.taxRate}
                onChange={handleFormChange}
                className="col-span-3"
              />
              {errors['financial.taxRate'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['financial.taxRate']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="financial.serviceChargeRate" className="text-right">Service Charge Rate (%)</Label>
              <Input
                id="financial.serviceChargeRate"
                name="financial.serviceChargeRate"
                type="number"
                step="0.01"
                value={formData.financial.serviceChargeRate || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="financial.tipEnabled" className="text-right">Tip Enabled</Label>
              <Checkbox
                id="financial.tipEnabled"
                name="financial.tipEnabled"
                checked={formData.financial.tipEnabled}
                onCheckedChange={(checked) => handleCheckboxChange('financial.tipEnabled', checked as boolean)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Payment Methods</Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {[ 'cash', 'card', 'mpesa', 'bank_transfer'].map((method) => (
                  <div key={method} className="flex items-center space-x-2">
                    <Checkbox
                      id={`payment-method-${method}`}
                      checked={formData.financial.paymentMethods.includes(method)}
                      onCheckedChange={(checked) => {
                        handleMultiSelectChange('financial.paymentMethods', method);
                      }}
                    />
                    <Label htmlFor={`payment-method-${method}`}>{method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                  </div>
                ))}
              </div>
              {errors['financial.paymentMethods'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['financial.paymentMethods']}</p>}
            </div>
            {formData.financial.paymentMethods.includes('bank_transfer') && (
              <div className="grid gap-4 grid-cols-4 items-center">
                <Label htmlFor="financial.bankAccount.accountName" className="text-right">Account Name</Label>
                <Input
                  id="financial.bankAccount.accountName"
                  name="financial.bankAccount.accountName"
                  value={formData.financial.bankAccount?.accountName || ''}
                  onChange={handleFormChange}
                  className="col-span-3"
                />
                <Label htmlFor="financial.bankAccount.accountNumber" className="text-right">Account Number</Label>
                <Input
                  id="financial.bankAccount.accountNumber"
                  name="financial.bankAccount.accountNumber"
                  value={formData.financial.bankAccount?.accountNumber || ''}
                  onChange={handleFormChange}
                  className="col-span-3"
                />
                <Label htmlFor="financial.bankAccount.bankName" className="text-right">Bank Name</Label>
                <Input
                  id="financial.bankAccount.bankName"
                  name="financial.bankAccount.bankName"
                  value={formData.financial.bankAccount?.bankName || ''}
                  onChange={handleFormChange}
                  className="col-span-3"
                />
                <Label htmlFor="financial.bankAccount.routingNumber" className="text-right">Routing Number</Label>
                <Input
                  id="financial.bankAccount.routingNumber"
                  name="financial.bankAccount.routingNumber"
                  value={formData.financial.bankAccount?.routingNumber || ''}
                  onChange={handleFormChange}
                  className="col-span-3"
                />
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="inventory.trackInventory" className="text-right">Track Inventory</Label>
              <Checkbox
                id="inventory.trackInventory"
                name="inventory.trackInventory"
                checked={formData.inventory.trackInventory}
                onCheckedChange={(checked) => handleCheckboxChange('inventory.trackInventory', checked as boolean)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="inventory.lowStockAlertEnabled" className="text-right">Low Stock Alert Enabled</Label>
              <Checkbox
                id="inventory.lowStockAlertEnabled"
                name="inventory.lowStockAlertEnabled"
                checked={formData.inventory.lowStockAlertEnabled}
                onCheckedChange={(checked) => handleCheckboxChange('inventory.lowStockAlertEnabled', checked as boolean)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="inventory.autoReorderEnabled" className="text-right">Auto Reorder Enabled</Label>
              <Checkbox
                id="inventory.autoReorderEnabled"
                name="inventory.autoReorderEnabled"
                checked={formData.inventory.autoReorderEnabled}
                onCheckedChange={(checked) => handleCheckboxChange('inventory.autoReorderEnabled', checked as boolean)}
                className="col-span-3"
              />
            </div>
            {/* Add warehouseId selection if applicable */}
          </div>
        );
      case 6:
        return (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="menuConfig.inheritFromParent" className="text-right">Inherit Menu from Parent</Label>
              <Checkbox
                id="menuConfig.inheritFromParent"
                name="menuConfig.inheritFromParent"
                checked={formData.menuConfig.inheritFromParent}
                onCheckedChange={(checked) => handleCheckboxChange('menuConfig.inheritFromParent', checked as boolean)}
                className="col-span-3"
              />
            </div>
            {!formData.menuConfig.inheritFromParent && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="menuConfig.priceMultiplier" className="text-right">Price Multiplier</Label>
                <Input
                  id="menuConfig.priceMultiplier"
                  name="menuConfig.priceMultiplier"
                  type="number"
                  step="0.01"
                  value={formData.menuConfig.priceMultiplier}
                  onChange={handleFormChange}
                  className="col-span-3"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="menuConfig.customPricing" className="text-right">Custom Pricing Enabled</Label>
              <Checkbox
                id="menuConfig.customPricing"
                name="menuConfig.customPricing"
                checked={formData.menuConfig.customPricing}
                onCheckedChange={(checked) => handleCheckboxChange('menuConfig.customPricing', checked as boolean)}
                className="col-span-3"
              />
            </div>
            {/* Add availableCategories selection if applicable */}
          </div>
        );
      case 7:
        return (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="staffing.maxStaff" className="text-right">Max Staff</Label>
              <Input
                id="staffing.maxStaff"
                name="staffing.maxStaff"
                type="number"
                value={formData.staffing.maxStaff}
                onChange={handleFormChange}
                className="col-span-3"
              />
              {errors['staffing.maxStaff'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['staffing.maxStaff']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Staff Roles</Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {staffRoles.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={formData.staffing.roles.includes(role)}
                      onCheckedChange={(checked) => {
                        handleMultiSelectChange('staffing.roles', role);
                      }}
                    />
                    <Label htmlFor={`role-${role}`}>{role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                  </div>
                ))}
              </div>
              {errors['staffing.roles'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['staffing.roles']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="staffing.shiftPattern" className="text-right">Shift Pattern</Label>
              <Input
                id="staffing.shiftPattern"
                name="staffing.shiftPattern"
                value={formData.staffing.shiftPattern || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
          </div>
        );
      case 8:
        return (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="integrations.posSystemId" className="text-right">POS System ID</Label>
              <Input
                id="integrations.posSystemId"
                name="integrations.posSystemId"
                value={formData.integrations.posSystemId || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="integrations.posSystemType" className="text-right">POS System Type</Label>
              <Input
                id="integrations.posSystemType"
                name="integrations.posSystemType"
                value={formData.integrations.posSystemType || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="integrations.kitchenDisplayId" className="text-right">Kitchen Display ID</Label>
              <Input
                id="integrations.kitchenDisplayId"
                name="integrations.kitchenDisplayId"
                value={formData.integrations.kitchenDisplayId || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="integrations.onlineOrderingEnabled" className="text-right">Online Ordering Enabled</Label>
              <Checkbox
                id="integrations.onlineOrderingEnabled"
                name="integrations.onlineOrderingEnabled"
                checked={formData.integrations.onlineOrderingEnabled}
                onCheckedChange={(checked) => handleCheckboxChange('integrations.onlineOrderingEnabled', checked as boolean)}
                className="col-span-3"
              />
            </div>
          </div>
        );
      case 9:
        return (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="settings.orderPrefix" className="text-right">Order Prefix</Label>
              <Input
                id="settings.orderPrefix"
                name="settings.orderPrefix"
                value={formData.settings.orderPrefix}
                onChange={handleFormChange}
                className="col-span-3"
              />
              {errors['settings.orderPrefix'] && <p className="col-span-4 text-right text-red-500 text-sm">{errors['settings.orderPrefix']}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="settings.receiptHeader" className="text-right">Receipt Header</Label>
              <Input
                id="settings.receiptHeader"
                name="settings.receiptHeader"
                value={formData.settings.receiptHeader || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="settings.receiptFooter" className="text-right">Receipt Footer</Label>
              <Input
                id="settings.receiptFooter"
                name="settings.receiptFooter"
                value={formData.settings.receiptFooter || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="settings.logoUrl" className="text-right">Logo URL</Label>
              <Input
                id="settings.logoUrl"
                name="settings.logoUrl"
                value={formData.settings.logoUrl || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="settings.theme" className="text-right">Theme</Label>
              <Input
                id="settings.theme"
                name="settings.theme"
                value={formData.settings.theme || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  }, [currentStep, formData, errors, branches, subcounties, wards, isLoadingSubcounties, isLoadingWards, handleFormChange, handleSelectChange, handleMultiSelectChange, handleCheckboxChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Create New Branch</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new branch. You will proceed through several steps.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[70vh] px-6">
          {renderStep}
        </ScrollArea>
        <div className="flex justify-between p-6 border-t">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          <div className="flex-grow" />
          {currentStep < 9 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button type="submit" onClick={handleSubmit} disabled={isSubmitting || loading}>
              {isSubmitting || loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                'Create Branch'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateBranchModal;