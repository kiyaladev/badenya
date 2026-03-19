/**
 * Validate required Vite environment variables at app startup.
 * Call this in main.tsx before rendering.
 */

interface EnvCheck {
  name: string;
  required: boolean;
  default?: string;
}

const envChecks: EnvCheck[] = [
  { name: 'VITE_API_URL', required: true },
  { name: 'VITE_APP_NAME', required: false, default: 'Badenya Admin' },
];

export function validateEnv(): void {
  const missing: string[] = [];

  for (const check of envChecks) {
    const value = import.meta.env[check.name];
    if (check.required && !value) {
      missing.push(check.name);
    }
  }

  if (missing.length > 0 && import.meta.env.PROD) {
    console.error(
      `[Badenya Admin] Missing required env vars: ${missing.join(', ')}. ` +
      'Check your .env file.'
    );
  }

  if (missing.length > 0 && import.meta.env.DEV) {
    console.warn(
      `[Badenya Admin] Missing env vars: ${missing.join(', ')}. Using defaults.`
    );
  }
}
