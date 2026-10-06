const sendMail = jest.fn();
jest.mock('nodemailer', () => ({ createTransport: jest.fn(() => ({ sendMail, close: jest.fn() })) }));
jest.mock('../../utils/logger', () => ({ __esModule: true, default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));
import { sendEmail, sendPasswordResetEmail, isEmailConfigured } from '../../services/email.service';

describe('Email delivery', () => {
  const originalEnv = { ...process.env };
  beforeEach(() => {
    process.env = { ...originalEnv }; delete process.env.SENDGRID_API_KEY;
    delete process.env.SMTP_HOST; delete process.env.SMTP_USER; delete process.env.SMTP_PASSWORD;
    sendMail.mockReset();
  });
  afterAll(() => { process.env = originalEnv; });
  const configured = () => { process.env.SMTP_HOST = 'smtp.test'; process.env.SMTP_USER = 'test'; process.env.SMTP_PASSWORD = 'test-password'; };
  it('reports unavailable transport without pretending delivery succeeded', async () => {
    expect(isEmailConfigured()).toBe(false);
    expect(await sendEmail({ to: 'user@test.com', subject: 'test', html: 'test' })).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });
  it('awaits successful provider acceptance', async () => {
    configured(); sendMail.mockResolvedValue({ accepted: ['user@test.com'], rejected: [] });
    expect(await sendEmail({ to: 'user@test.com', subject: 'test', html: 'test' })).toBe(true);
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'user@test.com' }));
  });
  it('does not advertise or dispatch email with documentation placeholders', async () => {
    for (const field of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD']) {
      configured();
      process.env[field] = field === 'SMTP_HOST' ? 'smtp.example.com' : 'YOUR_SMTP_VALUE';
      expect(isEmailConfigured()).toBe(false);
      expect(await sendEmail({ to: 'user@test.com', subject: 'test', html: 'test' })).toBe(false);
    }
    delete process.env.SMTP_HOST;
    process.env.SENDGRID_API_KEY = 'your-sendgrid-key';
    expect(isEmailConfigured()).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });
  it('uses configured SMTP when the SendGrid value is only an example', async () => {
    configured(); process.env.SENDGRID_API_KEY = 'YOUR_SENDGRID_KEY';
    sendMail.mockResolvedValue({ accepted: ['user@test.com'] });
    expect(isEmailConfigured()).toBe(true);
    expect(await sendEmail({ to: 'user@test.com', subject: 'test', html: 'test' })).toBe(true);
  });
  it('reports connection failure and recipient rejection', async () => {
    configured(); sendMail.mockRejectedValueOnce(new Error('SMTP disconnected'));
    expect(await sendEmail({ to: 'user@test.com', subject: 'test', html: 'test' })).toBe(false);
    sendMail.mockResolvedValueOnce({ rejected: ['user@test.com'] });
    expect(await sendEmail({ to: 'user@test.com', subject: 'test', html: 'test' })).toBe(false);
  });
  it('escapes user supplied markup and links to the configured reset screen', async () => {
    configured(); process.env.APP_URL = 'https://badenya.naimba.com/'; sendMail.mockResolvedValue({ accepted: ['user@test.com'] });
    await sendPasswordResetEmail('user@test.com', 'abc&123', '<img src=x onerror=alert(1)>');
    const message = sendMail.mock.calls[0][0];
    expect(message.html).toContain('&lt;img'); expect(message.html).not.toContain('<img');
    expect(message.text).toContain('https://badenya.naimba.com/reset-password?token=abc%26123');
  });
});
