/**
 * Validate required environment variables for the mobile app.
 * Logs warnings in __DEV__ mode; does not crash the app.
 */

interface EnvCheck {
  name: string;
  required: boolean;
}

const envChecks: EnvCheck[] = [
  { name: 'API_URL', required: true },
  { name: 'APP_NAME', required: false },
];

export function validateEnv(): void {
  const missing: string[] = [];

  for (const check of envChecks) {
    // React Native dotenv exposes vars via process.env
    const value = process.env[check.name];
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
