import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { User, Lock, Calendar, Activity, AlertTriangle, Shield, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Header from '@/components/layout/Header';

interface AuditLog {
  id: string;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  status: 'success' | 'failure' | 'warning';
}

interface UserProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantName?: string;
  passwordLastChanged: Date;
  passwordExpiryDate: Date;
  lastLogin: Date;
  twoFactorEnabled: boolean;
  accountStatus: 'active' | 'locked' | 'suspended';
}

const UserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchProfileData();
    fetchAuditLogs();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/user/audit-logs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Password changed successfully'
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        fetchProfileData();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to change password',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change password',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    if (strength <= 2) return { level: 'Weak', color: 'text-red-600' };
    if (strength <= 4) return { level: 'Medium', color: 'text-amber-600' };
    return { level: 'Strong', color: 'text-green-600' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'failure':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-800">Warning</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDaysUntilExpiry = () => {
    if (!profileData?.passwordExpiryDate) return null;
    const today = new Date();
    const expiry = new Date(profileData.passwordExpiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const passwordStrength = calculatePasswordStrength(newPassword);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Header />
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">User Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and security</p>
        </div>

        {daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Password Expiring Soon</AlertTitle>
            <AlertDescription>
              Your password will expire in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}. 
              Please change it to maintain account access.
            </AlertDescription>
          </Alert>
        )}

        {daysUntilExpiry !== null && daysUntilExpiry <= 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle>Password Expired</AlertTitle>
            <AlertDescription>
              Your password has expired. Please change it immediately to continue using your account.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="security">Security Settings</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>View and manage your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input value={profileData?.firstName || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input value={profileData?.lastName || ''} disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input value={profileData?.email || ''} disabled />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input value={profileData?.role || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Organization</Label>
                    <Input value={profileData?.tenantName || 'System'} disabled />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account Status</Label>
                    <div className="flex items-center gap-2">
                      {profileData?.accountStatus === 'active' ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : profileData?.accountStatus === 'locked' ? (
                        <Badge className="bg-red-100 text-red-800">Locked</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800">Suspended</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Last Login</Label>
                    <Input 
                      value={profileData?.lastLogin ? new Date(profileData.lastLogin).toLocaleString() : 'Never'} 
                      disabled 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage your password and security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Label>Password Last Changed</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {profileData?.passwordLastChanged 
                          ? new Date(profileData.passwordLastChanged).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Label>Password Expires</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {profileData?.passwordExpiryDate 
                          ? new Date(profileData.passwordExpiryDate).toLocaleDateString()
                          : 'Never'}
                      </p>
                      {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                        <p className={`text-xs ${daysUntilExpiry <= 7 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          {daysUntilExpiry} days remaining
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <h3 className="text-lg font-semibold">Change Password</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      {newPassword && (
                        <p className={`text-sm ${passwordStrength.color}`}>
                          Password Strength: {passwordStrength.level}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Changing Password...' : 'Change Password'}
                    </Button>
                  </form>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <Label>Two-Factor Authentication</Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Badge className={profileData?.twoFactorEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {profileData?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Audit Log
                </CardTitle>
                <CardDescription>View your recent account activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {auditLogs.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No audit logs available</p>
                    ) : (
                      auditLogs.map((log) => (
                        <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{log.action}</p>
                              {getStatusBadge(log.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{log.details}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>IP: {log.ipAddress}</span>
                              <span>{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;