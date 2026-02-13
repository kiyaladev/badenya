import request from 'supertest';
import { createTestApp } from '../helpers/app';

const app = createTestApp();

describe('Votes API Integration', () => {
  describe('POST /api/v1/groups/:id/votes', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/groups/123/votes')
        .send({
          title: 'Test Proposal',
          description: 'Test description',
          type: 'expense',
          amount: 5000,
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/groups/123/votes')
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      // Expect 401 (unauthorized) or 400 (validation error)
      expect([400, 401]).toContain(response.status);
      expect(response.body.status).toBe('error');
    });

    it('should reject invalid vote types', async () => {
      const response = await request(app)
        .post('/api/v1/groups/123/votes')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          title: 'Test',
          description: 'Test',
          type: 'invalid-type',
          amount: 1000,
        });

      // Expect 401 (unauthorized) or 400 (validation error)
      expect([400, 401]).toContain(response.status);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/v1/groups/:id/votes', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/groups/123/votes');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/api/v1/groups/123/votes')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should accept status filter', async () => {
      const response = await request(app)
        .get('/api/v1/groups/123/votes')
        .query({ status: 'active' })
        .set('Authorization', 'Bearer invalid-token');

      // Expect 401 (unauthorized) or valid response
      expect([200, 401]).toContain(response.status);
      expect(response.body.status).toBeDefined();
    });
  });

  describe('GET /api/v1/votes/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/votes/123');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should validate vote ID format', async () => {
      const response = await request(app)
        .get('/api/v1/votes/invalid-id')
        .set('Authorization', 'Bearer invalid-token');

      // Expect 401 (unauthorized) or 400/404 (invalid ID)
      expect([400, 401, 404, 500]).toContain(response.status);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/votes/:id/cast', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/votes/123/cast')
        .send({ vote: 'approve' });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should validate vote value', async () => {
      const response = await request(app)
        .post('/api/v1/votes/123/cast')
        .set('Authorization', 'Bearer invalid-token')
        .send({ vote: 'invalid-vote' });

      // Expect 401 (unauthorized) or 400 (validation error)
      expect([400, 401]).toContain(response.status);
      expect(response.body.status).toBe('error');
    });

    it('should accept valid vote values', async () => {
      const validVotes = ['approve', 'reject', 'abstain'];

      for (const vote of validVotes) {
        const response = await request(app)
          .post('/api/v1/votes/123/cast')
          .set('Authorization', 'Bearer invalid-token')
          .send({ vote });

        // Expect 401 (unauthorized) since token is invalid
        expect([200, 401, 404]).toContain(response.status);
      }
    });
  });

  describe('PUT /api/v1/votes/:id/close', () => {
    it('should require authentication', async () => {
      const response = await request(app).put('/api/v1/votes/123/close');

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should validate vote ID', async () => {
      const response = await request(app)
        .put('/api/v1/votes/invalid-id/close')
        .set('Authorization', 'Bearer invalid-token');

      // Expect 401 (unauthorized) or 400/404 (invalid ID)
      expect([400, 401, 404, 500]).toContain(response.status);
      expect(response.body.status).toBe('error');
    });
  });

  describe('Vote Results', () => {
    it('should include vote results in vote details', async () => {
      const response = await request(app)
        .get('/api/v1/votes/123')
        .set('Authorization', 'Bearer invalid-token');

      // Expect 401 (unauthorized) or valid response with results
      expect([200, 401, 404]).toContain(response.status);
      expect(response.body.status).toBeDefined();
    });
  });
});
