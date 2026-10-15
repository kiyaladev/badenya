import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { createTestApp } from '../helpers/app';

describe('Cross-Origin-Resource-Policy', () => {
  const uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'badenya-uploads-'));
  fs.writeFileSync(path.join(uploadDir, 'receipt.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  process.env.UPLOAD_DIR = uploadDir;
  const app = createTestApp();

  afterAll(() => {
    delete process.env.UPLOAD_DIR;
    fs.rmSync(uploadDir, { recursive: true, force: true });
  });

  it('lets other origins embed uploaded files (receipt thumbnails)', async () => {
    const response = await request(app).get('/uploads/receipt.png');
    expect(response.status).toBe(200);
    expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  it('keeps helmet same-origin policy on the API routes', async () => {
    const response = await request(app).get('/api/v1');
    expect(response.headers['cross-origin-resource-policy']).toBe('same-origin');
  });
});
