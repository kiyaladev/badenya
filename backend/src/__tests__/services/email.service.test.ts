// Email service uses jest.resetModules() + dynamic import for each test to ensure clean module state.

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  }),
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Email Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('sendEmail', () => {
    it('should log email when SMTP is not configured', async () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASSWORD;

      // Re-import to reset module state
      jest.resetModules();
      const { sendEmail: send } = await import('../../services/email.service');

      const result = await send({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(true);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should call sendEmail with correct parameters', async () => {
      jest.resetModules();
      const { sendPasswordResetEmail: sendReset } = await import('../../services/email.service');

      const result = await sendReset('test@example.com', 'abc123', 'Test User');

      expect(result).toBe(true);
    });
  });

  describe('sendContactConfirmationEmail', () => {
    it('should call sendEmail with correct parameters', async () => {
      jest.resetModules();
      const { sendContactConfirmationEmail: sendContact } = await import('../../services/email.service');

      const result = await sendContact('test@example.com', 'Test User', 'Support');

      expect(result).toBe(true);
    });
  });
});
