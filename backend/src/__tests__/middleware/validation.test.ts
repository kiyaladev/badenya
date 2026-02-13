import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { validate } from '../../middleware/validation';

// Mock express-validator
jest.mock('express-validator');

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next() when there are no validation errors', () => {
    // Mock validationResult to return empty errors
    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });

    validate(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(statusMock).not.toHaveBeenCalled();
    expect(jsonMock).not.toHaveBeenCalled();
  });

  it('should return 400 error when there are validation errors', () => {
    const mockErrors = [
      { msg: 'Email is required', param: 'email' },
      { msg: 'Password is required', param: 'password' },
    ];

    // Mock validationResult to return errors
    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors,
    });

    validate(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      status: 'error',
      message: 'Validation failed',
      errors: mockErrors,
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should include all validation errors in response', () => {
    const mockErrors = [
      { msg: 'Invalid email format', param: 'email', value: 'notanemail' },
      { msg: 'Password must be at least 8 characters', param: 'password' },
      { msg: 'Name is required', param: 'name' },
    ];

    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors,
    });

    validate(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      status: 'error',
      message: 'Validation failed',
      errors: mockErrors,
    });
  });

  it('should not call next() when validation fails', () => {
    const mockErrors = [{ msg: 'Invalid input', param: 'test' }];

    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors,
    });

    validate(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return error status and message in correct format', () => {
    const mockErrors = [{ msg: 'Test error', param: 'testParam' }];

    (validationResult as unknown as jest.Mock).mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors,
    });

    validate(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Validation failed',
        errors: expect.any(Array),
      })
    );
  });
});
