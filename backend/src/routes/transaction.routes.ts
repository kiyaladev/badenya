import { Router } from 'express';
import { body } from 'express-validator';
import {
  createTransaction,
  getGroupTransactions,
  getTransactionById,
  verifyTransaction,
  cancelTransaction,
} from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/groups/{groupId}/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
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
 *               - type
 *               - amount
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [contribution, expense, refund, adjustment]
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, mobile_money, bank_transfer, card]
 *     responses:
 *       201:
 *         description: Transaction created successfully
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
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Group not found
 *   get:
 *     summary: Get group transactions
 *     tags: [Transactions]
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
 *           enum: [pending, completed, failed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [contribution, expense, refund, adjustment]
 *         description: Filter by type
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
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
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 */

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
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
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transaction not found
 */

/**
 * @swagger
 * /api/v1/transactions/{id}/verify:
 *   put:
 *     summary: Verify transaction (Treasurer/Admin)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
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
 *         description: Transaction verified successfully
 *       403:
 *         description: Forbidden - Treasurer/Admin only
 */

/**
 * @swagger
 * /api/v1/transactions/{id}:
 *   delete:
 *     summary: Cancel transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction cancelled successfully
 *       403:
 *         description: Forbidden
 */

// Validation rules
const createTransactionValidation = [
  body('type')
    .isIn(['contribution', 'expense', 'refund', 'adjustment'])
    .withMessage('Invalid transaction type'),
  body('amount')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('description').optional().trim(),
  body('category').optional().trim(),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'mobile_money', 'bank_transfer', 'card'])
    .withMessage('Invalid payment method'),
];

const verifyTransactionValidation = [
  body('notes').optional().trim(),
];

const cancelTransactionValidation = [
  body('reason').optional().trim(),
];

// Routes
router.post(
  '/groups/:groupId/transactions',
  createTransactionValidation,
  validate,
  createTransaction
);
router.get('/groups/:groupId/transactions', getGroupTransactions);
router.get('/transactions/:id', getTransactionById);
router.put(
  '/transactions/:id/verify',
  verifyTransactionValidation,
  validate,
  verifyTransaction
);
router.delete(
  '/transactions/:id',
  cancelTransactionValidation,
  validate,
  cancelTransaction
);

export default router;
