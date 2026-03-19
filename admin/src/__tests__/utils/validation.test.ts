import { validateField, validateForm, hasErrors, commonRules, patterns } from '../../utils/validation';

describe('validation', () => {
  describe('validateField', () => {
    it('should return error for required empty field', () => {
      const result = validateField('', [{ required: true, message: 'Required' }]);
      expect(result).toBe('Required');
    });

    it('should pass for required non-empty field', () => {
      const result = validateField('test', [{ required: true, message: 'Required' }]);
      expect(result).toBe('');
    });

    it('should validate minLength', () => {
      const result = validateField('ab', [{ minLength: 3, message: 'Too short' }]);
      expect(result).toBe('Too short');
    });

    it('should pass minLength when long enough', () => {
      const result = validateField('abc', [{ minLength: 3, message: 'Too short' }]);
      expect(result).toBe('');
    });

    it('should validate maxLength', () => {
      const result = validateField('abcdef', [{ maxLength: 5, message: 'Too long' }]);
      expect(result).toBe('Too long');
    });

    it('should validate pattern', () => {
      const result = validateField('not-email', [{ pattern: patterns.email, message: 'Invalid email' }]);
      expect(result).toBe('Invalid email');
    });

    it('should pass valid pattern', () => {
      const result = validateField('test@email.com', [{ pattern: patterns.email, message: 'Invalid email' }]);
      expect(result).toBe('');
    });

    it('should validate custom function', () => {
      const result = validateField('abc', [{
        custom: (v) => v === 'xyz',
        message: 'Must be xyz',
      }]);
      expect(result).toBe('Must be xyz');
    });

    it('should return first error message only', () => {
      const result = validateField('', [
        { required: true, message: 'First error' },
        { minLength: 5, message: 'Second error' },
      ]);
      expect(result).toBe('First error');
    });
  });

  describe('validateForm', () => {
    it('should validate all fields in schema', () => {
      const data = { email: '', password: 'short' };
      const schema = {
        email: commonRules.email,
        password: commonRules.password,
      };

      const errors = validateForm(data, schema);
      expect(errors.email).toBe("L'email est requis");
      expect(errors.password).toBe('Le mot de passe doit contenir au moins 8 caractères');
    });

    it('should return empty strings for valid data', () => {
      const data = { email: 'test@email.com', password: 'longpassword123' };
      const schema = {
        email: commonRules.email,
        password: commonRules.password,
      };

      const errors = validateForm(data, schema);
      expect(errors.email).toBe('');
      expect(errors.password).toBe('');
    });
  });

  describe('hasErrors', () => {
    it('should return true when errors exist', () => {
      expect(hasErrors({ email: 'Error', password: '' })).toBe(true);
    });

    it('should return false when no errors', () => {
      expect(hasErrors({ email: '', password: '' })).toBe(false);
    });
  });

  describe('patterns', () => {
    it('should validate emails correctly', () => {
      expect(patterns.email.test('user@example.com')).toBe(true);
      expect(patterns.email.test('invalid-email')).toBe(false);
      expect(patterns.email.test('')).toBe(false);
    });

    it('should validate phone numbers', () => {
      expect(patterns.phone.test('+221701234567')).toBe(true);
      expect(patterns.phone.test('0612345678')).toBe(true);
      expect(patterns.phone.test('123')).toBe(false);
    });
  });
});
