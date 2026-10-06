/**
 * Validate required environment variables for the mobile app.
 * Logs warnings in development; the API client still has a safe fallback.
 */

interface EnvCheck {
  name: string;
  required: boolean;
}

const envChecks: EnvCheck[] = [
  { name: 'EXPO_PUBLIC_API_URL', required: true },
  { name: 'EXPO_PUBLIC_APP_NAME', required: false },
];

export function validateEnv(): void {
  const missing: string[] = [];

  for (const check of envChecks) {
    // Expo inlines EXPO_PUBLIC_* variables during bundling.
    const values: Record<string, string | undefined> = {
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_APP_NAME: process.env.EXPO_PUBLIC_APP_NAME,
    };
    const value = values[check.name];
    if (check.required && !value) {
      missing.push(check.name);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[Badenya Mobile] Missing env vars: ${missing.join(', ')}. ` +
        'Check your .env.development or .env.production file.'
    );
  }
}
