import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Common validation schemas
export const orderIdSchema = z.object({
  id: z.string().transform((val) => parseInt(val)).refine((val) => !isNaN(val) && val > 0, {
    message: 'Order ID must be a positive integer'
  })
});

export const createShipmentSchema = z.object({
  orderId: z.number().positive('Order ID must be positive'),
  weight: z.number().positive('Weight must be positive').max(1000, 'Weight cannot exceed 1000 oz'),
  dimensions: z.object({
    length: z.number().positive('Length must be positive').max(200, 'Length cannot exceed 200 inches'),
    width: z.number().positive('Width must be positive').max(200, 'Width cannot exceed 200 inches'),
    height: z.number().positive('Height must be positive').max(200, 'Height cannot exceed 200 inches')
  }).optional(),
  carrier: z.enum(['quikpik', 'fedex', 'usps'], {
    errorMap: () => ({ message: 'Carrier must be one of: quikpik, fedex, usps' })
  })
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  role: z.enum(['master', 'client', 'viewer'], {
    errorMap: () => ({ message: 'Role must be one of: master, client, viewer' })
  }),
  organizationId: z.number().positive('Organization ID must be positive')
});

export const walletTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(255, 'Description too long')
});

// Validation middleware factory
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse({
        ...req.body,
        ...req.params,
        ...req.query
      });
      
      // Replace request data with validated data
      req.body = { ...req.body, ...validatedData };
      req.params = { ...req.params, ...validatedData };
      req.query = { ...req.query, ...validatedData };
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}

// Sanitization middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize string inputs
  const sanitizeString = (str: string): string => {
    return str
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  };

  // Recursively sanitize object
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body, params, and query
  req.body = sanitizeObject(req.body);
  req.params = sanitizeObject(req.params);
  req.query = sanitizeObject(req.query);

  next();
} 