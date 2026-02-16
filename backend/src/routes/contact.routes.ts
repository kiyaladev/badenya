import { Router } from 'express';
import { body } from 'express-validator';
import { submitContactForm, subscribeNewsletter } from '../controllers/contact.controller';
import { validate } from '../middleware/validation';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for contact form (5 requests per 15 minutes)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many contact requests, please try again later.',
});

// Validation rules
const contactValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 200 }),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
];

const newsletterValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
];

/**
 * @swagger
 * /api/v1/contact:
 *   post:
 *     summary: Submit contact form
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               subject:
 *                 type: string
 *                 example: support
 *               message:
 *                 type: string
 *                 example: I need help with my account
 *     responses:
 *       200:
 *         description: Message received
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/', contactLimiter, contactValidation, validate, submitContactForm);

/**
 * @swagger
 * /api/v1/contact/newsletter:
 *   post:
 *     summary: Subscribe to newsletter
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Subscription successful
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/newsletter', contactLimiter, newsletterValidation, validate, subscribeNewsletter);

export default router;
