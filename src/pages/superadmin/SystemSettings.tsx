import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { getApiUrl } from '@/config/api';
import { 
  Upload, 
  Save,
  AlertCircle,
  Image,
  X
} from 'lucide-react';

const SystemSettings = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentLogo();
  }, []);

  const fetchCurrentLogo = async () => {
    try {
      const response = await fetch(getApiUrl('superadmin/settings/logo'));
      const data = await response.json();
      
      if (data.success && data.logoUrl) {
        // Logo URL is served from /uploads, not /api/uploads
        setLogoUrl(`http://localhost:5000${data.logoUrl}`);
      }
    } catch (error) {
      console.error('Error fetching logo:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 5MB',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a logo image to upload',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('logo', selectedFile);

      const token = localStorage.getItem('superadmin_token') || localStorage.getItem('token');
      
      const response = await fetch(getApiUrl('superadmin/settings/logo'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Logo uploaded',
          description: 'System logo has been updated successfully',
        });
        
        // Update the displayed logo
        setLogoUrl(`http://localhost:5000${data.logoUrl}`);
        setSelectedFile(null);
        setPreviewUrl(null);
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(data.message || 'Failed to upload logo');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload logo',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSelected = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground">
            Configure global system settings and branding
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Logo</CardTitle>
            <CardDescription>
              Upload a logo that will be displayed on the login page and other system areas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Logo Display */}
            <div>
              <label className="text-sm font-medium mb-2 block">Current Logo</label>
              <div className="border rounded-lg p-4 bg-gray-50">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="System Logo" 
                    className="h-20 object-contain mx-auto"
                  />
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Image className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No logo uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">Upload New Logo</label>
              
              {/* Preview of selected file */}
              {previewUrl && (
                <div className="mb-4 border rounded-lg p-4 bg-gray-50 relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveSelected}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <img 
                    src={previewUrl} 
                    alt="Logo Preview" 
                    className="h-20 object-contain mx-auto"
                  />
                  <p className="text-center text-sm text-gray-600 mt-2">
                    {selectedFile?.name}
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>

                {selectedFile && (
                  <Button
                    onClick={handleUpload}
                    disabled={isLoading}
                    className="bg-[#032541] hover:bg-[#021a2e]"
                  >
                    {isLoading ? (
                      <>Uploading...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Logo
                      </>
                    )}
                  </Button>
                )}
              </div>

              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Recommended: PNG or SVG format, transparent background, minimum 200x60 pixels.
                  Maximum file size: 5MB.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Additional Settings Cards can go here */}
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>
              Additional system-wide configuration options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">More settings coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SystemSettings;