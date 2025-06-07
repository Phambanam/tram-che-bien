import express from 'express';
import { 
  getPersonnelByWeek, 
  updatePersonnelForDate, 
  batchUpdatePersonnel 
} from '../controllers/unit-personnel-daily.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// Get personnel data for a specific week
router.get('/week', protect, getPersonnelByWeek);

// Update personnel count for a specific unit on a specific date
router.put('/update', protect, updatePersonnelForDate);

// Batch update personnel for multiple units/dates
router.put('/batch-update', protect, batchUpdatePersonnel);

export default router; 