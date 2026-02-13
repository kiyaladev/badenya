/**
 * Utility function to extract error message from various error types
 *
 * @param error - The error object (can be any type)
 * @param defaultMessage - Default message if error message cannot be extracted
 * @returns Extracted error message string
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage = 'Une erreur est survenue'
): string {
  // Check if it's an axios error with response data
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'message' in error.response.data &&
    typeof error.response.data.message === 'string'
  ) {
    return error.response.data.message;
  }

  // Check if it's an Error instance
  if (error instanceof Error) {
    return error.message;
  }

  // Check if it's an object with a message property
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  // Return default message
  return defaultMessage;
}
