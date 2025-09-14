import { 
  Settings, 
  Shield, 
  Users, 
  Bell, 
  Database, 
  Monitor, 
  Plug,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Cpu,
  MemoryStick,
  Wifi,
  Building
} from "lucide-react";
import { useState } from 'react';
import { useNavigate } from "react-router-dom";

import Header from "@/components/layout/Header";
import TenantSwitcher from "@/components/tenant/TenantSwitcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsTenantAdmin, PermissionGate } from "@/contexts/TenantContext";
import { useSystemHealth } from "@/hooks/useSettings";

const SystemSettings = () => {
  const navigate = useNavigate();
  const { data: systemHealth, isLoading: healthLoading } = useSystemHealth();
  const isTenantAdmin = useIsTenantAdmin();
  
  const settingsCategories = [
    {
      id: 'restaurant',
      title: 'Restaurant Settings',
      description: 'Configure your restaurant information and preferences',
      icon: Settings,
      route: '/settings/restaurant',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      route: '/settings/users',
      color: 'text-green-600 bg-green-100'
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      description: 'Security settings and data protection',
      icon: Shield,
      route: '/settings/security',
      color: 'text-red-600 bg-red-100'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure email, SMS, and push notifications',
      icon: Bell,
      route: '/settings/notifications',
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'Third-party services and API connections',
      icon: Plug,
      route: '/settings/integrations',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      id: 'backup',
      title: 'Backup & Recovery',
      description: 'Data backup and system recovery options',
      icon: Database,
      route: '/settings/backup',
      color: 'text-indigo-600 bg-indigo-100'
    },
    {
      id: 'system',
      title: 'System Administration',
      description: 'Advanced system configuration and maintenance',
      icon: Server,
      route: '/settings/system',
      color: 'text-gray-600 bg-gray-100'
    },
    {
      id: 'monitoring',
      title: 'System Monitoring',
      description: 'Performance monitoring and health checks',
      icon: Monitor,
      route: '/settings/monitoring',
      color: 'text-teal-600 bg-teal-100'
    }
  ];

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
      case 'offline':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
      case 'offline':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">System Settings</h1>
            <p className="text-muted-foreground">
              Configure and manage your restaurant management system
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={systemHealth?.status === 'healthy' ? 'default' : 'destructive'} className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              System {systemHealth?.status || 'Unknown'}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="health">System Health</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {settingsCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Card 
                    key={category.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(category.route)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${category.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {category.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used system operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 h-12"
                    onClick={() => navigate('/settings/backup')}
                  >
                    <Database className="h-4 w-4" />
                    Create Backup
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 h-12"
                    onClick={() => navigate('/settings/users')}
                  >
                    <Users className="h-4 w-4" />
                    Add New User
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 h-12"
                    onClick={() => navigate('/settings/monitoring')}
                  >
                    <Monitor className="h-4 w-4" />
                    View Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tenant Management - Admin Only */}
              <PermissionGate resource="settings" action="system">
                <div className="lg:col-span-2">
                  <TenantSwitcher />
                </div>
              </PermissionGate>
              
              {settingsCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Card 
                    key={category.id} 
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${category.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{category.title}</CardTitle>
                            <CardDescription>{category.description}</CardDescription>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(category.route)}
                        >
                          Configure
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            {!healthLoading && systemHealth && (
              <>
                {/* System Status Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      System Status
                    </CardTitle>
                    <CardDescription>Current system health and performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(systemHealth.status)}`}>
                          {getStatusIcon(systemHealth.status)}
                          {systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Overall Status</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{formatUptime(systemHealth.uptime)}</div>
                        <p className="text-sm text-muted-foreground">Uptime</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{systemHealth.metrics.cpu.usage}%</div>
                        <p className="text-sm text-muted-foreground">CPU Usage</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{systemHealth.metrics.memory.percentage}%</div>
                        <p className="text-sm text-muted-foreground">Memory Usage</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* System Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Cpu className="h-5 w-5" />
                        System Resources
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">CPU Usage</span>
                          <span className="text-sm font-medium">{systemHealth.metrics.cpu.usage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${systemHealth.metrics.cpu.usage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground">{systemHealth.metrics.cpu.cores} cores available</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Memory Usage</span>
                          <span className="text-sm font-medium">
                            {formatBytes(systemHealth.metrics.memory.used * 1024 * 1024)} / {formatBytes(systemHealth.metrics.memory.total * 1024 * 1024)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${systemHealth.metrics.memory.percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Disk Usage</span>
                          <span className="text-sm font-medium">
                            {formatBytes(systemHealth.metrics.disk.used * 1024 * 1024)} / {formatBytes(systemHealth.metrics.disk.total * 1024 * 1024)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${systemHealth.metrics.disk.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        Services Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(systemHealth.services).map(([service, status]) => (
                          <div key={service} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-1 rounded-full ${getStatusColor(status)}`}>
                                {getStatusIcon(status)}
                              </div>
                              <span className="font-medium capitalize">{service.replace('_', ' ')}</span>
                            </div>
                            <Badge variant={status === 'online' ? 'default' : 'destructive'}>
                              {status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Network Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wifi className="h-5 w-5" />
                      Network Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Data In</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatBytes(systemHealth.metrics.network.bytesIn)}
                          </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Activity className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Data Out</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatBytes(systemHealth.metrics.network.bytesOut)}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Activity className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SystemSettings;