import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';
import { query } from 'express-validator';

const router = Router();

/**
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @swagger
 * /api/v1/groups/{groupId}/reports/summary:
 *   get:
 *     summary: Get financial summary for a group
 *     tags: [Reports]
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (ISO 8601 format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (ISO 8601 format)
 *     responses:
 *       200:
 *         description: Financial summary retrieved successfully
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalContributions:
 *                           type: number
 *                         totalExpenses:
 *                           type: number
 *                         balance:
 *                           type: number
 *                         transactionCount:
 *                           type: number
 *                         memberActivity:
 *                           type: array
 *                           items:
 *                             type: object
 */

/**
 * @swagger
 * /api/v1/groups/{groupId}/reports/pdf:
 *   get:
 *     summary: Generate PDF report
 *     tags: [Reports]
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: PDF report generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */

/**
 * @swagger
 * /api/v1/groups/{groupId}/reports/excel:
 *   get:
 *     summary: Generate Excel export
 *     tags: [Reports]
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Excel report generated successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */

/**
 * @swagger
 * /api/v1/groups/{groupId}/reports/monthly/{year}/{month}:
 *   get:
 *     summary: Get monthly report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year (e.g., 2025)
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12)
 *     responses:
 *       200:
 *         description: Monthly report retrieved successfully
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
 */

/**
 * GET /groups/:groupId/reports/summary
 * Get financial summary for a group
 */
router.get(
  '/:groupId/reports/summary',
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  ],
  reportController.getGroupSummary
);

/**
 * GET /groups/:groupId/reports/pdf
 * Generate PDF report
 */
router.get(
  '/:groupId/reports/pdf',
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  ],
  reportController.generatePdfReport
);

/**
 * GET /groups/:groupId/reports/excel
 * Generate Excel export
 */
router.get(
  '/:groupId/reports/excel',
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  ],
  reportController.generateExcelReport
);

/**
 * GET /groups/:groupId/reports/monthly/:year/:month
 * Get monthly report
 */
router.get(
  '/:groupId/reports/monthly/:year/:month',
  reportController.getMonthlyReport
);

export default router;
