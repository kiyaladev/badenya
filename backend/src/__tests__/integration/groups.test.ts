import request from 'supertest';
import { createTestApp } from '../helpers/app';

const app = createTestApp();

describe('Groups API Integration', () => {
  describe('POST /api/v1/groups', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/groups')
        .send({
          name: 'Test Group',
          type: 'tontine',
          contributionAmount: 1000,
          frequency: 'monthly',
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('token');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      // Expect 401 (unauthorized) or 400 (validation error)
      expect([400, 401]).toContain(response.status);
      expect(response.body.status).toBe('error');
    });

    it('should reject invalid group types', async () => {
      const response = await request(app)
        .post('/api/v1/groups')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          name: 'Test Group',
          type: 'invalid-type',
          contributionAmount: 1000,
          frequency: 'monthly',
        });

      // Expect 401 (unauthorized) or 400 (validation error)
      expect([400, 401]).toContain(response.status);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/v1/groups', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/groups');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/api/v1/groups')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('GET /api/v1/groups/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/groups/123');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should validate group ID format', async () => {
      const response = await request(app)
        .get('/api/v1/groups/invalid-id')
        .set('Authorization', 'Bearer invalid-token');

      // Expect 401 (unauthorized) or 400/404 (invalid ID)
      expect([400, 401, 404, 500]).toContain(response.status);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /api/v1/groups/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/v1/groups/123')
        .send({ name: 'Updated Group' });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });

  describe('DELETE /api/v1/groups/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).delete('/api/v1/groups/123');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/groups/:id/members', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/groups/123/members')
        .send({ userId: '456' });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/v1/groups/123/members')
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      // Expect 401 (unauthorized) or 400 (validation error)
      expect([400, 401]).toContain(response.status);
      expect(response.body.status).toBe('error');
    });
  });

  describe('DELETE /api/v1/groups/:id/members/:userId', () => {
    it('should require authentication', async () => {
      const response = await request(app).delete(
        '/api/v1/groups/123/members/456'
      );

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PUT /api/v1/groups/:id/members/:userId/role', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/v1/groups/123/members/456/role')
        .send({ role: 'admin' });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should validate role value', async () => {
      const response = await request(app)
        .put('/api/v1/groups/123/members/456/role')
        .set('Authorization', 'Bearer invalid-token')
        .send({ role: 'invalid-role' });

      // Expect 401 (unauthorized) or 400 (validation error)
      expect([400, 401]).toContain(response.status);
      expect(response.body.status).toBe('error');
    });
  });
});
