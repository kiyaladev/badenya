import express from 'express';
import { param } from 'express-validator';
import * as aiController from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

const groupIdValidation = [
  param('groupId').isMongoId().withMessage('Valid group ID is required'),
];

const reportIdValidation = [
  param('reportId').isMongoId().withMessage('Valid report ID is required'),
];

/**
 * @swagger
 * tags:
 *   name: AI Insights
 *   description: AI-powered financial analysis and recommendations
 */

/**
 * @swagger
 * /api/v1/groups/{groupId}/insights:
 *   post:
 *     summary: Generate AI insights for a group
 *     tags: [AI Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       201:
 *         description: Insights generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     report:
 *                       $ref: '#/components/schemas/AIReport'
 *       404:
 *         description: Group not found
 *       500:
 *         description: AI service error
 */
router.post('/groups/:groupId/insights', authenticate, groupIdValidation, validate, aiController.generateInsights);

/**
 * @swagger
 * /api/v1/groups/{groupId}/insights:
 *   get:
 *     summary: Get insights history for a group
 *     tags: [AI Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of reports to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of reports to skip
 *     responses:
 *       200:
 *         description: Insights history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     reports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AIReport'
 *                     total:
 *                       type: integer
 */
router.get('/groups/:groupId/insights', authenticate, groupIdValidation, validate, aiController.getGroupInsights);

/**
 * @swagger
 * /api/v1/insights/{reportId}:
 *   get:
 *     summary: Get a specific insight report
 *     tags: [AI Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Insight report details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     report:
 *                       $ref: '#/components/schemas/AIReport'
 *       404:
 *         description: Report not found
 */
router.get('/insights/:reportId', authenticate, reportIdValidation, validate, aiController.getInsightById);

/**
 * @swagger
 * /api/v1/groups/{groupId}/anomalies:
 *   post:
 *     summary: Detect anomalies in group transactions
 *     tags: [AI Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       201:
 *         description: Anomaly detection results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     report:
 *                       $ref: '#/components/schemas/AIReport'
 *       404:
 *         description: Group not found
 */
router.post('/groups/:groupId/anomalies', authenticate, groupIdValidation, validate, aiController.detectAnomalies);

/**
 * @swagger
 * /api/v1/groups/{groupId}/recommendations:
 *   post:
 *     summary: Generate personalized recommendations for a group
 *     tags: [AI Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       201:
 *         description: Recommendations generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     report:
 *                       $ref: '#/components/schemas/AIReport'
 *       404:
 *         description: Group not found
 */
router.post('/groups/:groupId/recommendations', authenticate, groupIdValidation, validate, aiController.generateRecommendations);

/**
 * @swagger
 * /api/v1/insights/{reportId}:
 *   delete:
 *     summary: Delete an insight report
 *     tags: [AI Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *       404:
 *         description: Report not found
 */
router.delete('/insights/:reportId', authenticate, reportIdValidation, validate, aiController.deleteInsight);

export default router;
