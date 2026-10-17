/** Cookie options for httpOnly auth tokens (admin panel) */
export const cookieOptions = (maxAgeMs: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.AUTH_COOKIE_SAME_SITE === "none" &&
    process.env.NODE_ENV === "production"
      ? ("none" as const)
      : ("strict" as const),
  path: "/",
  maxAge: maxAgeMs,
});

export const ACCESS_TOKEN_MAX_AGE = 24 * 60 * 60 * 1000; // 24h
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7d
