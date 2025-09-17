import express from 'express';
import * as wardController from '../controllers/ward.controller';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

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