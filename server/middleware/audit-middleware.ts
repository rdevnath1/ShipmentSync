import { Request, Response, NextFunction } from 'express';
import { auditLogger } from '../utils/audit-logger';
import { ErrorHandler } from '../utils/error-handler';

declare module 'express' {
  interface Request {
    auditContext?: {
      startTime: number;
      action: string;
      resource?: string;
      resourceId?: string;
    };
  }
}

export function createAuditMiddleware(action: string, resource?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set up audit context
    req.auditContext = {
      startTime: Date.now(),
      action,
      resource,
      resourceId: req.params.id || req.params.trackingNumber || undefined,
    };

    // Store original json method
    const originalJson = res.json;
    let responseData: any;

    // Override json method to capture response data
    res.json = function(data) {
      responseData = data;
      return originalJson.call(this, data);
    };

    // Override end method to log after response
    const originalEnd = res.end;
    res.end = function(...args) {
      const result = originalEnd.apply(this, args as any);
      
      // Log the audit entry
      setTimeout(async () => {
        if (req.auditContext) {
          const user = (req as any).user;
          const duration = Date.now() - req.auditContext.startTime;
          
          await auditLogger.log({
            organizationId: user?.organizationId,
            userId: user?.id,
            action: req.auditContext.action,
            resource: req.auditContext.resource,
            resourceId: req.auditContext.resourceId,
            method: req.method,
            endpoint: req.originalUrl,
            requestData: req.body,
            responseData: responseData,
            statusCode: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 400,
            error: res.statusCode >= 400 ? responseData?.error || 'Unknown error' : undefined,
            duration,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get('User-Agent'),
          });
        }
      }, 0);
      
      return result;
    };

    next();
  };
}

export function errorHandlerMiddleware() {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    const standardizedError = ErrorHandler.standardizeError(err, req.originalUrl);
    
    // Log error
    console.error(`${standardizedError.code} ${req.method} ${req.originalUrl}:`, {
      error: standardizedError.message,
      carrierCode: standardizedError.carrierCode,
      details: standardizedError.details,
      timestamp: standardizedError.timestamp,
    });

    // Send standardized error response
    res.status(standardizedError.code).json({
      error: standardizedError.message,
      code: standardizedError.carrierCode || 'internal_error',
      timestamp: standardizedError.timestamp,
      retryable: standardizedError.retryable,
      ...(process.env.NODE_ENV === 'development' && { details: standardizedError.details }),
    });
  };
}

export function rateLimitMiddleware() {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT = 100; // requests per minute
  const WINDOW_MS = 60 * 1000; // 1 minute

  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    const clientData = requestCounts.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      // Reset or initialize counter
      requestCounts.set(clientId, {
        count: 1,
        resetTime: now + WINDOW_MS,
      });
      next();
    } else if (clientData.count >= RATE_LIMIT) {
      // Rate limit exceeded
      res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'rate_limit_exceeded',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
      });
    } else {
      // Increment counter
      clientData.count++;
      next();
    }
  };
}