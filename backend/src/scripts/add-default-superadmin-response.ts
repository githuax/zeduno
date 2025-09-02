import fs from 'fs';

const addDefaultSuperAdminResponse = () => {
  const filePath = 'src/controllers/payment-gateway.controller.ts';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the SuperAdmin section and update it
  const oldSuperAdminSection = `        } else {
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
        }`;

  const newSuperAdminSection = `        } else {
          // SuperAdmin wants to see all tenants' configs
          const tenants = await Tenant.find({ isActive: true }).select('paymentConfig name');
          
          if (tenants.length === 0) {
            // No tenants exist, return default response
            res.json({
              success: true,
              message: 'No tenants found. SuperAdmin can create payment configurations.',
              tenants: [],
              canCreateTenant: true
            });
            return;
          }
          
          res.json({
            success: true,
            tenants: tenants.map(t => ({
              id: t._id,
              name: t.name,
              config: t.paymentConfig || {}
            }))
          });
          return;
        }`;

  content = content.replace(oldSuperAdminSection, newSuperAdminSection);

  fs.writeFileSync(filePath, content);
  console.log('✅ Added default SuperAdmin response for empty tenants');
};

addDefaultSuperAdminResponse();
