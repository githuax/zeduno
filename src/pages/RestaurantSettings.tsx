import { 
  ArrowLeft,
  Store,
  Clock,
  Palette,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Save,
  Upload,
  Loader2
} from "lucide-react";
import { useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";

import Header from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useRestaurantSettings, useUpdateRestaurantSettings } from "@/hooks/useSettings";
import { BusinessHours } from "@/types/settings.types";

const RestaurantSettings = () => {
  const navigate = useNavigate();
  const { data: settings, isLoading } = useRestaurantSettings();
  const updateSettings = useUpdateRestaurantSettings();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    contact: {
      phone: '',
      email: '',
      website: '',
      socialMedia: {
        facebook: '',
        instagram: '',
        twitter: ''
      }
    },
    businessHours: [] as BusinessHours[],
    cuisine: [] as string[],
    capacity: {
      totalTables: 0,
      totalSeats: 0,
      deliveryRadius: 0
    },
    branding: {
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      accentColor: '#10b981',
      fontFamily: 'Inter',
      theme: 'light' as 'light' | 'dark' | 'auto'
    },
    logo: '',
    tagline: '',
    displayName: '',
    operatingMode: 'all' as 'dine-in' | 'takeaway' | 'delivery' | 'all'
  });

  // Initialize form data when settings load
  if (settings && !formData.name) {
    setFormData({
      name: settings.name,
      address: settings.address,
      contact: settings.contact,
      businessHours: settings.businessHours,
      cuisine: settings.cuisine,
      capacity: settings.capacity,
      branding: settings.branding,
      logo: settings.logo || '',
      tagline: settings.tagline || '',
      displayName: settings.displayName || '',
      operatingMode: settings.operatingMode
    });
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setFormData({
          ...formData,
          logo: result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setFormData({
      ...formData,
      logo: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      toast({
        title: "Success",
        description: "Restaurant settings updated successfully!",
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateBusinessHours = (dayIndex: number, field: keyof BusinessHours, value: any) => {
    const newHours = [...formData.businessHours];
    newHours[dayIndex] = { ...newHours[dayIndex], [field]: value };
    setFormData({ ...formData, businessHours: newHours });
  };

  const addCuisine = (cuisine: string) => {
    if (cuisine && !formData.cuisine.includes(cuisine)) {
      setFormData({
        ...formData,
        cuisine: [...formData.cuisine, cuisine]
      });
    }
  };

  const removeCuisine = (cuisine: string) => {
    setFormData({
      ...formData,
      cuisine: formData.cuisine.filter(c => c !== cuisine)
    });
  };

  const cuisineOptions = [
    'American', 'Italian', 'Chinese', 'Japanese', 'Mexican', 'Indian', 'French', 'Thai', 
    'Mediterranean', 'Spanish', 'Korean', 'Vietnamese', 'Greek', 'Turkish', 'Lebanese'
  ];

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/settings")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-foreground">Restaurant Settings</h1>
            <p className="text-muted-foreground">
              Configure your restaurant information and preferences
            </p>
          </div>

          <Button 
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="ml-auto flex items-center gap-2"
          >
            {updateSettings.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="hours">Business Hours</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Restaurant Information
                </CardTitle>
                <CardDescription>Basic information about your restaurant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="restaurant-name">Restaurant Name</Label>
                  <Input
                    id="restaurant-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter restaurant name"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="phone"
                          value={formData.contact.phone}
                          onChange={(e) => setFormData({
                            ...formData,
                            contact: { ...formData.contact, phone: e.target.value }
                          })}
                          className="pl-10"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.contact.email}
                          onChange={(e) => setFormData({
                            ...formData,
                            contact: { ...formData.contact, email: e.target.value }
                          })}
                          className="pl-10"
                          placeholder="info@restaurant.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="website"
                        value={formData.contact.website || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          contact: { ...formData.contact, website: e.target.value }
                        })}
                        className="pl-10"
                        placeholder="https://restaurant.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Social Media</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                          id="facebook"
                          value={formData.contact.socialMedia?.facebook || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            contact: {
                              ...formData.contact,
                              socialMedia: {
                                ...formData.contact.socialMedia,
                                facebook: e.target.value
                              }
                            }
                          })}
                          placeholder="Facebook page URL"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={formData.contact.socialMedia?.instagram || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            contact: {
                              ...formData.contact,
                              socialMedia: {
                                ...formData.contact.socialMedia,
                                instagram: e.target.value
                              }
                            }
                          })}
                          placeholder="Instagram profile URL"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter</Label>
                        <Input
                          id="twitter"
                          value={formData.contact.socialMedia?.twitter || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            contact: {
                              ...formData.contact,
                              socialMedia: {
                                ...formData.contact.socialMedia,
                                twitter: e.target.value
                              }
                            }
                          })}
                          placeholder="Twitter profile URL"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Cuisine Types</h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.cuisine.map((cuisine) => (
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
                        .filter(cuisine => !formData.cuisine.includes(cuisine))
                        .map((cuisine) => (
                          <SelectItem key={cuisine} value={cuisine}>
                            {cuisine}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address & Location
                </CardTitle>
                <CardDescription>Restaurant address and location details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.address.street}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value }
                    })}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value }
                      })}
                      placeholder="New York"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.address.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value }
                      })}
                      placeholder="NY"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select 
                      value={formData.address.country} 
                      onValueChange={(value) => setFormData({
                        ...formData,
                        address: { ...formData.address, country: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
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
                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.address.zipCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, zipCode: e.target.value }
                      })}
                      placeholder="10001"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Business Hours
                </CardTitle>
                <CardDescription>Set your restaurant's operating hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {days.map((day, index) => {
                  const dayHours = formData.businessHours.find(h => h.dayOfWeek === day.key) || {
                    dayOfWeek: day.key as any,
                    isOpen: false,
                    openTime: '09:00',
                    closeTime: '22:00'
                  };
                  
                  return (
                    <div key={day.key} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-24">
                        <Label className="font-medium">{day.label}</Label>
                      </div>
                      
                      <Switch
                        checked={dayHours.isOpen}
                        onCheckedChange={(checked) => updateBusinessHours(index, 'isOpen', checked)}
                      />
                      
                      {dayHours.isOpen && (
                        <>
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={dayHours.openTime}
                              onChange={(e) => updateBusinessHours(index, 'openTime', e.target.value)}
                              className="w-32"
                            />
                            <span>to</span>
                            <Input
                              type="time"
                              value={dayHours.closeTime}
                              onChange={(e) => updateBusinessHours(index, 'closeTime', e.target.value)}
                              className="w-32"
                            />
                          </div>
                        </>
                      )}
                      
                      {!dayHours.isOpen && (
                        <span className="text-muted-foreground">Closed</span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Branding & Appearance
                </CardTitle>
                <CardDescription>Customize your restaurant's visual identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Restaurant Logo & Identity</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="logo-upload">Restaurant Logo</Label>
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                          {(logoPreview || formData.logo) ? (
                            <div className="space-y-4">
                              <img 
                                src={logoPreview || formData.logo} 
                                alt="Restaurant Logo" 
                                className="h-20 w-auto mx-auto object-contain"
                              />
                              <div className="flex justify-center gap-2">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Change Logo
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={handleRemoveLogo}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-8 w-8 mx-auto text-gray-400" />
                              <p className="text-sm text-gray-600">Upload your restaurant logo</p>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => fileInputRef.current?.click()}
                              >
                                Choose File
                              </Button>
                            </div>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Recommended: PNG or JPG, max 2MB, transparent background preferred
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="display-name">Display Name</Label>
                        <Input
                          id="display-name"
                          value={formData.displayName}
                          onChange={(e) => setFormData({
                            ...formData,
                            displayName: e.target.value
                          })}
                          placeholder="Restaurant display name"
                        />
                        <p className="text-xs text-gray-500">
                          Optional: Override the default restaurant name shown in the header
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tagline">Tagline</Label>
                        <Input
                          id="tagline"
                          value={formData.tagline}
                          onChange={(e) => setFormData({
                            ...formData,
                            tagline: e.target.value
                          })}
                          placeholder="e.g., Authentic Italian Cuisine"
                        />
                        <p className="text-xs text-gray-500">
                          A short phrase describing your restaurant
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Colors</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="primary-color"
                          type="color"
                          value={formData.branding.primaryColor}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding, primaryColor: e.target.value }
                          })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.branding.primaryColor}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding, primaryColor: e.target.value }
                          })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondary-color">Secondary Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="secondary-color"
                          type="color"
                          value={formData.branding.secondaryColor}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding, secondaryColor: e.target.value }
                          })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.branding.secondaryColor}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding, secondaryColor: e.target.value }
                          })}
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accent-color">Accent Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="accent-color"
                          type="color"
                          value={formData.branding.accentColor}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding, accentColor: e.target.value }
                          })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.branding.accentColor}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding, accentColor: e.target.value }
                          })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Typography & Theme</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="font-family">Font Family</Label>
                      <Select 
                        value={formData.branding.fontFamily}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          branding: { ...formData.branding, fontFamily: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <Select 
                        value={formData.branding.theme}
                        onValueChange={(value: 'light' | 'dark' | 'auto') => setFormData({
                          ...formData,
                          branding: { ...formData.branding, theme: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Operational Settings
                </CardTitle>
                <CardDescription>Configure capacity and service options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Capacity</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="total-tables">Total Tables</Label>
                      <Input
                        id="total-tables"
                        type="number"
                        value={formData.capacity.totalTables}
                        onChange={(e) => setFormData({
                          ...formData,
                          capacity: { ...formData.capacity, totalTables: parseInt(e.target.value) || 0 }
                        })}
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="total-seats">Total Seats</Label>
                      <Input
                        id="total-seats"
                        type="number"
                        value={formData.capacity.totalSeats}
                        onChange={(e) => setFormData({
                          ...formData,
                          capacity: { ...formData.capacity, totalSeats: parseInt(e.target.value) || 0 }
                        })}
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="delivery-radius">Delivery Radius (km)</Label>
                      <Input
                        id="delivery-radius"
                        type="number"
                        value={formData.capacity.deliveryRadius}
                        onChange={(e) => setFormData({
                          ...formData,
                          capacity: { ...formData.capacity, deliveryRadius: parseInt(e.target.value) || 0 }
                        })}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Operating Mode</h3>
                  
                  <Select 
                    value={formData.operatingMode}
                    onValueChange={(value: 'dine-in' | 'takeaway' | 'delivery' | 'all') => setFormData({
                      ...formData,
                      operatingMode: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="dine-in">Dine-in Only</SelectItem>
                      <SelectItem value="takeaway">Takeaway Only</SelectItem>
                      <SelectItem value="delivery">Delivery Only</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <p className="text-sm text-muted-foreground">
                    Choose which services your restaurant offers
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RestaurantSettings;