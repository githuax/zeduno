import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAttendance,
  createAttendance,
  clockIn,
  clockOut,
  breakStart,
  breakEnd
} from '../controllers/attendance.controller';

const router = Router();

// Apply authentication to all attendance routes
router.use(authenticate);

// Attendance routes
router.get('/', getAttendance);
router.post('/', authorize('admin', 'manager'), createAttendance);

// Clock actions - staff can clock themselves, managers/admins can clock others
router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.post('/break-start', breakStart);
router.post('/break-end', breakEnd);

export default router;