import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import logger from "../utils/logger";
import { isConfiguredValue } from "../utils/configuredValue";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

type EmailProvider = "smtp" | "sendgrid";

/**
 * Detect which email provider is configured.
 */
const detectProvider = (): EmailProvider | null => {
  if (isConfiguredValue(process.env.SENDGRID_API_KEY)) return "sendgrid";
  if (
    isConfiguredValue(process.env.SMTP_HOST) &&
    isConfiguredValue(process.env.SMTP_USER) &&
    isConfiguredValue(process.env.SMTP_PASSWORD)
  )
    return "smtp";
  return null;
};

export const isEmailConfigured = () => detectProvider() !== null;

// Create reusable transporter
const createTransporter = () => {
  const provider = detectProvider();

  if (provider === "sendgrid") {
    return nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  if (provider === "smtp") {
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  logger.warn(
    "No email provider configured",
  );
  return null;
};

let transporter: Transporter | null = null;
let transportConfiguration = "";
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character] || character));

const getTransporter = () => {
  const configuration = JSON.stringify([process.env.SENDGRID_API_KEY, process.env.SMTP_HOST,
    process.env.SMTP_PORT, process.env.SMTP_USER, process.env.SMTP_PASSWORD]);
  if (!transporter || configuration !== transportConfiguration) {
    transporter?.close();
    transporter = createTransporter();
    transportConfiguration = configuration;
  }
  return transporter;
};

/**
 * Report success only after the configured provider accepts the message.
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const transport = getTransporter();
  const from =
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    "noreply@badenya.app";

  if (!transport) {
    logger.warn("Email was not sent: provider unavailable");
    return false;
  }

  try {
    const result = await transport.sendMail({
      from: `Badenya <${from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    if (Array.isArray(result.rejected) && result.rejected.length > 0) {
      logger.warn("Email provider rejected the recipient");
      return false;
    }
    logger.info(`Email accepted by ${detectProvider()}`);
    return true;
  } catch (error) {
    logger.error("Failed to send email:", error);
    return false;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string,
  userName: string,
): Promise<boolean> => {
  const appUrl = process.env.APP_URL || "https://badenya.naimba.com";
  const resetUrl = `${appUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(resetToken)}`;

  return sendEmail({
    to,
    subject: "Réinitialisation de votre mot de passe — Badenya",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Badenya</h1>
        </div>
        <div style="padding: 32px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827; margin-top: 0;">Bonjour ${escapeHtml(userName)},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${escapeHtml(resetUrl)}" style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Ce lien expirera dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            © Badenya — Gestion financière collaborative
          </p>
        </div>
      </div>
    `,
    text: `Bonjour ${userName},\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nCliquez sur ce lien pour réinitialiser votre mot de passe :\n${resetUrl}\n\nCe lien expirera dans 1 heure.\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\n— Badenya`,
  });
};

/**
 * Send contact form confirmation email
 */
export const sendContactConfirmationEmail = async (
  to: string,
  name: string,
  subject: string,
): Promise<boolean> => {
  return sendEmail({
    to,
    subject: "Nous avons bien reçu votre message — Badenya",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Badenya</h1>
        </div>
        <div style="padding: 32px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827; margin-top: 0;">Merci ${escapeHtml(name)} !</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Nous avons bien reçu votre message concernant <strong>"${escapeHtml(subject)}"</strong>.
            Notre équipe vous répondra dans les plus brefs délais.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            © Badenya — Gestion financière collaborative
          </p>
        </div>
      </div>
    `,
    text: `Merci ${name} !\n\nNous avons bien reçu votre message concernant "${subject}". Notre équipe vous répondra dans les plus brefs délais.\n\n— Badenya`,
  });
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendContactConfirmationEmail,
};
