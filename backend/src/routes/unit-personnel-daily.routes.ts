import express from 'express';
import { 
  getPersonnelByWeek, 
  updatePersonnelForDate, 
  batchUpdatePersonnel 
} from '../controllers/unit-personnel-daily.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get personnel data for a specific week
router.get('/week', authenticateToken, getPersonnelByWeek);

// Update personnel count for a specific unit on a specific date
router.put('/update', authenticateToken, updatePersonnelForDate);

// Batch update personnel for multiple units/dates
router.put('/batch-update', authenticateToken, batchUpdatePersonnel);

export default router; 