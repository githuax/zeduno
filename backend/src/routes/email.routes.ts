import { Router } from 'express';
import { param } from 'express-validator';

import { 
  emailController, 
  emailConfigValidation, 
  emailTemplateValidation,
  sendEmailValidation,
  sendBulkEmailValidation 
} from '../controllers/email.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Validation for tenant ID parameter
const tenantIdValidation = [
  param('tenantId').isMongoId().withMessage('Invalid tenant ID')
];

const templateIdValidation = [
  param('templateId').isMongoId().withMessage('Invalid template ID')
];

// Email Configuration Routes
router.post(
  '/:tenantId/config',
  authenticate,
  tenantIdValidation,
  emailConfigValidation,
  emailController.createEmailConfig
);

router.get(
  '/:tenantId/config',
  authenticate,
  tenantIdValidation,
  emailController.getEmailConfig
);

router.put(
  '/:tenantId/config',
  authenticate,
  tenantIdValidation,
  emailConfigValidation,
  emailController.updateEmailConfig
);

// Email Template Routes
router.post(
  '/:tenantId/templates',
  authenticate,
  tenantIdValidation,
  emailTemplateValidation,
  emailController.createEmailTemplate
);

router.get(
  '/:tenantId/templates',
  authenticate,
  tenantIdValidation,
  emailController.getEmailTemplates
);

router.get(
  '/:tenantId/templates/:templateId',
  authenticate,
  tenantIdValidation,
  templateIdValidation,
  emailController.getEmailTemplate
);

router.put(
  '/:tenantId/templates/:templateId',
  authenticate,
  tenantIdValidation,
  templateIdValidation,
  emailTemplateValidation,
  emailController.updateEmailTemplate
);

router.delete(
  '/:tenantId/templates/:templateId',
  authenticate,
  tenantIdValidation,
  templateIdValidation,
  emailController.deleteEmailTemplate
);

// Email Sending Routes
router.post(
  '/:tenantId/send',
  authenticate,
  tenantIdValidation,
  sendEmailValidation,
  emailController.sendEmail
);

router.post(
  '/:tenantId/send-bulk',
  authenticate,
  tenantIdValidation,
  sendBulkEmailValidation,
  emailController.sendBulkEmail
);

// Email Logs and Analytics Routes
router.get(
  '/:tenantId/logs',
  authenticate,
  tenantIdValidation,
  emailController.getEmailLogs
);

router.get(
  '/:tenantId/stats',
  authenticate,
  tenantIdValidation,
  emailController.getEmailStats
);

router.post(
  '/:tenantId/retry-failed',
  authenticate,
  tenantIdValidation,
  emailController.retryFailedEmails
);

export default router;