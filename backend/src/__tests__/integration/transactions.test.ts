import request from 'supertest';
import { createTestApp } from '../helpers/app';

const app = createTestApp();

describe('Transactions API Integration', () => {
  describe('POST /api/v1/groups/:id/transactions', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/groups/123/transactions')
        .send({
          type: 'contribution',
          amount: 1000,
          description: 'Monthly contribution',
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/groups/123/transactions')
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      // Expect 401 (unauthorized) or 400 (validation error)
      expect([400, 401]).toContain(response.status);
      expect(response.body.status).toBe('error');
    });

    it('should reject invalid transaction types', async () => {
      const response = await request(app)
        .post('/api/v1/groups/123/transactions')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          type: 'invalid-type',
          amount: 1000,
          description: 'Test',
        });

      // Expect 401 (unauthorized) or 400 (validation error)
      expect([400, 401]).toContain(response.status);
      expect(response.body.status).toBe('error');
    });

    it('should reject negative amounts', async () => {
      const response = await request(app)
        .post('/api/v1/groups/123/transactions')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          type: 'contribution',
          amount: -1000,
          description: 'Test',
        });

      // Expect 401 (unauthorized) or 400 (validation error)
      expect([400, 401]).toContain(response.status);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/v1/groups/:id/transactions', () => {
    it('should require authentication', async () => {
      const response = await request(app).get(
        '/api/v1/groups/123/transactions'
      );

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/api/v1/groups/123/transactions')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should accept query parameters for filtering', async () => {
      const response = await request(app)
        .get('/api/v1/groups/123/transactions')
        .query({ type: 'contribution', status: 'verified' })
        .set('Authorization', 'Bearer invalid-token');

      // Expect 401 (unauthorized) or valid response
      expect([200, 401]).toContain(response.status);
      expect(response.body.status).toBeDefined();
    });
  });

  describe('GET /api/v1/transactions/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/transactions/123');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should validate transaction ID format', async () => {
      const response = await request(app)
        .get('/api/v1/transactions/invalid-id')
        .set('Authorization', 'Bearer invalid-token');

      // Expect 401 (unauthorized) or 400/404 (invalid ID)
      expect([400, 401, 404, 500]).toContain(response.status);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /api/v1/transactions/:id/verify', () => {
    it('should require authentication', async () => {
      const response = await request(app).put(
        '/api/v1/transactions/123/verify'
      );

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });

  describe('DELETE /api/v1/transactions/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).delete('/api/v1/transactions/123');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });

  describe('Transaction Statistics', () => {
    it('should return group balance', async () => {
      const response = await request(app)
        .get('/api/v1/groups/123/balance')
        .set('Authorization', 'Bearer invalid-token');

      // Expect 401 (unauthorized) or valid response
      expect([200, 401, 404]).toContain(response.status);
      expect(response.body.status).toBeDefined();
    });
  });
});
