import { generateAccessToken, generateRefreshToken, verifyRefreshToken, generateTokens } from '../../utils/jwt';

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing';
process.env.JWT_EXPIRE = '1h';
process.env.JWT_REFRESH_EXPIRE = '7d';

describe('JWT Utils', () => {
  const testPayload = {
    id: 'user123',
    email: 'test@example.com',
  };

  describe('generateAccessToken', () => {
    it('should generate an access token', () => {
      const token = generateAccessToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      const payload1 = { id: 'user1', email: 'user1@example.com' };
      const payload2 = { id: 'user2', email: 'user2@example.com' };

      const token1 = generateAccessToken(payload1);
      const token2 = generateAccessToken(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const token = generateRefreshToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      const payload1 = { id: 'user1', email: 'user1@example.com' };
      const payload2 = { id: 'user2', email: 'user2@example.com' };

      const token1 = generateRefreshToken(payload1);
      const token2 = generateRefreshToken(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(testPayload.id);
      expect(decoded.email).toBe(testPayload.email);
    });

    it('should throw an error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        verifyRefreshToken(invalidToken);
      }).toThrow();
    });

    it('should throw an error for tampered token', () => {
      const token = generateRefreshToken(testPayload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      expect(() => {
        verifyRefreshToken(tamperedToken);
      }).toThrow();
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokens(testPayload);

      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should generate different access and refresh tokens', () => {
      const tokens = generateTokens(testPayload);

      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    it('should generate valid tokens that can be verified', () => {
      const tokens = generateTokens(testPayload);
      const decoded = verifyRefreshToken(tokens.refreshToken);

      expect(decoded.id).toBe(testPayload.id);
      expect(decoded.email).toBe(testPayload.email);
    });
  });
});
