import { Request, Response } from 'express';
import logger from '../utils/logger';
import { sendContactConfirmationEmail } from '../services/email.service';

// Submit contact form
export const submitContactForm = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;

    // Log the contact submission
    logger.info('Contact form submitted', { name, email, subject, messageLength: message.length });

    // Send confirmation email (non-blocking)
    sendContactConfirmationEmail(email, name, subject).catch((err) => {
      logger.error('Failed to send contact confirmation email:', err);
    });

    res.status(200).json({
      status: 'success',
      message: 'Message received successfully',
    });
  } catch (error) {
    logger.error('Contact form error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process contact form',
    });
  }
};

// Subscribe to newsletter
export const subscribeNewsletter = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    // Log the subscription
    logger.info('Newsletter subscription', { email });

    res.status(200).json({
      status: 'success',
      message: 'Subscription successful',
    });
  } catch (error) {
    logger.error('Newsletter subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process subscription',
    });
  }
};
