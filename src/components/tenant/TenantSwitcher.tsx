import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTenant } from "@/contexts/TenantContext";
import { useTenants, useSwitchTenant } from "@/hooks/useTenant";
import { Building, Crown, Users, Calendar } from "lucide-react";

const TenantSwitcher = () => {
  const { context, switchTenant } = useTenant();
  const { data: tenants, isLoading } = useTenants();
  const switchTenantMutation = useSwitchTenant();

  if (!context || !tenants || isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentTenant = tenants.find(t => t.id === context.tenant.id);

  const handleTenantSwitch = (tenantId: string) => {
    if (tenantId !== context.tenant.id) {
      switchTenantMutation.mutate(tenantId);
      switchTenant(tenantId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Tenant Management
        </CardTitle>
        <CardDescription>
          Switch between tenant accounts (Super Admin only)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Current Tenant</label>
          <Select value={context.tenant.id} onValueChange={handleTenantSwitch}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tenant.name}</span>
                      {tenant.plan.name === 'enterprise' && (
                        <Crown className="h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                    <Badge 
                      variant={tenant.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs ml-2"
                    >
                      {tenant.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentTenant && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground">Tenant Details</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Plan:</span>
                <div className="font-medium">{currentTenant.plan.displayName}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div className="font-medium capitalize">{currentTenant.status}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Users:</span>
                <div className="font-medium">
                  {currentTenant.limits.currentUsers}/{currentTenant.plan.limits.maxUsers}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Tables:</span>
                <div className="font-medium">
                  {currentTenant.limits.currentTables}/{currentTenant.plan.limits.maxTables}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Contact Information</div>
              <div className="text-sm">
                <div>{currentTenant.contact.firstName} {currentTenant.contact.lastName}</div>
                <div className="text-muted-foreground">{currentTenant.contact.email}</div>
                <div className="text-muted-foreground">{currentTenant.contact.phone}</div>
              </div>
            </div>

            {currentTenant.trialEndsAt && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Trial ends: {new Date(currentTenant.trialEndsAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = `https://${currentTenant.slug}.hotelzed.com`}
                className="flex-1"
              >
                Visit Tenant
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log('Manage tenant:', currentTenant.id)}
                className="flex-1"
              >
                Manage
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TenantSwitcher;