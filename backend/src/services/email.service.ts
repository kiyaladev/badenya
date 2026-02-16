import nodemailer from 'nodemailer';
import logger from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create reusable transporter
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    logger.warn('SMTP not configured — emails will be logged but not sent');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

/**
 * Send an email. Falls back to logging when SMTP is not configured.
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const transport = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@badenya.app';

  if (!transport) {
    logger.info(`[Email stub] To: ${options.to} | Subject: ${options.subject}`);
    return true;
  }

  try {
    await transport.sendMail({
      from: `Badenya <${from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info(`Email sent to ${options.to}`);
    return true;
  } catch (error) {
    logger.error('Failed to send email:', error);
    return false;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string,
  userName: string
): Promise<boolean> => {
  const appUrl = process.env.APP_URL || 'https://badenya.app';
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

  return sendEmail({
    to,
    subject: 'Réinitialisation de votre mot de passe — Badenya',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Badenya</h1>
        </div>
        <div style="padding: 32px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827; margin-top: 0;">Bonjour ${userName},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
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
  subject: string
): Promise<boolean> => {
  return sendEmail({
    to,
    subject: 'Nous avons bien reçu votre message — Badenya',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Badenya</h1>
        </div>
        <div style="padding: 32px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #111827; margin-top: 0;">Merci ${name} !</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Nous avons bien reçu votre message concernant <strong>"${subject}"</strong>.
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
