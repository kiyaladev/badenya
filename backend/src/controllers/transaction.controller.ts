import {createHash} from "crypto";
import {
  validateFinancialTransaction,
  BusinessError,
} from "../services/financial.service";
import { activeMember, entityId } from "../utils/membership";
import { Request, Response } from "express";
import { Transaction, Group } from "../models";
import { AuthRequest } from "../middleware/auth";
import { requireAuth } from "../utils/typeGuards";
import logger from "../utils/logger";

function requestFingerprint(body: Record<string,unknown>): string {
 const normalized:Record<string,unknown>={...body,amount:Number(body.amount)};delete normalized.idempotencyKey;
 function canonical(value:unknown):unknown {if(Array.isArray(value))return value.map(canonical);if(value && typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,canonical(item)]));return value;}
 return createHash('sha256').update(JSON.stringify(canonical(normalized))).digest('hex');
}
// Create new transaction
export const createTransaction = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { groupId } = req.params;
    const {
      type,
      amount,
      description,
      category,
      paymentMethod,
      paymentDetails,
      metadata,
      attachments,
    } = req.body;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);

    if (!group || !group.isActive || group.archivedAt) {
      res.status(404).json({
        status: "error",
        message: "Group not found",
      });
      return;
    }

    const isMember = group.members.some(
      (m) => entityId(m.userId) === authReq.user.id && m.status === "active",
    );

    if (!isMember) {
      res.status(403).json({
        status: "error",
        message: "You are not a member of this group",
      });
      return;
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      res
        .status(400)
        .json({ status: "error", message: "Montant positif requis" });
      return;
    }
    const key = req.get("Idempotency-Key") || req.body.idempotencyKey;
    if(key && (typeof key!=='string' || key.length>200)){res.status(400).json({status:'error',message:'Clé de réessai invalide'});return;}
    const fingerprint=requestFingerprint(req.body);
    if (key) {
      const existing = await Transaction.findOne({
        groupId,
        initiatedBy: authReq.user.id,
        idempotencyKey: key,
      });
      if (existing) {
        if (existing.requestFingerprint !== fingerprint) {
          res
            .status(409)
            .json({
              status: "error",
              message: "Clé déjà utilisée pour une autre opération",
            });
          return;
        }
        res
          .status(200)
          .json({ status: "success", data: { transaction: existing } });
        return;
      }
    }
    // Create transaction
    const transaction = await Transaction.create({
      groupId,
      initiatedBy: authReq.user.id,
      type,
      amount,
      currency: group.currency,
      recipient: req.body.recipient,
      idempotencyKey: key,
      requestFingerprint: fingerprint,
      description,
      category,
      paymentMethod: {
        type: paymentMethod || "cash",
        provider: paymentDetails?.provider,
        reference: paymentDetails?.reference,
      },
      status: "pending",
      metadata: {notes: typeof metadata?.notes === "string" ? metadata.notes.slice(0,500) : undefined},
      attachments: attachments || [],
    });

    await transaction.populate("initiatedBy", "fullName email avatar");
    await transaction.populate("groupId", "name type");

    res.status(201).json({
      status: "success",
      message: "Transaction created successfully",
      data: { transaction },
    });
  } catch (error) {
    if(error && typeof error==='object' && 'code' in error && error.code===11000){
     const authReq=req as AuthRequest;const existing=await Transaction.findOne({groupId:req.params.groupId,initiatedBy:authReq.user?.id,idempotencyKey:req.get('Idempotency-Key') || req.body.idempotencyKey});
     if(existing?.requestFingerprint===requestFingerprint(req.body)){res.status(200).json({status:'success',data:{transaction:existing}});return;}
     res.status(409).json({status:'error',message:'Clé déjà utilisée'});return;
    }
    logger.error("Create transaction error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create transaction",
    });
  }
};

