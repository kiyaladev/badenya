import logger from './logger';

interface EnvVar {
  name: string;
  required: boolean;
  /** Only required when NODE_ENV matches */
  requiredIn?: string[];
  /** Default value if not set */
  default?: string;
  /** Custom validator */
  validate?: (value: string) => boolean;
  /** Error message on validation failure */
  message?: string;
}

const envSchema: EnvVar[] = [
  // Required in all environments
  { name: 'JWT_SECRET', required: true, message: 'JWT signing secret is required' },
  { name: 'JWT_REFRESH_SECRET', required: true, message: 'JWT refresh secret is required' },

  // Required in production
  { name: 'MONGODB_URI', required: false, requiredIn: ['production'], message: 'MongoDB URI is required in production' },
  { name: 'CORS_ORIGIN', required: false, requiredIn: ['production'], message: 'CORS origin must be set in production' },

  // Optional with defaults
  { name: 'PORT', required: false, default: '5000' },
  { name: 'NODE_ENV', required: false, default: 'development' },
  { name: 'JWT_EXPIRE', required: false, default: '24h' },
  { name: 'JWT_REFRESH_EXPIRE', required: false, default: '7d' },

  // Optional services (warn if missing)
  { name: 'SMTP_HOST', required: false },
  { name: 'SMTP_PORT', required: false, validate: (v) => !isNaN(parseInt(v, 10)), message: 'SMTP_PORT must be a number' },
  { name: 'SMTP_USER', required: false },
  { name: 'SMTP_PASSWORD', required: false },

  // Firebase (optional)
  { name: 'FIREBASE_PROJECT_ID', required: false },
  { name: 'FIREBASE_CLIENT_EMAIL', required: false },
  { name: 'FIREBASE_PRIVATE_KEY', required: false },

  // AI (optional)
  { name: 'GEMINI_API_KEY', required: false },
];

/**
 * Validate environment variables at startup.
 * Fails fast for missing required vars. Logs warnings for optional ones.
 */
export function validateEnv(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const def of envSchema) {
    const value = process.env[def.name];

    // Apply default
    if (!value && def.default) {
      process.env[def.name] = def.default;
    }

    // Check required
    const isRequired = def.required || (def.requiredIn && def.requiredIn.includes(nodeEnv));
    if (isRequired && !value) {
      errors.push(def.message || `Missing required env var: ${def.name}`);
      continue;
    }

    // Run custom validator
    if (value && def.validate && !def.validate(value)) {
      errors.push(def.message || `Invalid value for ${def.name}`);
    }
  }

  // Warn about optional service groups
  const smtpVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];
  if (smtpVars.some((v) => process.env[v]) && !smtpVars.every((v) => process.env[v])) {
    warnings.push('Partial SMTP config detected — set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD together');
  }

  const firebaseVars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
  if (
    !process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    firebaseVars.some((v) => process.env[v]) &&
    !firebaseVars.every((v) => process.env[v])
  ) {
    warnings.push('Partial Firebase config — set all three: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  }

  // Output warnings
  for (const warning of warnings) {
    logger.warn(`⚠️  ${warning}`);
  }

  // Fail fast on errors
  if (errors.length > 0) {
    for (const error of errors) {
      logger.error(`❌ ${error}`);
    }
    logger.error(`Environment validation failed with ${errors.length} error(s). Exiting.`);
    process.exit(1);
  }

  logger.info('✅ Environment variables validated');
}
