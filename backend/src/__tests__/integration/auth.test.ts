import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createTestApp } from '../helpers/app';
import { User } from '../../models';
import { hashPassword } from '../../utils/password';

const app = createTestApp();

let mongoServer: MongoMemoryServer;

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    const validUser = {
      fullName: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      password: 'Password123!',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toMatchObject({
        fullName: validUser.fullName,
        email: validUser.email,
        phone: validUser.phone,
      });
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should reject registration with existing email', async () => {
      // Create a user first
      await User.create({
        ...validUser,
        password: await hashPassword(validUser.password),
      });

      // Try to register with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('already exists');
    });

    it('should reject registration with existing phone', async () => {
      // Create a user first
      await User.create({
        fullName: 'Other User',
        email: 'other@example.com',
        phone: validUser.phone,
        password: await hashPassword(validUser.password),
      });

      // Try to register with same phone
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('already exists');
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          // Missing fullName, phone, password
        })
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const userCredentials = {
      email: 'login@example.com',
      phone: '+9876543210',
      password: 'Password123!',
    };

    beforeEach(async () => {
      // Create a test user
      await User.create({
        fullName: 'Login Test User',
        email: userCredentials.email,
        phone: userCredentials.phone,
        password: await hashPassword(userCredentials.password),
        isEmailVerified: true,
      });
    });

    it('should login successfully with email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userCredentials.email,
          password: userCredentials.password,
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user).toMatchObject({
        email: userCredentials.email,
      });
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should login successfully with phone', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userCredentials.phone, // API accepts phone in email field
          password: userCredentials.password,
        })
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'wrong@example.com',
          password: userCredentials.password,
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userCredentials.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userCredentials.email,
          // Missing password
        })
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    let validRefreshToken: string;

    beforeEach(async () => {
      // Register a user to get a valid refresh token
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Refresh Test User',
          email: 'refresh@example.com',
          phone: '+1111111111',
          password: 'Password123!',
        });

      validRefreshToken = response.body.data.tokens.refreshToken;
    });

    it('should refresh tokens successfully with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);

      expect(response.body.status).toBe('error');
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({})
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login to get tokens
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Logout Test User',
          email: 'logout@example.com',
          phone: '+2222222222',
          password: 'Password123!',
        });

      accessToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('should logout successfully with valid tokens', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken,
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Logout successful');
    });

    it('should reject logout without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({
          refreshToken,
        })
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create({
        fullName: 'Forgot Password User',
        email: 'forgot@example.com',
        phone: '+3333333333',
        password: await hashPassword('Password123!'),
      });
    });

    it('should send password reset token for valid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'forgot@example.com',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('reset instructions');

      // Verify token was saved
      const user = await User.findOne({ email: 'forgot@example.com' });
      expect(user?.passwordResetToken).toBeDefined();
      expect(user?.passwordResetExpires).toBeDefined();
    });

    it('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('should reject missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({})
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    let resetToken: string;

    beforeEach(async () => {
      // Create user and initiate password reset
      await User.create({
        fullName: 'Reset Password User',
        email: 'reset@example.com',
        phone: '+4444444444',
        password: await hashPassword('OldPassword123!'),
      });

      // Get reset token
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'reset@example.com',
        });

      const user = await User.findOne({ email: 'reset@example.com' });
      resetToken = user!.passwordResetToken!;
    });

    it('should reset password successfully with valid token', async () => {
      const newPassword = 'NewPassword123!';

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword,
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Password reset successful');

      // Verify password was changed
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'reset@example.com',
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body.status).toBe('success');
    });

    it('should reject invalid reset token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!',
        })
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    it('should reject expired reset token', async () => {
      // Update token to be expired
      await User.findOneAndUpdate(
        { email: 'reset@example.com' },
        { passwordResetExpires: new Date(Date.now() - 1000) }
      );

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPassword123!',
        })
        .expect(400);

      expect(response.body.status).toBe('error');
    });
  });
});
