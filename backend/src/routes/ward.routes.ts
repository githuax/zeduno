import express from 'express';
import * as wardController from '../controllers/ward.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(wardController.getWards)
  .post(wardController.createWard);

router.route('/:id')
  .get(wardController.getWard)
  .put(wardController.updateWard)
  .delete(wardController.deleteWard);

// Get wards by subcounty
router.route('/subcounty/:subcountyId')
    .get(wardController.getWardsBySubcounty);

export default router;