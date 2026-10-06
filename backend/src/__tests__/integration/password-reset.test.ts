import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../../models';
import { forgotPassword, resetPassword, login } from '../../controllers/auth.controller';
import { authenticate } from '../../middleware/auth';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateTokens } from '../../utils/jwt';
import { isEmailConfigured, sendPasswordResetEmail } from '../../services/email.service';
jest.mock('../../services/email.service', () => ({ isEmailConfigured: jest.fn(), sendPasswordResetEmail: jest.fn() }));

jest.setTimeout(180000);
const app = express(); app.use(express.json());
app.post('/forgot', forgotPassword); app.post('/reset', resetPassword); app.post('/login', login);
app.get('/private', authenticate, (_req, res) => { res.sendStatus(200); });
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
let database: MongoMemoryServer;
beforeAll(async () => {
  process.env.JWT_SECRET = 'test-reset-secret'; process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  database = await MongoMemoryServer.create({ instance: { launchTimeout: 120000 } }); await mongoose.connect(database.getUri());
});
afterAll(async () => { await mongoose.disconnect(); await database?.stop(); });
beforeEach(async () => { await User.deleteMany({}); jest.clearAllMocks(); (isEmailConfigured as jest.Mock).mockReturnValue(true); });
async function account() { return User.create({ fullName: 'Reset Test', email: 'reset@test.com', password: await hashPassword('OldPassword123'), isActive: true }); }

it('responds identically for missing transport without looking up known versus unknown email', async () => {
  await account(); (isEmailConfigured as jest.Mock).mockReturnValue(false);
  const known = await request(app).post('/forgot').send({ email: 'reset@test.com' });
  const unknown = await request(app).post('/forgot').send({ email: 'unknown@test.com' });
  expect(known.status).toBe(503); expect(unknown.status).toBe(503); expect(known.body).toEqual(unknown.body);
  expect(sendPasswordResetEmail).not.toHaveBeenCalled(); expect((await User.findOne())?.passwordResetToken).toBeUndefined();
});
it('awaits sending, stores only a digest and invalidates a failed-send token', async () => {
  await account(); (sendPasswordResetEmail as jest.Mock).mockResolvedValueOnce(true);
  expect((await request(app).post('/forgot').send({ email: 'RESET@test.com' })).status).toBe(200);
  const rawToken = (sendPasswordResetEmail as jest.Mock).mock.calls[0][1];
  expect((await User.findOne())?.passwordResetToken).toBe(hashToken(rawToken));
  (sendPasswordResetEmail as jest.Mock).mockResolvedValueOnce(false);
  const failedSend = await request(app).post('/forgot').send({ email: 'reset@test.com' });
  const unknown = await request(app).post('/forgot').send({ email: 'unknown@test.com' });
  expect(failedSend.status).toBe(200); expect(failedSend.body).toEqual(unknown.body);
  expect((await User.findOne())?.passwordResetToken).toBeUndefined();
});
it('consumes a token once under concurrent resets and revokes old sessions immediately', async () => {
  const user = await account();
  const oldTokens = generateTokens({ id: String(user._id), email: user.email, sessionVersion: user.sessionVersion || 0 });
  const token = crypto.randomBytes(32).toString('hex');
  await User.updateOne({ _id: user._id }, { $set: { passwordResetToken: hashToken(token), passwordResetExpires: new Date(Date.now() + 60000) } });
  const responses = await Promise.all([request(app).post('/reset').send({ token, newPassword: 'NewPassword123' }), request(app).post('/reset').send({ token, newPassword: 'OtherPassword123' })]);
  expect(responses.map(r => r.status).sort()).toEqual([200, 400]);
  const saved = await User.findById(user._id); expect(saved?.passwordResetToken).toBeUndefined(); expect(saved?.refreshTokens).toHaveLength(0);
  expect((await request(app).get('/private').set('Authorization', `Bearer ${oldTokens.accessToken}`)).status).toBe(401);
  const chosen = responses[0].status === 200 ? 'NewPassword123' : 'OtherPassword123'; expect(await comparePassword(chosen, saved!.password)).toBe(true);
  const signedIn = await request(app).post('/login').send({ email: user.email, password: chosen }); expect(signedIn.status).toBe(200);
  expect((await request(app).get('/private').set('Authorization', `Bearer ${signedIn.body.data.tokens.accessToken}`)).status).toBe(200);
});
it('rejects expired tokens and inactive accounts without changing the password', async () => {
  const user = await account(); const token = crypto.randomBytes(32).toString('hex');
  await User.updateOne({ _id: user._id }, { $set: { passwordResetToken: hashToken(token), passwordResetExpires: new Date(Date.now() - 1000) } });
  expect((await request(app).post('/reset').send({ token, newPassword: 'NewPassword123' })).status).toBe(400);
  await User.updateOne({ _id: user._id }, { $set: { isActive: false, passwordResetExpires: new Date(Date.now() + 60000) } });
  expect((await request(app).post('/reset').send({ token, newPassword: 'NewPassword123' })).status).toBe(400);
  expect(await comparePassword('OldPassword123', (await User.findById(user._id))!.password)).toBe(true);
});
