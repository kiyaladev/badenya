import { activeMember } from "../utils/membership";
import { Request, Response, NextFunction } from "express";
import { Group } from "../models";
import { AuthRequest } from "./auth";
import { requireAuth } from "../utils/typeGuards";

/** Require the authenticated user to be an active member of :groupId. */
export const requireGroupMember = (paramName = "groupId") => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const authReq = req as AuthRequest;
    if (!requireAuth(authReq, res)) return;

    try {
      const group = await Group.findById(req.params[paramName]).select(
        "members isActive archivedAt",
      );
      if (!group) {
        res
          .status(404)
          .json({ status: "error", message: "Groupe introuvable" });
        return;
      }

      const isMember = activeMember(group, authReq.user.id);
      if (!isMember) {
        res.status(403).json({
          status: "error",
          message: "Vous n’êtes pas membre actif de ce groupe",
        });
        return;
      }

      next();
    } catch {
      res.status(500).json({
        status: "error",
        message: "Impossible de vérifier l’accès au groupe",
      });
    }
  };
};
