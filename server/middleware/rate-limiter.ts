import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { storage } from '../storage';
import { RateLimitError } from './error-handler';

// Store for tracking failed login attempts
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    throw new RateLimitError('API rate limit exceeded');
  },
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP
    return (req as any).user?.id?.toString() || req.ip;
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks and static assets
    return req.path === '/health' || req.path.startsWith('/assets/');
  }
});

// Stricter rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    throw new RateLimitError('Too many login attempts');
  },
  keyGenerator: (req: Request) => {
    // Use email + IP for login attempts
    const email = req.body?.email || 'unknown';
    return `${email}:${req.ip}`;
  }
});

// Rate limiter for shipment creation (prevent abuse)
export const shipmentRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each user to 50 shipments per hour
  message: {
    error: 'Too many shipment creation attempts, please try again later.',
    code: 'SHIPMENT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    throw new RateLimitError('Shipment creation rate limit exceeded');
  },
  keyGenerator: (req: Request) => {
    return (req as any).user?.id?.toString() || req.ip;
  },
  skip: (req: Request) => {
    // Skip for master users
    return (req as any).user?.role === 'master';
  }
});

// Rate limiter for wallet transactions
export const walletRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each user to 10 wallet operations per 5 minutes
  message: {
    error: 'Too many wallet operations, please try again later.',
    code: 'WALLET_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    throw new RateLimitError('Wallet operation rate limit exceeded');
  },
  keyGenerator: (req: Request) => {
    return (req as any).user?.id?.toString() || req.ip;
  },
  skip: (req: Request) => {
    // Skip for master users
    return (req as any).user?.role === 'master';
  }
});

// Custom login attempt tracker
export function trackLoginAttempt(email: string, ip: string): { blocked: boolean; remainingAttempts: number } {
  const key = `${email}:${ip}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  const attempts = loginAttempts.get(key);
  
  if (!attempts || now > attempts.resetTime) {
    // Reset or initialize
    loginAttempts.set(key, { count: 1, resetTime: now + windowMs });
    return { blocked: false, remainingAttempts: 4 };
  }
  
  if (attempts.count >= 5) {
    return { blocked: true, remainingAttempts: 0 };
  }
  
  attempts.count++;
  loginAttempts.set(key, attempts);
  
  return { blocked: false, remainingAttempts: 5 - attempts.count };
}

// Reset login attempts on successful login
export function resetLoginAttempts(email: string, ip: string): void {
  const key = `${email}:${ip}`;
  loginAttempts.delete(key);
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, attempts] of loginAttempts.entries()) {
    if (now > attempts.resetTime) {
      loginAttempts.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute 