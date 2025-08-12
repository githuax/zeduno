import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemUsers, useCreateUser, useUpdateUser } from "@/hooks/useSettings";
import { SystemUser, UserPermissions, PermissionLevel } from "@/types/settings.types";
import { 
  ArrowLeft,
  Users,
  Plus,
  Search,
  Settings,
  Edit,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  Key,
  Clock,
  Mail,
  Phone
} from "lucide-react";

const UserManagement = () => {
  const navigate = useNavigate();
  const { data: users, isLoading } = useSystemUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    department: '',
    role: 'staff' as any,
    permissions: {
      role: 'staff' as any,
      modules: {
        orders: 'read' as PermissionLevel,
        inventory: 'none' as PermissionLevel,
        payments: 'none' as PermissionLevel,
        reports: 'none' as PermissionLevel,
        staff: 'none' as PermissionLevel,
        settings: 'none' as PermissionLevel
      }
    } as UserPermissions
  });

  const roles = [
    { value: 'admin', label: 'Administrator', color: 'text-red-600 bg-red-100' },
    { value: 'manager', label: 'Manager', color: 'text-blue-600 bg-blue-100' },
    { value: 'staff', label: 'Staff', color: 'text-green-600 bg-green-100' },
    { value: 'cashier', label: 'Cashier', color: 'text-purple-600 bg-purple-100' }
  ];

  const departments = ['Management', 'Kitchen', 'Service', 'Delivery', 'Support'];

  const permissionLevels: { value: PermissionLevel; label: string; color: string }[] = [
    { value: 'none', label: 'None', color: 'text-gray-600 bg-gray-100' },
    { value: 'read', label: 'Read', color: 'text-blue-600 bg-blue-100' },
    { value: 'write', label: 'Write', color: 'text-green-600 bg-green-100' },
    { value: 'admin', label: 'Admin', color: 'text-red-600 bg-red-100' }
  ];

  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role.name.toLowerCase() === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async () => {
    try {
      await createUser.mutateAsync(newUser);
      setShowCreateDialog(false);
      setNewUser({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        department: '',
        role: 'staff',
        permissions: {
          role: 'staff',
          modules: {
            orders: 'read',
            inventory: 'none',
            payments: 'none',
            reports: 'none',
            staff: 'none',
            settings: 'none'
          }
        }
      });
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      await updateUser.mutateAsync({
        userId: selectedUser.id,
        userData: selectedUser
      });
      setShowEditDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const updatePermission = (module: keyof UserPermissions['modules'], level: PermissionLevel) => {
    if (selectedUser) {
      setSelectedUser({
        ...selectedUser,
        permissions: {
          ...selectedUser.permissions,
          modules: {
            ...selectedUser.permissions.modules,
            [module]: level
          }
        }
      });
    }
  };

  const getRoleColor = (roleName: string) => {
    const role = roles.find(r => r.label.toLowerCase() === roleName.toLowerCase());
    return role?.color || 'text-gray-600 bg-gray-100';
  };

  const getPermissionColor = (level: PermissionLevel) => {
    const permission = permissionLevels.find(p => p.value === level);
    return permission?.color || 'text-gray-600 bg-gray-100';
  };

  const formatDate = (date: Date) => date.toLocaleDateString();
  const formatLastLogin = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
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
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">
              Manage users, roles, and permissions
            </p>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new user account</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="johnsmith"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="john@restaurant.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={newUser.role}
                      onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select 
                      value={newUser.department}
                      onValueChange={(value) => setNewUser({ ...newUser, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateUser}
                    disabled={createUser.isPending || !newUser.username || !newUser.email}
                  >
                    Create User
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.value} value={role.label.toLowerCase()}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers?.length || 0})</CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role.name)}>
                        {user.role.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.department}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatLastLogin(user.lastLogin)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog 
                          open={showEditDialog && selectedUser?.id === user.id} 
                          onOpenChange={(open) => {
                            setShowEditDialog(open);
                            if (open) setSelectedUser(user);
                            else setSelectedUser(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit User - {selectedUser?.firstName} {selectedUser?.lastName}</DialogTitle>
                              <DialogDescription>Update user information and permissions</DialogDescription>
                            </DialogHeader>
                            
                            {selectedUser && (
                              <Tabs defaultValue="info" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="info">User Info</TabsTrigger>
                                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                                </TabsList>

                                <TabsContent value="info" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-firstName">First Name</Label>
                                      <Input
                                        id="edit-firstName"
                                        value={selectedUser.firstName}
                                        onChange={(e) => setSelectedUser({
                                          ...selectedUser,
                                          firstName: e.target.value
                                        })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-lastName">Last Name</Label>
                                      <Input
                                        id="edit-lastName"
                                        value={selectedUser.lastName}
                                        onChange={(e) => setSelectedUser({
                                          ...selectedUser,
                                          lastName: e.target.value
                                        })}
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                      id="edit-email"
                                      type="email"
                                      value={selectedUser.email}
                                      onChange={(e) => setSelectedUser({
                                        ...selectedUser,
                                        email: e.target.value
                                      })}
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-department">Department</Label>
                                      <Select 
                                        value={selectedUser.department}
                                        onValueChange={(value) => setSelectedUser({
                                          ...selectedUser,
                                          department: value
                                        })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {departments.map(dept => (
                                            <SelectItem key={dept} value={dept}>
                                              {dept}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="edit-status">Status</Label>
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={selectedUser.isActive}
                                          onCheckedChange={(checked) => setSelectedUser({
                                            ...selectedUser,
                                            isActive: checked
                                          })}
                                        />
                                        <span className="text-sm">
                                          {selectedUser.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </TabsContent>

                                <TabsContent value="permissions" className="space-y-4">
                                  <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Module Permissions</h3>
                                    
                                    {Object.entries(selectedUser.permissions.modules).map(([module, level]) => (
                                      <div key={module} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                          <p className="font-medium capitalize">{module.replace('_', ' ')}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {module === 'orders' && 'View and manage customer orders'}
                                            {module === 'inventory' && 'Manage inventory and stock'}
                                            {module === 'payments' && 'Process payments and transactions'}
                                            {module === 'reports' && 'View reports and analytics'}
                                            {module === 'staff' && 'Manage staff and schedules'}
                                            {module === 'settings' && 'System configuration and settings'}
                                          </p>
                                        </div>
                                        
                                        <Select
                                          value={level}
                                          onValueChange={(value: PermissionLevel) => updatePermission(module as any, value)}
                                        >
                                          <SelectTrigger className="w-32">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {permissionLevels.map(perm => (
                                              <SelectItem key={perm.value} value={perm.value}>
                                                {perm.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    ))}
                                  </div>
                                </TabsContent>
                              </Tabs>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                              <Button 
                                variant="outline" 
                                onClick={() => setShowEditDialog(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleUpdateUser}
                                disabled={updateUser.isPending}
                              >
                                Save Changes
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserManagement;