import { createApp } from '../../index';
export function createTestApp() {
  process.env.JWT_SECRET ||= 'test-jwt-secret';process.env.JWT_REFRESH_SECRET ||= 'test-jwt-refresh-secret';
  return createApp();
}
