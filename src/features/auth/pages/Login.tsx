import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { getApiUrl } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { ChangePasswordModal } from '@/features/auth/components';
import { getAssetUrl } from '@/utils/url';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, user } = useAuth();

  useEffect(() => {
    // Fetch system logo
    const fetchLogo = async () => {
      try {
        const response = await fetch(getApiUrl('superadmin/settings/logo'));
        
        if (!response.ok) {
          console.warn('Logo fetch failed with status:', response.status);
          return;
        }

        const text = await response.text();
        if (!text.trim()) {
          console.warn('Empty response from logo endpoint');
          return;
        }

        const data = JSON.parse(text);
        
        if (data.success && data.logoUrl) {
          // Use utility function to get proper asset URL
          setLogoUrl(getAssetUrl(data.logoUrl));
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
        // Don't throw - just continue without logo
      }
    };
    
    fetchLogo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      
      // Check if user must change password
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        if (userData.mustChangePassword) {
          setShowPasswordChangeModal(true);
          toast({
            title: 'Password Change Required',
            description: 'You must change your password before continuing.',
          });
          return;
        }
      }
      
      toast({
        title: 'Login successful',
        description: `Welcome back!`,
      });
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChanged = () => {
    setShowPasswordChangeModal(false);
    toast({
      title: 'Password changed successfully',
      description: 'Redirecting to dashboard...',
    });
    
    // Redirect based on user role
    if (user) {
      switch (user.role) {
        case 'superadmin':
          navigate('/superadmin/dashboard');
          break;
        case 'admin':
          navigate('/dashboard');
          break;
        case 'manager':
          navigate('/dashboard');
          break;
        case 'staff':
          navigate('/orders');
          break;
        case 'user':
          navigate('/orders');
          break;
        default:
          navigate('/dashboard');
      }
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            {logoUrl ? (
              <div className="flex justify-center">
                <img 
                  src={logoUrl} 
                  alt="ZedUno Logo" 
                  className="h-48 object-contain"
                />
              </div>
            ) : (
              <CardTitle className="text-2xl font-bold text-center">Welcome to ZedUno</CardTitle>
            )}
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" style={{ backgroundColor: '#032541' }} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
            <p>Demo Credentials:</p>
            <div className="space-y-1">
              <p>SuperAdmin: superadmin@zeduno.com / SuperAdmin@123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    
    {/* Password Change Modal */}
    <ChangePasswordModal
      isOpen={showPasswordChangeModal}
      email={email}
      onPasswordChanged={handlePasswordChanged}
    />
    </>
  );
};

export default Login;