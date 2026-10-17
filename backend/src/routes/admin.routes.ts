import { ContactSubmission, NewsletterSubscription } from '../models/PublicSubmission';
import { param } from 'express-validator';
import { validate } from '../middleware/validation';
import { Router, Request, Response } from 'express';
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

function pagination(query: Record<string, unknown>) {
  const page = Math.max(1, Math.floor(Number(query.page) || 1));
  const limit = Math.min(100, Math.max(1, Math.floor(Number(query.limit) || 20)));
  return { page, limit, skip: (page - 1) * limit };
}
router.get('/contact-submissions', async (req: Request, res: Response) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = ['new', 'handled'].includes(String(req.query.status)) ? { status: String(req.query.status) } : {};
  const [submissions, total] = await Promise.all([
    ContactSubmission.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    ContactSubmission.countDocuments(filter),
  ]);
  res.json({ success: true, data: { submissions, page, limit, total, pages: Math.ceil(total / limit) } });
});
router.put('/contact-submissions/:id/handled', [param('id').isMongoId()], validate, async (req: Request, res: Response) => {
  const submission = await ContactSubmission.findByIdAndUpdate(req.params.id, { $set: { status: 'handled', handledAt: new Date() } }, { new: true });
  if (!submission) { res.status(404).json({ success: false, message: 'Message introuvable' }); return; }
  res.json({ success: true, data: { submission } });
});
router.get('/newsletter-subscriptions', async (req: Request, res: Response) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = req.query.active === 'false' ? { active: false } : { active: true };
  const [subscriptions, total] = await Promise.all([
    NewsletterSubscription.find(filter).select('-unsubscribeTokenHash').sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    NewsletterSubscription.countDocuments(filter),
  ]);
  res.json({ success: true, data: { subscriptions, page, limit, total, pages: Math.ceil(total / limit) } });
});
export default router;
