import { Request, Response, NextFunction } from 'express';
import {
  isAuthenticatedRequest,
  requireAuth,
  getAuthUser,
  ensureAuth,
  withAuth,
} from '../../utils/authHelpers';
import { IUser } from '../../models/User';

// Mock user object
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  fullName: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890',
} as unknown as IUser;

describe('Auth Helpers', () => {
  describe('isAuthenticatedRequest', () => {
    it('should return true when user is present in request', () => {
      const req = { user: mockUser } as unknown as Request;
      expect(isAuthenticatedRequest(req)).toBe(true);
    });

    it('should return false when user is not present', () => {
      const req = {} as unknown as Request;
      expect(isAuthenticatedRequest(req)).toBe(false);
    });

    it('should return false when user is null', () => {
      const req = { user: null } as unknown as Request;
      expect(isAuthenticatedRequest(req)).toBe(false);
    });

    it('should return false when user is undefined', () => {
      const req = { user: undefined } as unknown as Request;
      expect(isAuthenticatedRequest(req)).toBe(false);
    });
  });

  describe('requireAuth', () => {
    let mockRes: Partial<Response>;
    let mockJson: jest.Mock;

    beforeEach(() => {
      mockJson = jest.fn();
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: mockJson,
      };
    });

    it('should not throw when user is authenticated', () => {
      const req = { user: mockUser } as unknown as Request;
      
      expect(() => {
        requireAuth(req, mockRes as Response);
      }).not.toThrow();

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });

    it('should send 401 and throw when user is not authenticated', () => {
      const req = {} as unknown as Request;
      
      expect(() => {
        requireAuth(req, mockRes as Response);
      }).toThrow('Unauthorized');

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Authentication required' });
    });
  });

  describe('getAuthUser', () => {
    let mockRes: Partial<Response>;
    let mockJson: jest.Mock;

    beforeEach(() => {
      mockJson = jest.fn();
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: mockJson,
      };
    });

    it('should return user when authenticated', () => {
      const req = { user: mockUser } as unknown as Request;
      
      const user = getAuthUser(req, mockRes as Response);
      
      expect(user).toEqual(mockUser);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should throw when user is not authenticated', () => {
      const req = {} as unknown as Request;
      
      expect(() => {
        getAuthUser(req, mockRes as Response);
      }).toThrow('Unauthorized');

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('ensureAuth', () => {
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    let mockJson: jest.Mock;

    beforeEach(() => {
      mockJson = jest.fn();
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: mockJson,
      };
      mockNext = jest.fn();
    });

    it('should call next when user is authenticated', () => {
      const req = { user: mockUser } as unknown as Request;
      
      ensureAuth(req, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockJson).not.toHaveBeenCalled();
    });

    it('should send 401 and not call next when user is not authenticated', () => {
      const req = {} as unknown as Request;
      
      ensureAuth(req, mockRes as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Authentication required' });
    });
  });

  describe('withAuth', () => {
    let mockRes: Partial<Response>;
    let mockJson: jest.Mock;

    beforeEach(() => {
      mockJson = jest.fn();
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: mockJson,
      };
    });

    it('should call handler when user is authenticated', async () => {
      const req = { user: mockUser } as unknown as Request;
      const mockHandler = jest.fn();
      
      const wrappedHandler = withAuth(mockHandler);
      await wrappedHandler(req, mockRes as Response);
      
      expect(mockHandler).toHaveBeenCalledWith(req, mockRes);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should send 401 when user is not authenticated', async () => {
      const req = {} as unknown as Request;
      const mockHandler = jest.fn();
      
      const wrappedHandler = withAuth(mockHandler);
      await wrappedHandler(req, mockRes as Response);
      
      expect(mockHandler).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Authentication required' });
    });

    it('should handle async handlers', async () => {
      const req = { user: mockUser } as unknown as Request;
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      
      const wrappedHandler = withAuth(mockHandler);
      await wrappedHandler(req, mockRes as Response);
      
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should handle sync handlers', async () => {
      const req = { user: mockUser } as unknown as Request;
      const mockHandler = jest.fn();
      
      const wrappedHandler = withAuth(mockHandler);
      await wrappedHandler(req, mockRes as Response);
      
      expect(mockHandler).toHaveBeenCalled();
    });
  });
});
