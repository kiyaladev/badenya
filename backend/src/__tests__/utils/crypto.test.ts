import { generateToken, generateOTP } from '../../utils/crypto';

describe('Crypto Utils', () => {
  describe('generateToken', () => {
    it('should generate a token with default length', () => {
      const token = generateToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes * 2 (hex encoding)
    });

    it('should generate a token with custom length', () => {
      const length = 16;
      const token = generateToken(length);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(length * 2); // bytes * 2 (hex encoding)
    });

    it('should generate different tokens each time', () => {
      const token1 = generateToken();
      const token2 = generateToken();

      expect(token1).not.toBe(token2);
    });

    it('should only contain hex characters', () => {
      const token = generateToken();
      const hexRegex = /^[0-9a-f]+$/;

      expect(hexRegex.test(token)).toBe(true);
    });
  });

  describe('generateOTP', () => {
    it('should generate an OTP with default length', () => {
      const otp = generateOTP();

      expect(otp).toBeDefined();
      expect(typeof otp).toBe('string');
      expect(otp.length).toBe(6);
    });

    it('should generate an OTP with custom length', () => {
      const length = 4;
      const otp = generateOTP(length);

      expect(otp).toBeDefined();
      expect(typeof otp).toBe('string');
      expect(otp.length).toBe(length);
    });

    it('should only contain digits', () => {
      const otp = generateOTP();
      const digitRegex = /^[0-9]+$/;

      expect(digitRegex.test(otp)).toBe(true);
    });

    it('should generate different OTPs each time', () => {
      const otp1 = generateOTP();
      const otp2 = generateOTP();

      // Note: There's a small chance they could be the same,
      // but statistically very unlikely for 6-digit OTPs
      expect(otp1).not.toBe(otp2);
    });

    it('should generate valid numeric OTP', () => {
      const otp = generateOTP();
      const numericValue = parseInt(otp, 10);

      expect(numericValue).toBeGreaterThanOrEqual(0);
      expect(numericValue).toBeLessThan(1000000); // 6 digits max
    });
  });
});
