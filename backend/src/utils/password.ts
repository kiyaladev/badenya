import bcrypt from 'bcryptjs';

/**
 * Hashes a plain text password using bcrypt.
 * 
 * @param password - The plain text password to hash
 * 
 * @returns Promise that resolves to the hashed password string
 * 
 * @throws {Error} If bcrypt hashing fails
 * 
 * @example
 * ```typescript
 * const hashedPassword = await hashPassword('mySecurePassword123');
 * // Store hashedPassword in database
 * ```
 * 
 * @security
 * - Uses bcrypt with 10 salt rounds for secure password hashing
 * - Each hash is unique due to automatic salt generation
 * - Resistant to rainbow table attacks
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compares a plain text password with a hashed password.
 * 
 * @param password - The plain text password to verify
 * @param hash - The hashed password to compare against
 * 
 * @returns Promise that resolves to true if passwords match, false otherwise
 * 
 * @throws {Error} If bcrypt comparison fails
 * 
 * @example
 * ```typescript
 * const isValid = await comparePassword('userInput123', storedHashedPassword);
 * if (isValid) {
 *   console.log('Login successful');
 * } else {
 *   console.log('Invalid password');
 * }
 * ```
 * 
 * @security
 * - Uses constant-time comparison to prevent timing attacks
 * - Automatically handles salt extraction from hashed password
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
