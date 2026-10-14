import { capabilities } from '../services/capabilities.service';
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import groupRoutes from './group.routes';
import transactionRoutes from './transaction.routes';
import proposalRoutes from './proposal.routes';
import notificationRoutes from './notification.routes';
import reportRoutes from './report.routes';
import contactRoutes from './contact.routes';
import aiRoutes from './ai.routes';
import adminRoutes from './admin.routes';
import uploadRoutes from './upload.routes';

const router = Router();

router.get('/capabilities', (_req,res) => {res.json({status:'success',data:capabilities()});});
router.use('/contact', contactRoutes);
// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/groups', groupRoutes);
router.use('/admin', adminRoutes);
router.use('/uploads', uploadRoutes);
router.use('/', transactionRoutes); // Transaction routes include /groups/:groupId/transactions
router.use('/', proposalRoutes); // Proposal routes include /groups/:groupId/proposals
router.use('/notifications', notificationRoutes);
router.use('/groups', reportRoutes); // Report routes: /groups/:groupId/reports/*
router.use('/', aiRoutes); // AI routes: /groups/:groupId/insights, /insights/:id, etc.

export default router;
