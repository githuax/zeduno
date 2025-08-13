import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Crown, AlertCircle, Eye, EyeOff } from "lucide-react";

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: 'superadmin@hotelzed.com', // Pre-filled for convenience
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/superadmin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        // Store the token and user info
        localStorage.setItem('superadmin_token', data.token);
        localStorage.setItem('superadmin_user', JSON.stringify(data.user));
        
        setSuccess('Login successful! Redirecting to SuperAdmin Dashboard...');
        
        // Redirect to superadmin dashboard
        setTimeout(() => {
          navigate('/superadmin/dashboard');
        }, 1500);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Shield className="h-16 w-16 text-yellow-400" />
              <Crown className="h-6 w-6 text-yellow-300 absolute -top-1 -right-1" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">HotelZed SuperAdmin</h1>
          <p className="text-gray-300">Platform Administration Portal</p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-400" />
              SuperAdmin Login
            </CardTitle>
            <CardDescription className="text-gray-300">
              Access platform-level tenant management and system administration
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email or Username</Label>
                <Input
                  id="email"
                  type="text"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400"
                  placeholder="superadmin@hotelzed.com or superadmin"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-900/50 border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-900/50 border-green-800 text-green-200">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Login as SuperAdmin'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Default Credentials</p>
                <div className="bg-slate-700/50 rounded-lg p-3 text-sm">
                  <p className="text-gray-300"><strong>Email:</strong> superadmin@hotelzed.com</p>
                  <p className="text-gray-300"><strong>Username:</strong> superadmin</p>
                  <p className="text-gray-300"><strong>Password:</strong> SuperAdmin123!</p>
                </div>
                <p className="text-yellow-400 text-xs mt-2">⚠️ Change password after first login</p>
              </div>
              
              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="text-gray-400 hover:text-white"
                >
                  ← Back to Main Application
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm mb-4">SuperAdmin Features</p>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-300">
            <div className="bg-slate-800/30 rounded-lg p-3">
              <Crown className="h-4 w-4 text-yellow-400 mx-auto mb-2" />
              <p>Tenant Management</p>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-3">
              <Shield className="h-4 w-4 text-blue-400 mx-auto mb-2" />
              <p>System Administration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;