import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useSubscriptionPlans, useCreateTenant } from "@/hooks/useTenant";
import { SubscriptionPlan, Tenant } from "@/types/tenant.types";
import AddressMapWorking from "@/components/AddressMapWorking";
import { 
  ArrowRight,
  ArrowLeft,
  Check,
  Store,
  CreditCard,
  Users,
  Settings,
  MapPin,
  Phone,
  Mail,
  Globe,
  Crown,
  Zap,
  Shield,
  Star
} from "lucide-react";

interface OnboardingData {
  // Business Information
  businessName: string;
  businessType: 'restaurant' | 'cafe' | 'bar' | 'fast-food' | 'bakery' | 'food-truck' | 'catering' | 'other';
  description: string;
  cuisineTypes: string[];
  
  // Contact Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Location
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  fullAddress: string;
  coordinates?: { lat: number; lng: number };
  
  // Business Details
  expectedOrders: 'less-than-100' | '100-500' | '500-2000' | '2000-plus';
  tableCount: number;
  staffCount: number;
  hasMultipleLocations: boolean;
  
  // Plan Selection
  selectedPlan: string;
  billingCycle: 'monthly' | 'yearly';
  
  // Subdomain
  subdomain: string;
}

const TenantOnboarding = () => {
  const navigate = useNavigate();
  const { data: plans } = useSubscriptionPlans();
  const createTenant = useCreateTenant();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    businessName: '',
    businessType: 'restaurant',
    description: '',
    cuisineTypes: [],
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: 'United States',
    zipCode: '',
    fullAddress: '',
    coordinates: undefined,
    expectedOrders: '100-500',
    tableCount: 10,
    staffCount: 5,
    hasMultipleLocations: false,
    selectedPlan: 'professional',
    billingCycle: 'monthly',
    subdomain: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subdomainChecked, setSubdomainChecked] = useState(false);
  const [formError, setFormError] = useState<string>('');

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const cuisineOptions = [
    'American', 'Italian', 'Chinese', 'Japanese', 'Mexican', 'Indian', 'French', 'Thai', 
    'Mediterranean', 'Spanish', 'Korean', 'Vietnamese', 'Greek', 'Turkish', 'Lebanese', 'Other'
  ];

  const businessTypes = [
    { value: 'restaurant', label: 'Full Service Restaurant', icon: Store },
    { value: 'fast-food', label: 'Fast Food / Quick Service', icon: Zap },
    { value: 'cafe', label: 'Cafe / Coffee Shop', icon: Store },
    { value: 'bar', label: 'Bar / Pub', icon: Store },
    { value: 'bakery', label: 'Bakery / Pastry Shop', icon: Store },
    { value: 'food-truck', label: 'Food Truck', icon: Store },
    { value: 'catering', label: 'Catering Service', icon: Store },
    { value: 'other', label: 'Other', icon: Store }
  ];

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const addCuisine = (cuisine: string) => {
    if (cuisine && !data.cuisineTypes.includes(cuisine)) {
      updateData({ cuisineTypes: [...data.cuisineTypes, cuisine] });
    }
  };

  const removeCuisine = (cuisine: string) => {
    updateData({ cuisineTypes: data.cuisineTypes.filter(c => c !== cuisine) });
  };

  const generateSubdomain = (businessName: string) => {
    return businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
  };

  const validateSubdomain = (subdomain: string) => {
    // Check basic subdomain requirements
    if (!subdomain || subdomain.length < 3 || subdomain.length > 30) {
      return false;
    }
    // Must start with letter or number
    if (!/^[a-z0-9]/.test(subdomain.toLowerCase())) {
      return false;
    }
    // Only letters, numbers, and hyphens
    if (!/^[a-z0-9-]+$/i.test(subdomain)) {
      return false;
    }
    return true;
  };

  const checkSubdomain = async (subdomain: string) => {
    // First validate format
    if (!validateSubdomain(subdomain)) {
      return false;
    }
    
    // Mock subdomain availability check
    await new Promise(resolve => setTimeout(resolve, 500));
    const unavailable = ['test', 'admin', 'api', 'www', 'app', 'demo', 'support', 'help', 'blog'];
    return !unavailable.includes(subdomain.toLowerCase());
  };

  const handleSubdomainCheck = async () => {
    if (!data.subdomain) return;
    
    setSubdomainChecked(false);
    const isAvailable = await checkSubdomain(data.subdomain);
    setSubdomainChecked(isAvailable);
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return !!(data.businessName && data.businessType && data.firstName && data.lastName && data.email);
      case 2:
        return !!(data.fullAddress && data.coordinates) || !!(data.street && data.city && data.state);
      case 3:
        return true; // Business details are optional
      case 4:
        return !!data.selectedPlan;
      case 5:
        return !!(data.subdomain && validateSubdomain(data.subdomain) && subdomainChecked);
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      
      // Auto-generate and check subdomain when moving to final step
      if (currentStep === 4 && !data.subdomain) {
        const generatedSubdomain = generateSubdomain(data.businessName);
        updateData({ subdomain: generatedSubdomain });
        
        // Auto-check the generated subdomain
        setTimeout(async () => {
          const isAvailable = await checkSubdomain(generatedSubdomain);
          setSubdomainChecked(isAvailable);
        }, 100);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setFormError('');
    
    try {
      // Validate all required fields before submission
      if (!data.businessName || !data.firstName || !data.lastName || !data.email) {
        throw new Error('Please fill in all required fields');
      }
      
      if (!data.selectedPlan) {
        throw new Error('Please select a subscription plan');
      }
      
      if (!data.subdomain || !subdomainChecked) {
        throw new Error('Please choose and verify an available subdomain');
      }
      
      const selectedPlan = plans?.find(p => p.name === data.selectedPlan);
      
      if (!selectedPlan) {
        throw new Error('Invalid subscription plan selected');
      }
      
      const tenantData: Partial<Tenant> = {
        name: data.businessName,
        slug: data.subdomain,
        status: 'trial',
        plan: selectedPlan!,
        settings: {
          timezone: 'America/New_York',
          currency: 'KES',
          language: 'en',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          defaultTaxRate: 8.5,
          serviceChargeRate: 0,
          allowGuestCheckout: true,
          requireEmailVerification: true,
          enableNotifications: true,
          maintenanceMode: false
        },
        contact: {
          email: data.email,
          phone: data.phone || '',
          firstName: data.firstName,
          lastName: data.lastName,
          company: data.businessName,
          address: {
            street: data.street || data.fullAddress || '',
            city: data.city || '',
            state: data.state || '',
            country: data.country || 'United States',
            zipCode: data.zipCode || ''
          }
        },
        billing: {
          billingEmail: data.email,
          invoiceHistory: []
        },
        limits: {
          currentUsers: 1,
          currentTables: 0,
          currentOrders: 0,
          currentMenuItems: 0,
          storageUsedGB: 0
        },
        features: selectedPlan?.limits.advancedAnalytics ? {
          multiLocation: data.hasMultipleLocations,
          customDomain: false,
          whiteLabel: false,
          apiAccess: selectedPlan.limits.apiAccess,
          customIntegrations: true,
          advancedReporting: selectedPlan.limits.advancedAnalytics,
          prioritySupport: selectedPlan.limits.supportLevel === 'priority',
          sso: false,
          auditLogs: true,
          dataExport: true
        } : {
          multiLocation: false,
          customDomain: false,
          whiteLabel: false,
          apiAccess: false,
          customIntegrations: false,
          advancedReporting: false,
          prioritySupport: false,
          sso: false,
          auditLogs: false,
          dataExport: false
        },
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
      };

      await createTenant.mutateAsync(tenantData);
      
      // Redirect to success page or dashboard instead of external subdomain
      navigate('/dashboard?tenant=new&setup=complete');
      
    } catch (error) {
      console.error('Failed to create tenant:', error);
      setFormError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tell us about your business</h2>
              <p className="text-muted-foreground">Let's start with the basics about your restaurant.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business-name">Business Name *</Label>
                <Input
                  id="business-name"
                  value={data.businessName}
                  onChange={(e) => updateData({ businessName: e.target.value })}
                  placeholder="Joe's Pizza Palace"
                />
              </div>

              <div className="space-y-2">
                <Label>Business Type *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {businessTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div
                        key={type.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          data.businessType === type.value 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => updateData({ businessType: type.value as any })}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{type.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => updateData({ description: e.target.value })}
                  placeholder="Describe your restaurant, specialties, and what makes it unique..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name *</Label>
                  <Input
                    id="first-name"
                    value={data.firstName}
                    onChange={(e) => updateData({ firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name *</Label>
                  <Input
                    id="last-name"
                    value={data.lastName}
                    onChange={(e) => updateData({ lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      value={data.email}
                      onChange={(e) => updateData({ email: e.target.value })}
                      className="pl-10"
                      placeholder="john@restaurant.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="phone"
                      value={data.phone}
                      onChange={(e) => updateData({ phone: e.target.value })}
                      className="pl-10"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Cuisine Types</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {data.cuisineTypes.map((cuisine) => (
                    <Badge 
                      key={cuisine} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => removeCuisine(cuisine)}
                    >
                      {cuisine} ×
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={addCuisine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add cuisine type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisineOptions
                      .filter(cuisine => !data.cuisineTypes.includes(cuisine))
                      .map((cuisine) => (
                        <SelectItem key={cuisine} value={cuisine}>
                          {cuisine}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Where is your restaurant located?</h2>
              <p className="text-muted-foreground">Search for your address or click on the map to set your location.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Restaurant Location *</Label>
                <AddressMapWorking
                  value={data.fullAddress}
                  onChange={(address, coords) => {
                    updateData({ 
                      fullAddress: address,
                      coordinates: coords
                    });
                    // Try to parse the address components
                    const parts = address.split(',').map(s => s.trim());
                    if (parts.length >= 3) {
                      // Basic parsing - can be improved based on geocoding API response
                      updateData({
                        street: parts[0] || '',
                        city: parts[parts.length - 3] || '',
                        state: parts[parts.length - 2] || '',
                        country: parts[parts.length - 1] || ''
                      });
                    }
                  }}
                  placeholder="Search for your restaurant address..."
                />
              </div>

              <Separator className="my-4" />
              
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Or enter address manually:</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="street"
                      value={data.street}
                      onChange={(e) => updateData({ street: e.target.value })}
                      className="pl-10"
                      placeholder="123 Main Street"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={data.city}
                      onChange={(e) => updateData({ city: e.target.value })}
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={data.state}
                      onChange={(e) => updateData({ state: e.target.value })}
                      placeholder="NY"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select 
                      value={data.country} 
                      onValueChange={(value) => updateData({ country: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        <SelectItem value="Australia">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip-code">ZIP/Postal Code</Label>
                    <Input
                      id="zip-code"
                      value={data.zipCode}
                      onChange={(e) => updateData({ zipCode: e.target.value })}
                      placeholder="10001"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tell us about your operations</h2>
              <p className="text-muted-foreground">This helps us recommend the right plan and features for you.</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Expected monthly orders</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'less-than-100', label: 'Less than 100' },
                    { value: '100-500', label: '100 - 500' },
                    { value: '500-2000', label: '500 - 2,000' },
                    { value: '2000-plus', label: '2,000+' }
                  ].map((option) => (
                    <div
                      key={option.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        data.expectedOrders === option.value 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => updateData({ expectedOrders: option.value as any })}
                    >
                      <span className="font-medium">{option.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="table-count">Number of Tables</Label>
                  <Input
                    id="table-count"
                    type="number"
                    value={data.tableCount}
                    onChange={(e) => updateData({ tableCount: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-count">Number of Staff Members</Label>
                  <Input
                    id="staff-count"
                    type="number"
                    value={data.staffCount}
                    onChange={(e) => updateData({ staffCount: parseInt(e.target.value) || 0 })}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Multiple Locations</h3>
                  <p className="text-sm text-muted-foreground">Do you have or plan to have multiple restaurant locations?</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={!data.hasMultipleLocations ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateData({ hasMultipleLocations: false })}
                  >
                    Single Location
                  </Button>
                  <Button
                    variant={data.hasMultipleLocations ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateData({ hasMultipleLocations: true })}
                  >
                    Multiple Locations
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose your plan</h2>
              <p className="text-muted-foreground">Select the plan that best fits your restaurant's needs.</p>
            </div>
            
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-4">
                <span className={data.billingCycle === 'monthly' ? 'font-medium' : 'text-muted-foreground'}>Monthly</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateData({ billingCycle: data.billingCycle === 'monthly' ? 'yearly' : 'monthly' })}
                  className="relative"
                >
                  {data.billingCycle === 'yearly' && (
                    <div className="absolute -top-2 -right-2">
                      <Badge variant="default" className="text-xs">Save 20%</Badge>
                    </div>
                  )}
                  Toggle
                </Button>
                <span className={data.billingCycle === 'yearly' ? 'font-medium' : 'text-muted-foreground'}>Yearly</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans?.map((plan) => {
                const isSelected = data.selectedPlan === plan.name;
                const price = data.billingCycle === 'yearly' 
                  ? plan.price * 10 // 20% discount for yearly
                  : plan.price;
                
                return (
                  <div
                    key={plan.id}
                    className={`relative p-6 border rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                      isSelected 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => updateData({ selectedPlan: plan.name })}
                  >
                    {plan.name === 'professional' && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge variant="default" className="bg-primary">
                          <Crown className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold mb-2">{plan.displayName}</h3>
                      <div className="text-3xl font-bold">
                        ${price}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{data.billingCycle === 'yearly' ? 'year' : 'month'}
                        </span>
                      </div>
                      {data.billingCycle === 'yearly' && (
                        <div className="text-sm text-green-600 font-medium">
                          Save ${plan.price * 12 - price}/year
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm">Up to {plan.limits.maxUsers} users</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-primary" />
                        <span className="text-sm">Up to {plan.limits.maxTables} tables</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-primary" />
                        <span className="text-sm">{plan.limits.maxOrders.toLocaleString()} orders/month</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-sm">{plan.limits.supportLevel} support</span>
                      </div>
                      
                      {plan.limits.advancedAnalytics && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-primary" />
                          <span className="text-sm">Advanced analytics</span>
                        </div>
                      )}
                      
                      {plan.limits.apiAccess && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          <span className="text-sm">API access</span>
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Choose your subdomain</h2>
              <p className="text-muted-foreground">Your restaurant will be accessible at this URL.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex">
                  <Input
                    id="subdomain"
                    value={data.subdomain}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      updateData({ subdomain: value });
                      setSubdomainChecked(false);
                    }}
                    className="rounded-r-none"
                    placeholder="your-restaurant"
                  />
                  <div className="flex items-center px-3 border border-l-0 rounded-r-md bg-muted">
                    .zeduno.com
                  </div>
                </div>
                {data.subdomain && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSubdomainCheck}
                    >
                      Check Availability
                    </Button>
                    {subdomainChecked && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Check className="h-4 w-4" />
                        <span className="text-sm">Available</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {data.subdomain && subdomainChecked && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-green-800">
                      <Check className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Great! Your restaurant will be available at:</p>
                        <p className="text-lg font-bold">https://{data.subdomain}.zeduno.com</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Separator />

            <div className="bg-muted p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-medium">{plans?.find(p => p.name === data.selectedPlan)?.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Billing:</span>
                  <span className="font-medium">{data.billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trial Period:</span>
                  <span className="font-medium text-green-600">14 days free</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>
                    ${data.billingCycle === 'yearly' 
                      ? (plans?.find(p => p.name === data.selectedPlan)?.price || 0) * 10
                      : plans?.find(p => p.name === data.selectedPlan)?.price || 0
                    }
                    /{data.billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome to ZedUno</h1>
          <p className="text-xl text-muted-foreground">Let's get your restaurant set up in just a few steps</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form */}
        <Card>
          <CardContent className="p-8">
            {renderStep()}

            {/* Error Display */}
            {formError && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{formError}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNextStep()}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceedToNextStep() || isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? 'Creating...' : 'Create Restaurant'}
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenantOnboarding;