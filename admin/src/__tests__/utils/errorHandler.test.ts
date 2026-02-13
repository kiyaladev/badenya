import { getErrorMessage } from '../../utils/errorHandler';

describe('errorHandler', () => {
  describe('getErrorMessage', () => {
    it('should extract message from Error instance', () => {
      const error = new Error('Test error message');
      const result = getErrorMessage(error);
      expect(result).toBe('Test error message');
    });

    it('should extract message from Axios-like error', () => {
      const error = {
        response: {
          data: {
            message: 'API error message',
          },
        },
      };
      const result = getErrorMessage(error);
      expect(result).toBe('API error message');
    });

    it('should return default message for unknown error', () => {
      const error = 'string error';
      const result = getErrorMessage(error);
      expect(result).toBe('An unknown error occurred');
    });

    it('should return default message for null', () => {
      const result = getErrorMessage(null);
      expect(result).toBe('An unknown error occurred');
    });

    it('should return default message for undefined', () => {
      const result = getErrorMessage(undefined);
      expect(result).toBe('An unknown error occurred');
    });

    it('should handle error object without response', () => {
      const error = { someProperty: 'value' };
      const result = getErrorMessage(error);
      expect(result).toBe('An unknown error occurred');
    });

    it('should handle error with response but no data', () => {
      const error = {
        response: {
          status: 404,
        },
      };
      const result = getErrorMessage(error);
      expect(result).toBe('An unknown error occurred');
    });

    it('should handle error with response.data but no message', () => {
      const error = {
        response: {
          data: {
            error: 'Some error',
          },
        },
      };
      const result = getErrorMessage(error);
      expect(result).toBe('An unknown error occurred');
    });
  });
});
