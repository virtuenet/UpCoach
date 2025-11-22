export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, details?: unknown, isOperational: boolean = true) {
    super(message);

    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string = 'Bad Request', details?: unknown): ApiError {
    return new ApiError(400, message, details);
  }

  static unauthorized(message: string = 'Unauthorized', details?: unknown): ApiError {
    return new ApiError(401, message, details);
  }

  static forbidden(message: string = 'Forbidden', details?: unknown): ApiError {
    return new ApiError(403, message, details);
  }

  static notFound(message: string = 'Not Found', details?: unknown): ApiError {
    return new ApiError(404, message, details);
  }

  static conflict(message: string = 'Conflict', details?: unknown): ApiError {
    return new ApiError(409, message, details);
  }

  static unprocessableEntity(message: string = 'Unprocessable Entity', details?: unknown): ApiError {
    return new ApiError(422, message, details);
  }

  static tooManyRequests(message: string = 'Too Many Requests', details?: unknown): ApiError {
    return new ApiError(429, message, details);
  }

  static internal(message: string = 'Internal Server Error', details?: unknown): ApiError {
    return new ApiError(500, message, details);
  }

  static notImplemented(message: string = 'Not Implemented', details?: unknown): ApiError {
    return new ApiError(501, message, details);
  }

  static serviceUnavailable(message: string = 'Service Unavailable', details?: unknown): ApiError {
    return new ApiError(503, message, details);
  }

  toJSON() {
    return {
      error: this.constructor.name,
      statusCode: this.statusCode,
      message: this.message,
      details: this.details,
      isOperational: this.isOperational,
    };
  }
}
