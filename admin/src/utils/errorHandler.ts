/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response: unknown }).response;
    if (response && typeof response === 'object' && 'data' in response) {
      const data = (response as { data: unknown }).data;
      if (data && typeof data === 'object' && 'message' in data) {
        return String((data as { message: unknown }).message);
      }
    }
  }
  
  return 'An unknown error occurred';
}
