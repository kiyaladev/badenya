import {
  ContactSubmission,
  NewsletterSubscription,
} from "../models/PublicSubmission";
import { Request, Response } from "express";
import logger from "../utils/logger";
import crypto from "crypto";
import {
  sendEmail,
  sendContactConfirmationEmail,
} from "../services/email.service";

// Submit contact form
export const submitContactForm = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;

    // Log the contact submission
    await ContactSubmission.create({ name, email, subject, message });

    // Send confirmation email (non-blocking)
    sendContactConfirmationEmail(email, name, subject).catch((err) => {
      logger.error("Failed to send contact confirmation email:", err);
    });

    res.status(200).json({
      status: "success",
      message: "Message reçu",
    });
  } catch (error) {
    logger.error("Contact form error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible d’envoyer le message",
    });
  }
};

// Subscribe to newsletter
export const subscribeNewsletter = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;

    const normalized = String(email).trim().toLowerCase();
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    // Preserve an existing active subscription and its unsubscribe link.
    const subscribed = await NewsletterSubscription.findOneAndUpdate(
      { email: normalized, active: false },
      {
        $set: {
          active: true,
          consentedAt: new Date(),
          unsubscribeTokenHash: tokenHash,
        },
        $unset: { unsubscribedAt: "" },
      },
      { new: true },
    );
    let created = Boolean(subscribed);
    if (!subscribed) {
      const result = await NewsletterSubscription.updateOne(
        { email: normalized },
        {
          $setOnInsert: {
            email: normalized,
            active: true,
            consentedAt: new Date(),
            unsubscribeTokenHash: tokenHash,
          },
        },
        { upsert: true },
      );
      created = result.upsertedCount > 0;
    }
    if (created) {
      const base = (
        process.env.PUBLIC_SITE_URL ||
        process.env.APP_URL ||
        "https://badenya.naimba.com"
      ).replace(/\/$/, "");
      const url = `${base}/newsletter/unsubscribe?token=${token}`;
      // Registration is persistent even if the optional confirmation cannot be sent.
      await sendEmail({
        to: normalized,
        subject: "Votre inscription à la newsletter Badenya",
        html: `<p>Votre inscription a été enregistrée.</p><p><a href="${url.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}">Se désinscrire</a></p>`,
        text: `Votre inscription a été enregistrée. Pour vous désinscrire : ${url}`,
      });
    }

    res.status(200).json({
      status: "success",
      message: "Inscription enregistrée",
    });
  } catch (error) {
    logger.error("Newsletter subscription error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible de traiter l’inscription",
    });
  }
};

// A bearer capability from the confirmation email; no email address is disclosed.
export const unsubscribeNewsletter = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const hash = crypto
      .createHash("sha256")
      .update(String(req.body.token))
      .digest("hex");
    await NewsletterSubscription.updateOne(
      { unsubscribeTokenHash: hash, active: true },
      {
        $set: { active: false, unsubscribedAt: new Date() },
      },
    );
    // Unknown/already-used tokens share the same idempotent acknowledgement.
    res
      .status(200)
      .json({ status: "success", message: "Demande de désabonnement traitée" });
  } catch (error) {
    logger.error("Newsletter unsubscribe error:", error);
    res.status(500).json({
      status: "error",
      message: "Impossible de traiter le désabonnement",
    });
  }
};
