import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { auditLogger } from '../utils/audit-logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class ValidationError extends Error implements AppError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  isOperational = true;

  constructor(message: string, public details?: any[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error implements AppError {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';
  isOperational = true;

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements AppError {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';
  isOperational = true;

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  code = 'NOT_FOUND';
  isOperational = true;

  constructor(resource: string = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error implements AppError {
  statusCode = 429;
  code = 'RATE_LIMIT_EXCEEDED';
  isOperational = true;

  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends Error implements AppError {
  statusCode = 502;
  code = 'EXTERNAL_SERVICE_ERROR';
  isOperational = true;

  constructor(service: string, message?: string) {
    super(message || `${service} service unavailable`);
    this.name = 'ExternalServiceError';
  }
}

// Error handler middleware
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';
  let details: any = null;

  // Handle different error types
  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
  } else if (error instanceof ValidationError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
    details = error.details;
  } else if (error instanceof AuthenticationError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
  } else if (error instanceof AuthorizationError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
  } else if (error instanceof NotFoundError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
  } else if (error instanceof RateLimitError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
  } else if (error instanceof ExternalServiceError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
  } else if (error instanceof AppError && error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'CUSTOM_ERROR';
  }

  // Log error for debugging (but don't expose sensitive info)
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    statusCode,
    error: {
      name: error.name,
      message: error.message,
      code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    user: (req as any).user?.id,
    organization: (req as any).user?.organizationId,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  };

  // Log to console in development, structured logging in production
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', logData);
  } else {
    console.error(JSON.stringify(logData));
  }

  // Create audit log for security-relevant errors
  if (statusCode >= 400 && statusCode < 500) {
    auditLogger.log({
      action: 'error',
      resource: 'api',
      resourceId: req.originalUrl,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode,
      success: false,
      error: message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
      organizationId: (req as any).user?.organizationId
    }).catch(err => console.error('Failed to create audit log:', err));
  }

  // Send error response
  const response: any = {
    error: message,
    code
  };

  if (details) {
    response.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Not found handler
export function notFoundHandler(req: Request, res: Response) {
  const error = new NotFoundError('Endpoint');
  res.status(404).json({
    error: error.message,
    code: error.code,
    path: req.originalUrl
  });
} 