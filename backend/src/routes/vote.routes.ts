import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createVote,
  getGroupVotes,
  getVote,
  castVote,
  closeVote,
  deleteVote,
} from '../controllers/vote.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/v1/groups/{groupId}/votes:
 *   post:
 *     summary: Create a new vote/poll (Admin only)
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - options
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *                 example: Choose next group activity
 *               description:
 *                 type: string
 *                 example: Vote for our next group activity
 *               options:
 *                 type: array
 *                 minItems: 2
 *                 items:
 *                   type: object
 *                   properties:
 *                     label:
 *                       type: string
 *                       example: Community service
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *                 enum: [simple, quorum, unanimous]
 *                 default: simple
 *               quorumPercentage:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       201:
 *         description: Vote created successfully
 *       403:
 *         description: Forbidden - Admin only
 *   get:
 *     summary: Get all votes in group
 *     tags: [Votes]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, closed]
 *     responses:
 *       200:
 *         description: Votes retrieved successfully
 */

/**
 * @swagger
 * /api/v1/votes/{id}:
 *   get:
 *     summary: Get vote details
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vote ID
 *     responses:
 *       200:
 *         description: Vote retrieved successfully
 *       404:
 *         description: Vote not found
 *   delete:
 *     summary: Delete vote (Creator only, no votes cast)
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vote ID
 *     responses:
 *       200:
 *         description: Vote deleted successfully
 *       403:
 *         description: Forbidden - Cannot delete vote with cast votes
 */

/**
 * @swagger
 * /api/v1/votes/{id}/cast:
 *   post:
 *     summary: Cast vote
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vote ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - optionId
 *             properties:
 *               optionId:
 *                 type: string
 *                 description: ID of the selected option
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vote cast successfully
 *       400:
 *         description: Already voted or vote closed
 */

/**
 * @swagger
 * /api/v1/votes/{id}/close:
 *   put:
 *     summary: Close vote (Admin only)
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vote ID
 *     responses:
 *       200:
 *         description: Vote closed successfully
 *       403:
 *         description: Forbidden - Admin only
 */

// Validation rules
const createVoteValidation = [
  param('groupId').isMongoId().withMessage('Valid group ID is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('options')
    .isArray({ min: 2 })
    .withMessage('At least 2 options are required'),
  body('options.*.label')
    .trim()
    .notEmpty()
    .withMessage('Option label is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('type')
    .optional()
    .isIn(['simple', 'quorum', 'unanimous'])
    .withMessage('Invalid vote type'),
  body('quorumPercentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Quorum percentage must be between 0 and 100'),
];

const castVoteValidation = [
  param('id').isMongoId().withMessage('Valid vote ID is required'),
  body('optionId').trim().notEmpty().withMessage('Option ID is required'),
  body('comment').optional().trim(),
];

const voteIdValidation = [
  param('id').isMongoId().withMessage('Valid vote ID is required'),
];

const groupIdValidation = [
  param('groupId').isMongoId().withMessage('Valid group ID is required'),
];

// Routes
// Create vote in group
router.post(
  '/groups/:groupId/votes',
  authenticate,
  createVoteValidation,
  validate,
  createVote
);

// Get all votes in group
router.get(
  '/groups/:groupId/votes',
  authenticate,
  groupIdValidation,
  validate,
  getGroupVotes
);

// Get vote details
router.get('/votes/:id', authenticate, voteIdValidation, validate, getVote);

// Cast vote
router.post(
  '/votes/:id/cast',
  authenticate,
  castVoteValidation,
  validate,
  castVote
);

// Close vote
router.put(
  '/votes/:id/close',
  authenticate,
  voteIdValidation,
  validate,
  closeVote
);

// Delete vote (creator only, no votes cast)
router.delete(
  '/votes/:id',
  authenticate,
  voteIdValidation,
  validate,
  deleteVote
);

export default router;
