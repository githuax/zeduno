import fs from 'fs';

const fixPaymentGatewayController = () => {
  const filePath = 'src/controllers/payment-gateway.controller.ts';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix getTenantPaymentConfig method
  const oldGetTenantConfig = `  // Get payment configuration for tenant admin (current tenant only)
  async getTenantPaymentConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId) {
        res.status(403).json({ error: 'Access denied - no tenant associated' });
        return;
      }`;

  const newGetTenantConfig = `  // Get payment configuration for tenant admin (current tenant only)
  async getTenantPaymentConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      
      // SuperAdmin can access any tenant's config (use query param or default to first tenant)
      if (userRole === 'superadmin') {
        const requestedTenantId = req.query.tenantId as string;
        
        if (requestedTenantId) {
          // SuperAdmin requested specific tenant
          const tenant = await Tenant.findById(requestedTenantId).select('paymentConfig name');
          if (!tenant) {
            res.status(404).json({ error: 'Tenant not found' });
            return;
          }
          
          res.json({
            success: true,
            config: tenant.paymentConfig || {},
            tenantInfo: { id: tenant._id, name: tenant.name }
          });
          return;
        } else {
          // SuperAdmin wants to see all tenants' configs
          const tenants = await Tenant.find({ isActive: true }).select('paymentConfig name');
          res.json({
            success: true,
            tenants: tenants.map(t => ({
              id: t._id,
              name: t.name,
              config: t.paymentConfig || {}
            }))
          });
          return;
        }
      }
      
      // Regular tenant users
      if (!tenantId) {
        res.status(403).json({ error: 'Access denied - no tenant associated' });
        return;
      }`;

  content = content.replace(oldGetTenantConfig, newGetTenantConfig);

  // Fix updateTenantPaymentConfig method
  const oldUpdateTenantConfig = `  // Update payment configuration for tenant admin (current tenant only)
  async updateTenantPaymentConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      
      if (!tenantId || (req.user?.role !== 'admin' && req.user?.role !== 'superadmin')) {
        res.status(403).json({ error: 'Only tenant administrators can update payment configuration' });
        return;
      }`;

  const newUpdateTenantConfig = `  // Update payment configuration for tenant admin (current tenant only)
  async updateTenantPaymentConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const userRole = req.user?.role;
      
      // SuperAdmin can update any tenant's config
      if (userRole === 'superadmin') {
        const targetTenantId = req.body.tenantId || req.query.tenantId as string;
        
        if (!targetTenantId) {
          res.status(400).json({ error: 'Tenant ID required for SuperAdmin operations' });
          return;
        }
        
        const { config } = req.body;
        if (!config) {
          res.status(400).json({ error: 'Payment configuration is required' });
          return;
        }

        const updatedTenant = await Tenant.findByIdAndUpdate(
          targetTenantId,
          { paymentConfig: config },
          { new: true }
        ).select('paymentConfig name');

        if (!updatedTenant) {
          res.status(404).json({ error: 'Tenant not found' });
          return;
        }

        res.json({
          success: true,
          message: 'Payment configuration updated successfully',
          config: updatedTenant.paymentConfig,
          tenant: { id: updatedTenant._id, name: updatedTenant.name }
        });
        return;
      }
      
      // Regular tenant users
      if (!tenantId || userRole !== 'admin') {
        res.status(403).json({ error: 'Only tenant administrators can update payment configuration' });
        return;
      }`;

  content = content.replace(oldUpdateTenantConfig, newUpdateTenantConfig);

  fs.writeFileSync(filePath, content);
  console.log('✅ Payment gateway controller fixed for SuperAdmin access');
};

fixPaymentGatewayController();
