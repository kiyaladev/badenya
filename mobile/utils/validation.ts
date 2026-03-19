/**
 * Shared form validation utilities for the mobile app.
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
 * Validate a single field. Returns error message or empty string.
 */
export function validateField(value: string, rules: ValidationRule[]): string {
  for (const rule of rules) {
    if (rule.required && !value.trim()) return rule.message;
    if (value && rule.minLength && value.length < rule.minLength) return rule.message;
    if (value && rule.maxLength && value.length > rule.maxLength) return rule.message;
    if (value && rule.pattern && !rule.pattern.test(value)) return rule.message;
    if (value && rule.custom && !rule.custom(value)) return rule.message;
  }
  return '';
}

/**
 * Validate all fields. Returns error map.
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
 * Returns true if any field has an error.
 */
export function hasErrors(errors: Record<string, string>): boolean {
  return Object.values(errors).some((e) => e.length > 0);
}

// Common patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-()]{10,}$/,
};

// Pre-built rules (French labels)
export const rules = {
  email: [
    { required: true, message: 'Email requis' },
    { pattern: patterns.email, message: 'Email invalide' },
  ] as ValidationRule[],
  password: [
    { required: true, message: 'Mot de passe requis' },
    { minLength: 8, message: 'Minimum 8 caractères' },
  ] as ValidationRule[],
  fullName: [
    { required: true, message: 'Nom complet requis' },
    { minLength: 2, message: 'Le nom doit contenir au moins 2 caractères' },
  ] as ValidationRule[],
  phone: [
    { required: true, message: 'Téléphone requis' },
    { pattern: patterns.phone, message: 'Numéro invalide' },
  ] as ValidationRule[],
};

/**
 * Build a confirmPassword rule that checks equality with another field.
 */
export function confirmPasswordRule(password: string): ValidationRule[] {
  return [
    { required: true, message: 'Confirmation requise' },
    {
      custom: (v) => v === password,
      message: 'Les mots de passe ne correspondent pas',
    },
  ];
}
