import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBackupJobs, useCreateBackup, useSystemSettings, useUpdateSystemSettings } from "@/hooks/useSettings";
import { 
  ArrowLeft,
  Database,
  Download,
  Play,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Cloud,
  HardDrive,
  Shield,
  Calendar,
  FileText,
  Archive,
  Trash2
} from "lucide-react";

const BackupManagement = () => {
  const navigate = useNavigate();
  const { data: backupJobs, isLoading: jobsLoading, refetch } = useBackupJobs();
  const { data: systemSettings } = useSystemSettings();
  const createBackup = useCreateBackup();
  const updateSettings = useUpdateSystemSettings();
  
  const [backupSettings, setBackupSettings] = useState({
    automated: {
      enabled: true,
      frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
      time: '02:00',
      retentionDays: 30
    },
    storage: {
      provider: 'local' as 'local' | 'aws-s3' | 'google-cloud' | 'azure',
      configuration: {}
    },
    encryption: {
      enabled: true
    }
  });

  // Initialize backup settings from system settings
  if (systemSettings?.backup && backupSettings.automated.enabled !== systemSettings.backup.automated.enabled) {
    setBackupSettings(systemSettings.backup);
  }

  const handleCreateManualBackup = async () => {
    try {
      await createBackup.mutateAsync('manual');
      refetch();
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync({
        backup: backupSettings
      });
    } catch (error) {
      console.error('Failed to update backup settings:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => date.toLocaleString();

  const storageProviders = [
    { 
      value: 'local', 
      label: 'Local Storage', 
      icon: HardDrive,
      description: 'Store backups on local server'
    },
    { 
      value: 'aws-s3', 
      label: 'Amazon S3', 
      icon: Cloud,
      description: 'Store backups in Amazon S3'
    },
    { 
      value: 'google-cloud', 
      label: 'Google Cloud Storage', 
      icon: Cloud,
      description: 'Store backups in Google Cloud'
    },
    { 
      value: 'azure', 
      label: 'Azure Blob Storage', 
      icon: Cloud,
      description: 'Store backups in Microsoft Azure'
    }
  ];

  if (jobsLoading) {
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
            <h1 className="text-3xl font-bold text-foreground">Backup & Recovery</h1>
            <p className="text-muted-foreground">
              Manage data backups and recovery options
            </p>
          </div>

          <Button 
            onClick={handleCreateManualBackup}
            disabled={createBackup.isPending}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Create Backup
          </Button>
        </div>

        <Tabs defaultValue="backups" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="backups">Backup History</TabsTrigger>
            <TabsTrigger value="settings">Backup Settings</TabsTrigger>
            <TabsTrigger value="restore">Restore</TabsTrigger>
          </TabsList>

          <TabsContent value="backups" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{backupJobs?.length || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-medium">
                    {backupJobs?.[0] ? formatDate(backupJobs[0].startTime) : 'Never'}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">95%</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {backupJobs ? formatFileSize(backupJobs.reduce((sum, job) => sum + (job.size || 0), 0) * 1024 * 1024) : '0 MB'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Backup History Table */}
            <Card>
              <CardHeader>
                <CardTitle>Backup History</CardTitle>
                <CardDescription>Recent backup jobs and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Backup ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backupJobs?.map((job) => {
                      const duration = job.endTime 
                        ? Math.floor((job.endTime.getTime() - job.startTime.getTime()) / 1000)
                        : null;
                      
                      return (
                        <TableRow key={job.id}>
                          <TableCell className="font-mono text-sm">
                            {job.id}
                          </TableCell>
                          <TableCell>
                            <Badge variant={job.type === 'manual' ? 'default' : 'secondary'}>
                              {job.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(job.status)}
                              <Badge variant={getStatusColor(job.status)}>
                                {job.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(job.startTime)}</TableCell>
                          <TableCell>
                            {duration ? `${duration}s` : '-'}
                          </TableCell>
                          <TableCell>
                            {job.size ? formatFileSize(job.size * 1024 * 1024) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {job.status === 'completed' && (
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Automated Backups
                </CardTitle>
                <CardDescription>Configure automatic backup schedules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Enable Automated Backups</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatically create backups on a regular schedule
                    </p>
                  </div>
                  <Switch
                    checked={backupSettings.automated.enabled}
                    onCheckedChange={(checked) => setBackupSettings({
                      ...backupSettings,
                      automated: { ...backupSettings.automated, enabled: checked }
                    })}
                  />
                </div>

                {backupSettings.automated.enabled && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Backup Frequency</Label>
                        <Select
                          value={backupSettings.automated.frequency}
                          onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setBackupSettings({
                            ...backupSettings,
                            automated: { ...backupSettings.automated, frequency: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="backup-time">Backup Time</Label>
                        <Input
                          id="backup-time"
                          type="time"
                          value={backupSettings.automated.time}
                          onChange={(e) => setBackupSettings({
                            ...backupSettings,
                            automated: { ...backupSettings.automated, time: e.target.value }
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="retention">Retention (days)</Label>
                        <Input
                          id="retention"
                          type="number"
                          value={backupSettings.automated.retentionDays}
                          onChange={(e) => setBackupSettings({
                            ...backupSettings,
                            automated: { 
                              ...backupSettings.automated, 
                              retentionDays: parseInt(e.target.value) || 30 
                            }
                          })}
                          min="1"
                          max="365"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  Storage Configuration
                </CardTitle>
                <CardDescription>Choose where to store your backups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {storageProviders.map((provider) => {
                    const Icon = provider.icon;
                    const isSelected = backupSettings.storage.provider === provider.value;
                    
                    return (
                      <div
                        key={provider.value}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setBackupSettings({
                          ...backupSettings,
                          storage: { ...backupSettings.storage, provider: provider.value }
                        })}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-6 w-6 text-primary" />
                          <div>
                            <h3 className="font-medium">{provider.label}</h3>
                            <p className="text-sm text-muted-foreground">{provider.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {backupSettings.storage.provider !== 'local' && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Cloud Storage Configuration</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Configure your cloud storage credentials and settings.
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="api-key">API Key</Label>
                        <Input
                          id="api-key"
                          type="password"
                          placeholder="Enter your API key"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bucket">Bucket/Container Name</Label>
                        <Input
                          id="bucket"
                          placeholder="Enter bucket or container name"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Backup encryption and security options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Encrypt Backups</h3>
                    <p className="text-sm text-muted-foreground">
                      Encrypt backup files for additional security
                    </p>
                  </div>
                  <Switch
                    checked={backupSettings.encryption.enabled}
                    onCheckedChange={(checked) => setBackupSettings({
                      ...backupSettings,
                      encryption: { ...backupSettings.encryption, enabled: checked }
                    })}
                  />
                </div>

                {backupSettings.encryption.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="encryption-key">Encryption Key</Label>
                    <Input
                      id="encryption-key"
                      type="password"
                      placeholder="Enter encryption key"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Keep this key safe. It will be required to restore encrypted backups.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveSettings}
                disabled={updateSettings.isPending}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="restore" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  Restore from Backup
                </CardTitle>
                <CardDescription>Restore your system from a previous backup</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Important Notice</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Restoring from a backup will overwrite all current data. Please ensure you have a recent backup
                        of your current data before proceeding.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Available Backups</h3>
                  
                  <div className="space-y-2">
                    {backupJobs?.filter(job => job.status === 'completed').slice(0, 5).map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{job.id}</p>
                            <p className="text-sm text-muted-foreground">
                              Created: {formatDate(job.startTime)} • Size: {formatFileSize((job.size || 0) * 1024 * 1024)}
                            </p>
                          </div>
                        </div>
                        
                        <Button variant="outline" size="sm">
                          Restore
                        </Button>
                      </div>
                    ))}
                  </div>

                  {(!backupJobs || backupJobs.filter(job => job.status === 'completed').length === 0) && (
                    <div className="text-center py-8">
                      <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Backups Available</h3>
                      <p className="text-muted-foreground">
                        No completed backups found. Create a backup first to enable restore functionality.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default BackupManagement;