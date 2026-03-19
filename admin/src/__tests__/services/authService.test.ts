import { getErrorMessage } from '../../utils/errorHandler';
import '@testing-library/jest-dom';

// Test the authService module
jest.mock('../../services/api');

describe('AuthService', () => {
  let authService: typeof import('../../services/authService').default;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should start as not authenticated', async () => {
    authService = (await import('../../services/authService')).default;
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('should set authenticated to true after login', async () => {
    const mockApi = (await import('../../services/api')).default;
    (mockApi.post as jest.Mock).mockResolvedValue({
      data: {
        success: true,
        data: {
          user: { id: '1', email: 'admin@test.com', fullName: 'Admin', role: 'admin' },
          token: 'mock-token',
          refreshToken: 'mock-refresh',
        },
      },
    });

    authService = (await import('../../services/authService')).default;
    await authService.login({ email: 'admin@test.com', password: 'password123' });

    expect(authService.isAuthenticated()).toBe(true);
  });

  it('should set authenticated to false after logout', async () => {
    const mockApi = (await import('../../services/api')).default;
    (mockApi.post as jest.Mock).mockResolvedValue({ data: {} });

    authService = (await import('../../services/authService')).default;
    authService.setAuthenticated(true);
    expect(authService.isAuthenticated()).toBe(true);

    await authService.logout();
    expect(authService.isAuthenticated()).toBe(false);
  });
});

describe('getErrorMessage for auth errors', () => {
  it('should extract message from 401 auth error', () => {
    const error = {
      response: {
        status: 401,
        data: { message: 'Invalid credentials' },
      },
    };
    expect(getErrorMessage(error)).toBe('Invalid credentials');
  });

  it('should extract message from 403 access denied', () => {
    const error = {
      response: {
        status: 403,
        data: { message: 'Access denied. Admin privileges required.' },
      },
    };
    expect(getErrorMessage(error)).toBe('Access denied. Admin privileges required.');
  });
});
