import React from 'react';

import { Badge } from "@/components/ui/badge";

interface TenantIndicatorProps {
  item: {
    tenantId?: {
      _id?: string;
      name?: string;
    } | string;
  };
  userRole?: string;
}

const TenantIndicator: React.FC<TenantIndicatorProps> = ({ item, userRole }) => {
  // Only show tenant info for SuperAdmin
  if (userRole !== 'superadmin') {
    return null;
  }

  // Handle different tenantId formats
  let tenantId: string | undefined;
  let tenantName: string | undefined;

  if (typeof item.tenantId === 'string') {
    tenantId = item.tenantId;
  } else if (item.tenantId && typeof item.tenantId === 'object') {
    tenantId = item.tenantId._id;
    tenantName = item.tenantId.name;
  }

  if (!tenantId) {
    return null;
  }

  // Create tenant display name
  const displayName = tenantName || `Tenant ${tenantId.substring(0, 8)}`;

  // Color coding for different tenants
  const getVariant = (id: string) => {
    const colors = ['default', 'secondary', 'destructive', 'outline'];
    const index = parseInt(id.substring(0, 2), 16) % colors.length;
    return colors[index] as 'default' | 'secondary' | 'destructive' | 'outline';
  };

  return (
    <Badge variant={getVariant(tenantId)} className="ml-2 text-xs">
      {displayName}
    </Badge>
  );
};

export default TenantIndicator;
