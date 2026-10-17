import fs from 'fs';
import os from 'os';
import path from 'path';
import { createSwaggerSpec } from '../../config/swagger';

describe('Swagger release contracts', () => {
  it('discovers compiled routes in a dist-only release and uses canonical public model fields', () => {
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'badenya-swagger-'));
    const originalDirectory = process.cwd();
    const apiUrl = process.env.API_URL;
    try {
      delete process.env.API_URL;
      const runtimeRoot = path.join(temporary, 'dist');
      fs.mkdirSync(path.join(runtimeRoot, 'routes'), { recursive: true });
      // The fixture is compiled JavaScript with retained route documentation, without any src tree.
      fs.writeFileSync(path.join(runtimeRoot, 'routes', 'auth.routes.js'), `
/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     responses:
 *       200:
 *         description: Current user
 */
router.get('/me', authenticate, getCurrentUser);
router.post('/reset-password', validate, resetPassword);
`);
      fs.writeFileSync(path.join(runtimeRoot, 'routes', 'group.routes.js'), "router.get('/:id/tontine',getSchedule);\nrouter.post('/join',join);");
      process.chdir(temporary);
      const spec = createSwaggerSpec(runtimeRoot);
      expect(fs.existsSync(path.join(temporary, 'src'))).toBe(false);
      expect(spec.paths['/api/v1/auth/me'].get).toBeDefined();
      expect(spec.paths['/api/v1/auth/reset-password'].post).toBeDefined();
      expect(spec.paths['/api/v1/groups/{id}/tontine'].get).toBeDefined();
      expect(spec.servers[0].url).toBe('https://badenya-api.naimba.com');
      const schemas = spec.components.schemas as Record<string, { properties: Record<string, { enum?: unknown[]; properties?: Record<string, unknown> }> }>;
      expect(schemas.User.properties.fullName).toBeDefined();
      expect(schemas.User.properties.firstName).toBeUndefined();
      expect(schemas.User.properties.password).toBeUndefined();
      expect(schemas.User.properties.passwordResetToken).toBeUndefined();
      expect(schemas.Group.properties.type.enum).toEqual(['tontine', 'association', 'family', 'friends', 'project']);
      expect(schemas.Group.properties.contributionSettings.properties?.frequency).toBeDefined();
      expect(schemas.Transaction.properties.type.enum).toEqual(['contribution', 'expense', 'refund', 'adjustment']);
      expect(schemas.Transaction.properties.initiatedBy).toBeDefined();
      expect(schemas.Proposal.properties.proposedBy).toBeDefined();
      expect(schemas.Proposal.properties.votingDeadline).toBeDefined();
      expect(schemas.Proposal.properties.status.enum).toContain('executed');
      expect(schemas.Notification.properties.isRead).toBeDefined();
      expect(schemas.Notification.properties.priority.enum).toEqual(['low', 'normal', 'high']);
    } finally {
      process.chdir(originalDirectory);
      if (apiUrl === undefined) delete process.env.API_URL; else process.env.API_URL = apiUrl;
      fs.rmSync(temporary, { recursive: true, force: true });
    }
  });
});
