import { Router } from 'express';
import authRoutes from './auth.routes';
import groupRoutes from './group.routes';
import transactionRoutes from './transaction.routes';
import proposalRoutes from './proposal.routes';
import voteRoutes from './vote.routes';
import notificationRoutes from './notification.routes';
import reportRoutes from './report.routes';
import aiRoutes from './ai.routes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/groups', groupRoutes);
router.use('/', transactionRoutes); // Transaction routes include /groups/:groupId/transactions
router.use('/', proposalRoutes); // Proposal routes include /groups/:groupId/proposals
router.use('/', voteRoutes); // Vote routes include /groups/:groupId/votes and /votes/:id
router.use('/notifications', notificationRoutes);
router.use('/groups', reportRoutes); // Report routes: /groups/:groupId/reports/*
router.use('/', aiRoutes); // AI routes: /groups/:groupId/insights, /insights/:id, etc.

export default router;
