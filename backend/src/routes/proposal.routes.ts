import { Router } from 'express';
import { body } from 'express-validator';
import {
  createProposal,
  getGroupProposals,
  getProposalById,
  castVote,
  closeProposal,
  executeProposal,
} from '../controllers/proposal.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/groups/{groupId}/proposals:
 *   post:
 *     summary: Create a new proposal (Admin only)
 *     tags: [Proposals]
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
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 example: Purchase new equipment
 *               description:
 *                 type: string
 *                 example: Proposal to purchase new farming equipment
 *               category:
 *                 type: string
 *                 enum: [loan, investment, charity, event, emergency, other]
 *                 example: investment
 *               amount:
 *                 type: number
 *                 minimum: 0
 *                 example: 100000
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *     responses:
 *       201:
 *         description: Proposal created successfully
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
 *                     proposal:
 *                       $ref: '#/components/schemas/Proposal'
 *       403:
 *         description: Forbidden - Admin only
 *   get:
 *     summary: Get group proposals
 *     tags: [Proposals]
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
 *           enum: [active, approved, rejected, expired]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Proposals retrieved successfully
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
 *                     proposals:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Proposal'
 */

/**
 * @swagger
 * /api/v1/proposals/{id}:
 *   get:
 *     summary: Get proposal by ID
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Proposal ID
 *     responses:
 *       200:
 *         description: Proposal retrieved successfully
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
 *                     proposal:
 *                       $ref: '#/components/schemas/Proposal'
 *       404:
 *         description: Proposal not found
 */

/**
 * @swagger
 * /api/v1/proposals/{id}/vote:
 *   post:
 *     summary: Cast vote on proposal
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Proposal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vote
 *             properties:
 *               vote:
 *                 type: string
 *                 enum: [for, against, abstain]
 *                 example: for
 *               comment:
 *                 type: string
 *                 example: I support this proposal
 *     responses:
 *       200:
 *         description: Vote cast successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Vote cast successfully
 *       400:
 *         description: Already voted or proposal closed
 */

/**
 * @swagger
 * /api/v1/proposals/{id}/close:
 *   put:
 *     summary: Close proposal voting (Admin only)
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Proposal ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proposal closed successfully
 *       403:
 *         description: Forbidden - Admin only
 */

/**
 * @swagger
 * /api/v1/proposals/{id}/execute:
 *   post:
 *     summary: Execute approved proposal (Admin only)
 *     tags: [Proposals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Proposal ID
 *     responses:
 *       200:
 *         description: Proposal executed successfully
 *       400:
 *         description: Proposal not approved
 *       403:
 *         description: Forbidden - Admin only
 */

// Validation rules
const createProposalValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category')
    .isIn(['loan', 'investment', 'charity', 'event', 'emergency', 'other'])
    .withMessage('Invalid category'),
  body('amount')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
];

const castVoteValidation = [
  body('vote')
    .isIn(['for', 'against', 'abstain'])
    .withMessage('Invalid vote value'),
  body('comment').optional().trim(),
];

const closeProposalValidation = [
  body('notes').optional().trim(),
];

// Routes
router.post(
  '/groups/:groupId/proposals',
  createProposalValidation,
  validate,
  createProposal
);
router.get('/groups/:groupId/proposals', getGroupProposals);
router.get('/proposals/:id', getProposalById);
router.post('/proposals/:id/vote', castVoteValidation, validate, castVote);
router.put('/proposals/:id/close', closeProposalValidation, validate, closeProposal);
router.post('/proposals/:id/execute', executeProposal);

export default router;
