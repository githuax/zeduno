import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/config/api';
import { getAssetUrl } from '@/utils/url';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  useEffect(() => {
    // Fetch system logo
    const fetchLogo = async () => {
      try {
        const response = await fetch(getApiUrl('superadmin/settings/logo'));
        const data = await response.json();
        
        if (data.success && data.logoUrl) {
          // Use utility function to get proper asset URL
          setLogoUrl(getAssetUrl(data.logoUrl));
        }
      } catch (error) {
        console.error('Error fetching logo:', error);
      }
    };
    
    fetchLogo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      
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

  return (
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
              <p>Joe's Admin: admin@joespizzapalace.com / JoesPizza@2024</p>
              <p>Manager: manager@joespizzapalace.com / Manager@2024</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;