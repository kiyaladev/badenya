import { Router } from 'express';
import { query } from 'express-validator';
import { searchUsers, getUserStats } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/v1/users/search:
 *   get:
 *     summary: Search users by name, email, or phone
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (name, email, or phone)
 *     responses:
 *       200:
 *         description: Users found
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

const searchValidation = [
  query('q')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters'),
];

router.get('/search', authenticate, searchValidation, validate, searchUsers);

/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     summary: Get current user stats (contributions, votes)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User stats
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
 *                     totalContributions:
 *                       type: number
 *                     totalVotes:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authenticate, getUserStats);

export default router;