// Get all transactions for a group
export const getGroupTransactions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  return getMyTransactions(req, res);
};
export const getMyTransactions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!requireAuth(authReq, res)) return;
  try {
    const requested = String(req.params.groupId || req.query.groupId || "");
    const groups = await Group.find({
      members: { $elemMatch: { userId: authReq.user.id, status: "active" } },
      isActive: true,
      archivedAt: { $exists: false },
    }).select("_id");
    if (requested && !groups.some((g) => entityId(g._id) === requested)) {
      res.status(403).json({ status: "error", message: "Groupe inaccessible" });
      return;
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const skip =
      req.query.skip !== undefined
        ? Math.max(0, Number(req.query.skip) || 0)
        : (page - 1) * limit;
    const filter: Record<string, unknown> = {
      groupId: requested || { $in: groups.map((g) => g._id) },
    };
    if (req.query.type) filter.type = String(req.query.type);
    if (req.query.status) filter.status = String(req.query.status);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("initiatedBy", "fullName email avatar")
        .populate("groupId", "name type currency")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);
    res.json({
      status: "success",
      data: {
        transactions,
        total,
        count: transactions.length,
        page: Math.floor(skip / limit) + 1,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    logger.error("List transactions:", error);
    res.status(500).json({ status: "error", message: "Échec du chargement" });
  }
};

// Get transaction by ID
export const getTransactionById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;
    const { id } = req.params;

    const transaction = await Transaction.findById(id)
      .populate("initiatedBy", "fullName email avatar phone")
      .populate("groupId", "name type");

    if (!transaction) {
      res.status(404).json({
        status: "error",
        message: "Transaction not found",
      });
      return;
    }

    // Check if user is a member of the group
    const group = await Group.findById(transaction.groupId);

    if (!group || !group.isActive || group.archivedAt) {
      res.status(404).json({
        status: "error",
        message: "Group not found",
      });
      return;
    }

    const isMember = group.members.some(
      (m) => entityId(m.userId) === authReq.user.id && m.status === "active",
    );

    if (!isMember) {
      res.status(403).json({
        status: "error",
        message: "You are not a member of this group",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: { transaction },
    });
  } catch (error) {
    logger.error("Get transaction error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get transaction",
    });
  }
};

// Verify/Complete transaction (admin/treasurer only)
export const verifyTransaction = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!requireAuth(authReq, res)) return;
  try {
    const transaction = await validateFinancialTransaction(
      String(req.params.id),
      authReq.user.id,
      req.body.notes,
    );
    await transaction.populate("initiatedBy", "fullName email avatar");
    res.status(200).json({ status: "success", data: { transaction } });
  } catch (error) {
    if (error instanceof BusinessError) {
      res
        .status(error.status)
        .json({ status: "error", code: error.code, message: error.message });
      return;
    }
    logger.error("Verify transaction error:", error);
    res.status(500).json({ status: "error", message: "Échec de validation" });
  }
};

// Cancel transaction
export const cancelTransaction = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!requireAuth(authReq, res)) return;
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      res
        .status(404)
        .json({ status: "error", message: "Opération introuvable" });
      return;
    }
    const group = await Group.findById(transaction.groupId);
    const member = activeMember(group, authReq.user.id);
    if (
      !member ||
      (entityId(transaction.initiatedBy) !== authReq.user.id &&
        !["admin", "treasurer"].includes(member.role))
    ) {
      res
        .status(403)
        .json({ status: "error", message: "Membre autorisé actif requis" });
      return;
    }
    const cancelled = await Transaction.findOneAndUpdate(
      { _id: transaction._id, status: "pending" },
      {
        $set: {
          status: "cancelled",
          "metadata.notes": String(req.body.reason || "").slice(0, 500),
        },
      },
      { new: true },
    );
    if (!cancelled) {
      res
        .status(409)
        .json({
          status: "error",
          message: "Seule une opération en attente peut être annulée",
        });
      return;
    }
    res.json({ status: "success", data: { transaction: cancelled } });
  } catch (error) {
    logger.error("Cancel transaction:", error);
    res.status(500).json({ status: "error", message: "Échec de l’annulation" });
  }
};
