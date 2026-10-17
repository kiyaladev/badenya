import {
  getSchedule,
  putSchedule,
  payout,
  nextCycle,
  getCycleHistory,
} from "../controllers/tontine.controller";
import {
  discover,
  join,
  listJoinRequests,
  decideJoinRequest,
  invitationCode,
} from "../controllers/community.controller";
import { Router } from "express";
import { body, param } from "express-validator";
import {
  createGroup,
  getUserGroups,
  getGroupById,
  updateGroup,
  archiveGroup,
  addMember,
  removeMember,
  updateMemberRole,
} from "../controllers/group.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: Family Savings
 *               description:
 *                 type: string
 *                 example: Monthly family savings group
 *               type:
 *                 type: string
 *                 enum: [tontine, association, family, friends, project]
 *                 example: tontine
 *               contributionAmount:
 *                 type: number
 *                 example: 10000
 *               frequency:
 *                 type: string
 *                 enum: [weekly, monthly, custom]
 *                 example: monthly
 *     responses:
 *       201:
 *         description: Group created successfully
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
 *                     group:
 *                       $ref: '#/components/schemas/Group'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: Get user's groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Groups retrieved successfully
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
 *                     groups:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Group'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/groups/{id}:
 *   get:
 *     summary: Get group by ID
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group retrieved successfully
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
 *                     group:
 *                       $ref: '#/components/schemas/Group'
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Group updated successfully
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
 *                     group:
 *                       $ref: '#/components/schemas/Group'
 *       403:
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Archive group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group archived successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/v1/groups/{id}/members:
 *   post:
 *     summary: Add member to group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, treasurer, member]
 *                 default: member
 *     responses:
 *       200:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Forbidden - Admin/Treasurer only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Validation rules
const configurationValidation = [
  body("description").optional().isString().isLength({ max: 500 }),
  body("settings").optional().isObject(),
  ...["isPrivate", "requireApprovalToJoin", "allowMemberProposals"].map((key) =>
    body(`settings.${key}`).optional().isBoolean(),
  ),
  body("settings.maxMembers").optional().isInt({ min: 1, max: 5000 }),
  body("settings.maxProposalsPerMonth").optional().isInt({ min: 1, max: 1000 }),
  body("contributionSettings").optional().isObject(),
  body("contributionSettings.frequency")
    .optional()
    .isIn(["daily", "weekly", "monthly", "custom"]),
  body("contributionSettings.amount")
    .optional()
    .isFloat({ min: 0, max: 1000000000000 }),
  body("contributionSettings.dueDay").optional().isInt({ min: 1, max: 31 }),
  body("contributionSettings.customIntervalDays")
    .optional()
    .isInt({ min: 1, max: 3650 }),
  body("contributionSettings.firstDueAt").optional().isISO8601(),
  body("contributionSettings.nextDueAt").not().exists(),
  body("contributionSettings.autoReminder").optional().isBoolean(),
  body("votingRules").optional().isObject(),
  body("votingRules.quorum").optional().isFloat({ min: 0, max: 100 }),
  body("votingRules.approvalThreshold")
    .optional()
    .isFloat({ min: 0, max: 100 }),
  body("votingRules.votingDuration").optional().isInt({ min: 1, max: 8760 }),
  body("votingRules.allowAbstention").optional().isBoolean(),
];
const createGroupValidation = [
  ...configurationValidation,
  body("currency")
    .optional()
    .isIn(["XOF", "XAF", "EUR", "USD", "GNF", "CDF", "MAD"]),
  body("name")
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Le nom du groupe est requis"),
  body("type")
    .isIn(["tontine", "association", "family", "friends", "project"])
    .withMessage("Type de groupe invalide"),
];

const updateGroupValidation = [
  ...configurationValidation,
  body("name").optional().isString().trim().isLength({ min: 1, max: 100 }),

  body("type")
    .optional()
    .isIn(["tontine", "association", "family", "friends", "project"])
    .withMessage("Type de groupe invalide"),
  body("avatar")
    .optional()
    .custom(
      (value) =>
        typeof value === "object" &&
        value !== null &&
        typeof value.url === "string" &&
        /^https?:\/\//.test(value.url),
    ),
];

const addMemberValidation = [
  body("userId").isMongoId().withMessage("L’identifiant du compte est requis"),
  body("role")
    .optional()
    .isIn(["admin", "treasurer", "member"])
    .withMessage("Rôle invalide"),
];

const updateMemberRoleValidation = [
  body("role")
    .isIn(["admin", "treasurer", "member"])
    .withMessage("Rôle invalide"),
];

router.param("id", (_req, res, next, id) => {
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    res
      .status(400)
      .json({ status: "error", message: "Identifiant de groupe invalide" });
    return;
  }
  next();
});
// Routes
router.get("/:id/tontine", getSchedule);
router.get("/:id/tontine/history", getCycleHistory);
router.put("/:id/tontine", putSchedule);
router.post("/:id/tontine/payout", payout);
router.post("/:id/tontine/next-cycle", nextCycle);
router.get("/discover", discover);
router.post(
  "/join",
  body("code")
    .isString()
    .bail()
    .trim()
    .toLowerCase()
    .matches(/^[a-f0-9]{24}$/),
  validate,
  join,
);
router.post("/:id/join", join);
router.get("/:id/invitation-code", invitationCode);
router.get("/:id/join-requests", listJoinRequests);
router.post(
  "/:id/join-requests/:requestId/approve",
  param("requestId").isMongoId(),
  validate,
  decideJoinRequest,
);
router.post(
  "/:id/join-requests/:requestId/reject",
  param("requestId").isMongoId(),
  validate,
  decideJoinRequest,
);
router.post("/", createGroupValidation, validate, createGroup);
router.get("/", getUserGroups);
router.get("/:id", getGroupById);
router.put("/:id", updateGroupValidation, validate, updateGroup);
router.delete("/:id", archiveGroup);
router.post("/:id/members", addMemberValidation, validate, addMember);
router.delete(
  "/:id/members/:userId",
  param("userId").isMongoId(),
  validate,
  removeMember,
);
router.put(
  "/:id/members/:userId/role",
  param("userId").isMongoId(),
  updateMemberRoleValidation,
  validate,
  updateMemberRole,
);

export default router;
