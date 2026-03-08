'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Settings as SettingsIcon,
  Shield,
  Database,
  Bell,
  Mail,
  Lock,
  Server,
  HardDrive,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function SettingsPage() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // System Settings
  const [maxFileSize, setMaxFileSize] = useState('50');
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [rateLimit, setRateLimit] = useState('60');

  // Security Settings
  const [enforceSSL, setEnforceSSL] = useState(true);
  const [enable2FA, setEnable2FA] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState('');

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [adminAlerts, setAdminAlerts] = useState(true);

  // Storage Settings
  const [storageLimit, setStorageLimit] = useState('100');
  const [autoCleanup, setAutoCleanup] = useState(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Settings saved',
        description: 'Your settings have been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage system configuration and preferences
            </p>
          </div>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* System Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Server className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Core system configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="maxFileSize" className="text-sm font-medium">
                  Max File Size (MB)
                </label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={maxFileSize}
                  onChange={(e) => setMaxFileSize(e.target.value)}
                  placeholder="50"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum upload file size in megabytes
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="sessionTimeout" className="text-sm font-medium">
                  Session Timeout (minutes)
                </label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">
                  Automatic logout after inactivity
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="rateLimit" className="text-sm font-medium">
                  Rate Limit (requests/minute)
                </label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(e.target.value)}
                  placeholder="60"
                />
                <p className="text-xs text-muted-foreground">
                  API rate limit per user
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Authentication and access control</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Enforce SSL/HTTPS</div>
                  <div className="text-xs text-muted-foreground">
                    Require secure connections
                  </div>
                </div>
                <Checkbox
                  checked={enforceSSL}
                  onCheckedChange={(checked) => setEnforceSSL(!!checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Enable 2FA for Admins</div>
                  <div className="text-xs text-muted-foreground">
                    Require two-factor authentication
                  </div>
                </div>
                <Checkbox
                  checked={enable2FA}
                  onCheckedChange={(checked) => setEnable2FA(!!checked)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="ipWhitelist" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  IP Whitelist
                </label>
                <Input
                  id="ipWhitelist"
                  value={ipWhitelist}
                  onChange={(e) => setIpWhitelist(e.target.value)}
                  placeholder="10.0.0.0/8, 192.168.1.0/24"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of allowed IP ranges (CIDR notation)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Bell className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Email and alert preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Notifications
                </div>
                <div className="text-xs text-muted-foreground">
                  Receive system notifications via email
                </div>
              </div>
              <Checkbox
                checked={emailNotifications}
                onCheckedChange={(checked) => setEmailNotifications(!!checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Admin Alerts</div>
                <div className="text-xs text-muted-foreground">
                  Critical system alerts for administrators
                </div>
              </div>
              <Checkbox
                checked={adminAlerts}
                onCheckedChange={(checked) => setAdminAlerts(!!checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Storage Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <HardDrive className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle>Storage</CardTitle>
                <CardDescription>File storage configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="storageLimit" className="text-sm font-medium">
                Storage Limit per User (GB)
              </label>
              <Input
                id="storageLimit"
                type="number"
                value={storageLimit}
                onChange={(e) => setStorageLimit(e.target.value)}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">
                Maximum storage allocation per user account
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Auto Cleanup</div>
                <div className="text-xs text-muted-foreground">
                  Automatically delete files older than 90 days
                </div>
              </div>
              <Checkbox
                checked={autoCleanup}
                onCheckedChange={(checked) => setAutoCleanup(!!checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Database Info */}
        <Card className="border-0 shadow-sm bg-slate-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-slate-600" />
              <div>
                <CardTitle>System Information</CardTitle>
                <CardDescription>Current system status</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="text-lg font-semibold">2.0.0</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Environment</p>
                <p className="text-lg font-semibold">Production</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Database</p>
                <p className="text-lg font-semibold">PostgreSQL 14</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cache</p>
                <p className="text-lg font-semibold">Redis 7</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
