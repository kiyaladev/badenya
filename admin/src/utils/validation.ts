/**
 * Shared form validation utilities for the admin panel.
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  message: string;
}

export type ValidationSchema = Record<string, ValidationRule[]>;

/**
 * Validate a single field value against its rules.
 * Returns the first error message, or empty string if valid.
 */
export function validateField(value: string, rules: ValidationRule[]): string {
  for (const rule of rules) {
    if (rule.required && !value.trim()) {
      return rule.message;
    }
    if (rule.minLength && value.length < rule.minLength) {
      return rule.message;
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      return rule.message;
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message;
    }
    if (rule.custom && !rule.custom(value)) {
      return rule.message;
    }
  }
  return '';
}

/**
 * Validate all fields in a form data object against a schema.
 * Returns an object mapping field names to error messages (empty string = valid).
 */
export function validateForm<T extends Record<string, string>>(
  data: T,
  schema: ValidationSchema
): Record<keyof T, string> {
  const errors = {} as Record<keyof T, string>;
  for (const field of Object.keys(schema) as (keyof T)[]) {
    errors[field] = validateField(data[field] || '', schema[field as string]);
  }
  return errors;
}

/**
 * Check if a validation result has any errors.
 */
export function hasErrors(errors: Record<string, string>): boolean {
  return Object.values(errors).some((e) => e.length > 0);
}

// Common validation patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-()]{10,}$/,
  url: /^https?:\/\/.+/,
};

// Pre-built rule sets
export const commonRules = {
  email: [
    { required: true, message: "L'email est requis" },
    { pattern: patterns.email, message: 'Veuillez entrer une adresse email valide' },
  ] as ValidationRule[],
  password: [
    { required: true, message: 'Le mot de passe est requis' },
    { minLength: 8, message: 'Le mot de passe doit contenir au moins 8 caractères' },
  ] as ValidationRule[],
  fullName: [
    { required: true, message: 'Le nom complet est requis' },
    { minLength: 2, message: 'Le nom doit contenir au moins 2 caractères' },
  ] as ValidationRule[],
  phone: [
    { required: true, message: 'Le téléphone est requis' },
    { pattern: patterns.phone, message: 'Numéro de téléphone invalide' },
  ] as ValidationRule[],
};
