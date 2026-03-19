import { Router } from 'express';
import { authenticate, isAdmin } from '../middleware/auth';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  suspendUser,
  activateUser,
  getAllGroups,
  getGroupById,
  archiveGroup,
  getAllTransactions,
  flagTransaction,
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, isAdmin);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Users management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/activate', activateUser);

// Groups management
router.get('/groups', getAllGroups);
router.get('/groups/:id', getGroupById);
router.put('/groups/:id/archive', archiveGroup);

// Transactions management
router.get('/transactions', getAllTransactions);
router.put('/transactions/:id/flag', flagTransaction);

export default router;
