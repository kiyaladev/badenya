import rateLimit from "express-rate-limit";

const isTestEnvironment = process.env.NODE_ENV === "test";

/**
 * Stricter rate limiter for authentication endpoints
 * to prevent brute force attacks.
 *
 * Limits: 5 attempts per 15 minutes per IP
 * Successful requests are not counted towards the limit
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTestEnvironment ? 1000 : 5, // keep production limit strict; avoid cross-test pollution
  message:
    "Too many authentication attempts from this IP, please try again after 15 minutes.",
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Rate limiter for password reset endpoints
 * to prevent abuse.
 *
 * Limits: 3 attempts per hour per IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isTestEnvironment ? 1000 : 3, // keep production limit strict; avoid cross-test pollution
  message: "Too many password reset attempts, please try again after an hour.",
  standardHeaders: true,
  legacyHeaders: false,
});
