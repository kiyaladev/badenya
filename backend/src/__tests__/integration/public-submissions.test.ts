import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../../models';
import { ContactSubmission, NewsletterSubscription } from '../../models/PublicSubmission';
import { submitContactForm, subscribeNewsletter, unsubscribeNewsletter } from '../../controllers/contact.controller';
import adminRoutes from '../../routes/admin.routes';
import { generateAccessToken } from '../../utils/jwt';
import { sendEmail } from '../../services/email.service';
jest.mock('../../services/email.service', () => ({ sendEmail: jest.fn(async () => false), sendContactConfirmationEmail: jest.fn(async () => false) }));
jest.setTimeout(180000);
const app = express(); app.use(express.json());
app.post('/contact', submitContactForm); app.post('/subscribe', subscribeNewsletter); app.post('/unsubscribe', unsubscribeNewsletter); app.use('/admin', adminRoutes);
let mongo: MongoMemoryServer; let adminToken: string; let memberToken: string;
beforeAll(async () => { process.env.JWT_SECRET = 'test-public-secret'; mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 120000 } }); await mongoose.connect(mongo.getUri()); });
afterAll(async () => { await mongoose.disconnect(); await mongo?.stop(); });
beforeEach(async () => {
  await Promise.all([User.deleteMany({}), ContactSubmission.deleteMany({}), NewsletterSubscription.deleteMany({})]); jest.clearAllMocks();
  const admin = await User.create({ fullName: 'Admin', email: 'admin@public.test', password: 'fake', role: 'admin' });
  const member = await User.create({ fullName: 'Member', email: 'member@public.test', password: 'fake', role: 'user' });
  adminToken = generateAccessToken({ id: String(admin._id), email: admin.email }); memberToken = generateAccessToken({ id: String(member._id), email: member.email });
});
it('retains message text even when confirmation email is unavailable and paginates admin access', async () => {
  for (let i = 0; i < 3; i++) expect((await request(app).post('/contact').send({ name: 'Visitor', email: 'visitor@test.com', subject: `Question ${i}`, message: '<script>alert(1)</script> Message important' })).status).toBe(200);
  const page = await request(app).get('/admin/contact-submissions?page=2&limit=2&status=new').set('Authorization', `Bearer ${adminToken}`);
  expect(page.status).toBe(200); expect(page.body.data.total).toBe(3); expect(page.body.data.submissions).toHaveLength(1);
  expect(page.body.data.submissions[0].message).toContain('Message important'); expect((await ContactSubmission.findOne())!.expiresAt.getTime()).toBeGreaterThan(Date.now());
  expect((await request(app).get('/admin/contact-submissions')).status).toBe(401);
  expect((await request(app).get('/admin/contact-submissions').set('Authorization', `Bearer ${memberToken}`)).status).toBe(403);
});
it('allows administrators to mark a message handled and excludes it from the new queue', async () => {
  const contact = await ContactSubmission.create({ name: 'Visitor', email: 'visitor@test.com', subject: 'Help', message: 'Please help with my group' });
  expect((await request(app).put(`/admin/contact-submissions/${contact.id}/handled`).set('Authorization', `Bearer ${memberToken}`)).status).toBe(403);
  expect((await request(app).put(`/admin/contact-submissions/${contact.id}/handled`).set('Authorization', `Bearer ${adminToken}`)).status).toBe(200);
  const list = await request(app).get('/admin/contact-submissions?status=new').set('Authorization', `Bearer ${adminToken}`);
  expect(list.body.data.total).toBe(0); expect((await ContactSubmission.findById(contact.id))?.handledAt).toBeDefined();
});
it('stores one subscription, hides its hash and supports repeat unsubscribe without disclosing the email', async () => {
  expect((await request(app).post('/subscribe').send({ email: 'Newsletter@test.com' })).status).toBe(200);
  expect((await request(app).post('/subscribe').send({ email: 'newsletter@test.com' })).status).toBe(200);
  expect(await NewsletterSubscription.countDocuments()).toBe(1); expect(sendEmail).toHaveBeenCalledTimes(1);
  const message = (sendEmail as jest.Mock).mock.calls[0][0]; const token = message.text.match(/token=([a-f0-9]{64})/)[1];
  const saved = await NewsletterSubscription.findOne().select('+unsubscribeTokenHash'); expect(saved?.unsubscribeTokenHash).toBe(crypto.createHash('sha256').update(token).digest('hex'));
  const listing = await request(app).get('/admin/newsletter-subscriptions?limit=1').set('Authorization', `Bearer ${adminToken}`);
  expect(listing.body.data.subscriptions[0].unsubscribeTokenHash).toBeUndefined(); expect(listing.body.data.total).toBe(1);
  const [first, repeat] = await Promise.all([request(app).post('/unsubscribe').send({ token }), request(app).post('/unsubscribe').send({ token })]);
  expect(first.status).toBe(200); expect(repeat.body).toEqual(first.body); expect((await NewsletterSubscription.findOne())?.active).toBe(false);
});
it('reactivation creates a new token so an old unsubscribe link cannot deactivate the new consent', async () => {
  await request(app).post('/subscribe').send({ email: 'newsletter@test.com' });
  const oldToken = (sendEmail as jest.Mock).mock.calls[0][0].text.match(/token=([a-f0-9]{64})/)[1];
  await request(app).post('/unsubscribe').send({ token: oldToken }); await request(app).post('/subscribe').send({ email: 'newsletter@test.com' });
  await request(app).post('/unsubscribe').send({ token: oldToken }); expect((await NewsletterSubscription.findOne())?.active).toBe(true);
});
