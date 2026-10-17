import { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimiter";

const router = Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 example: +221701234567
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123!
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Validation rules
const registerValidation = [
  body("fullName").trim().notEmpty().withMessage("Le nom complet est requis"),
  body("email").isEmail().withMessage("Une adresse email valide est requise"),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Le numéro de téléphone est requis"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères"),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("L’adresse email ou le téléphone est requis"),
  body("password").notEmpty().withMessage("Le mot de passe est requis"),
];

const refreshTokenValidation = [
  body("refreshToken")
    .optional()
    .isString()
    .notEmpty()
    .withMessage(
      "Le jeton de renouvellement doit être une chaîne de caractères",
    ),
];

const forgotPasswordValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Une adresse email valide est requise"),
];

const resetPasswordValidation = [
  body("token")
    .isString()
    .isLength({ min: 32, max: 256 })
    .withMessage("Un lien de réinitialisation valide est requis"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
    .withMessage(
      "Le mot de passe doit contenir une majuscule, une minuscule et un chiffre",
    ),
];

const updateProfileValidation = [
  body("fullName").optional().trim().notEmpty(),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Une adresse email valide est requise"),
  body("phone").optional().trim().notEmpty(),
  body("avatar").optional(),
];

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email or phone number
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Le mot de passe actuel est requis"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Le nouveau mot de passe doit contenir au moins 8 caractères"),
];

// Public routes (with rate limiting)
router.post("/register", authLimiter, registerValidation, validate, register);
router.post("/login", authLimiter, loginValidation, validate, login);
router.post(
  "/refresh-token",
  authLimiter,
  refreshTokenValidation,
  validate,
  refreshToken,
);
router.post(
  "/forgot-password",
  passwordResetLimiter,
  forgotPasswordValidation,
  validate,
  forgotPassword,
);
router.post(
  "/reset-password",
  passwordResetLimiter,
  resetPasswordValidation,
  validate,
  resetPassword,
);

// Protected routes
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getCurrentUser);
router.put(
  "/profile",
  authenticate,
  authLimiter,
  updateProfileValidation,
  validate,
  updateProfile,
);
router.put(
  "/change-password",
  authenticate,
  authLimiter,
  changePasswordValidation,
  validate,
  changePassword,
);
router.delete("/account", authenticate, deleteAccount);

export default router;
