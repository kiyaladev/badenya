import express from 'express';
import * as aiController from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/v1/groups/:groupId/insights
 * @desc Generate AI insights for a group
 * @access Private
 */
router.post('/groups/:groupId/insights', authenticate, aiController.generateInsights);

/**
 * @route GET /api/v1/groups/:groupId/insights
 * @desc Get insights history for a group
 * @access Private
 */
router.get('/groups/:groupId/insights', authenticate, aiController.getGroupInsights);

/**
 * @route GET /api/v1/insights/:reportId
 * @desc Get a specific insight report
 * @access Private
 */
router.get('/insights/:reportId', authenticate, aiController.getInsightById);

/**
 * @route POST /api/v1/groups/:groupId/anomalies
 * @desc Detect anomalies in group transactions
 * @access Private
 */
router.post('/groups/:groupId/anomalies', authenticate, aiController.detectAnomalies);

/**
 * @route POST /api/v1/groups/:groupId/recommendations
 * @desc Generate personalized recommendations for a group
 * @access Private
 */
router.post('/groups/:groupId/recommendations', authenticate, aiController.generateRecommendations);

/**
 * @route DELETE /api/v1/insights/:reportId
 * @desc Delete an insight report
 * @access Private
 */
router.delete('/insights/:reportId', authenticate, aiController.deleteInsight);

export default router;
