import express from 'express';
import * as subcountyController from '../controllers/subcounty.controller';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(subcountyController.getSubcounties)
  .post(subcountyController.createSubcounty);

router.route('/:id')
  .get(subcountyController.getSubcounty)
  .put(subcountyController.updateSubcounty)
  .delete(subcountyController.deleteSubcounty);

export default router;