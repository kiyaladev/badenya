import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export const validate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      status: "error",
      message: "Données invalides",
      errors: errors
        .array()
        .map((error) => ({
          ...error,
          msg: error.msg === "Invalid value" ? "Valeur invalide" : error.msg,
        })),
    });
    return;
  }

  next();
};
