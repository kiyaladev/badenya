import crypto from 'crypto';

/**
 * Generates a cryptographically secure random token in hexadecimal format.
 * 
 * @param length - The number of random bytes to generate (default: 32)
 * 
 * @returns A hexadecimal string token (twice the length of bytes parameter)
 * 
 * @example
 * ```typescript
 * const resetToken = generateToken(); // 64 character hex string
 * const shortToken = generateToken(16); // 32 character hex string
 * ```
 * 
 * @security
 * - Uses Node.js crypto.randomBytes for cryptographic security
 * - Suitable for password reset tokens, API keys, etc.
 */
export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generates a random numeric OTP (One-Time Password).
 * 
 * @param length - The number of digits in the OTP (default: 6)
 * 
 * @returns A string containing only numeric digits
 * 
 * @example
 * ```typescript
 * const otp = generateOTP(); // "123456"
 * const longOTP = generateOTP(8); // "12345678"
 * ```
 * 
 * @security
 * - Uses Math.random() for digit generation
 * - Suitable for low-security OTPs like email verification
 * - For high-security applications, consider using crypto.randomInt()
 */
export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
};
