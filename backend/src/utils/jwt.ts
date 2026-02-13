import jwt from 'jsonwebtoken';

/**
 * Payload structure for JWT tokens
 */
interface TokenPayload {
  id: string;
  email: string;
}

/**
 * Generates a JWT access token for user authentication.
 * 
 * @param payload - User information to encode in the token
 * @param payload.id - User's unique identifier
 * @param payload.email - User's email address
 * 
 * @returns JWT access token string
 * 
 * @throws {Error} If JWT_SECRET environment variable is not set
 * 
 * @example
 * ```typescript
 * const token = generateAccessToken({ id: 'user123', email: 'user@example.com' });
 * ```
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn: string = process.env.JWT_EXPIRE || '24h';
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Generates a JWT refresh token for obtaining new access tokens.
 * 
 * @param payload - User information to encode in the token
 * @param payload.id - User's unique identifier
 * @param payload.email - User's email address
 * 
 * @returns JWT refresh token string
 * 
 * @throws {Error} If JWT_REFRESH_SECRET environment variable is not set
 * 
 * @example
 * ```typescript
 * const refreshToken = generateRefreshToken({ id: 'user123', email: 'user@example.com' });
 * ```
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET as string;
  const expiresIn: string = process.env.JWT_REFRESH_EXPIRE || '7d';
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verifies and decodes a JWT refresh token.
 * 
 * @param token - The JWT refresh token to verify
 * 
 * @returns Decoded token payload containing user information
 * 
 * @throws {jwt.JsonWebTokenError} If token is invalid or malformed
 * @throws {jwt.TokenExpiredError} If token has expired
 * @throws {Error} If JWT_REFRESH_SECRET environment variable is not set
 * 
 * @example
 * ```typescript
 * try {
 *   const payload = verifyRefreshToken(refreshToken);
 *   console.log(payload.id, payload.email);
 * } catch (error) {
 *   console.error('Invalid refresh token');
 * }
 * ```
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_REFRESH_SECRET as string;
  return jwt.verify(token, secret) as TokenPayload;
};

/**
 * Generates both access and refresh tokens for a user.
 * 
 * @param payload - User information to encode in the tokens
 * @param payload.id - User's unique identifier
 * @param payload.email - User's email address
 * 
 * @returns Object containing both access and refresh tokens
 * 
 * @throws {Error} If JWT_SECRET or JWT_REFRESH_SECRET environment variables are not set
 * 
 * @example
 * ```typescript
 * const { accessToken, refreshToken } = generateTokens({
 *   id: 'user123',
 *   email: 'user@example.com'
 * });
 * 
 * res.json({ accessToken, refreshToken });
 * ```
 */
export const generateTokens = (
  payload: TokenPayload
): { accessToken: string; refreshToken: string } => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
