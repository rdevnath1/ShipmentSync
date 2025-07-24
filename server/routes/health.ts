import { Router, Request, Response } from 'express';
import { db } from '../db';
import { storage } from '../storage';
import { cacheManager } from '../utils/cache';
import { config, features } from '../config';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: HealthCheck;
    redis?: HealthCheck;
    shipstation?: HealthCheck;
    disk: HealthCheck;
    memory: HealthCheck;
  };
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  responseTime?: number;
  details?: any;
}

// Database health check
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Redis health check
async function checkRedis(): Promise<HealthCheck> {
  if (!features.enableRedis) {
    return {
      status: 'healthy',
      message: 'Redis not configured'
    };
  }

  const start = Date.now();
  try {
    await cacheManager.set('health_check', 'test', 10);
    const value = await cacheManager.get('health_check');
    const responseTime = Date.now() - start;
    
    if (value === 'test') {
      return {
        status: 'healthy',
        message: 'Redis connection successful',
        responseTime
      };
    } else {
      return {
        status: 'degraded',
        message: 'Redis read/write test failed'
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Redis connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ShipStation health check
async function checkShipStation(): Promise<HealthCheck> {
  if (!features.enableShipStation) {
    return {
      status: 'healthy',
      message: 'ShipStation not configured'
    };
  }

  const start = Date.now();
  try {
    // Simple API call to check connectivity
    const response = await fetch('https://ssapi.shipstation.com/accounts/listtags', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.SHIPSTATION_API_KEY}:${config.SHIPSTATION_API_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const responseTime = Date.now() - start;
    
    if (response.ok) {
      return {
        status: 'healthy',
        message: 'ShipStation API accessible',
        responseTime
      };
    } else {
      return {
        status: 'degraded',
        message: `ShipStation API returned ${response.status}`,
        details: { status: response.status, statusText: response.statusText }
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'ShipStation API connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// System health checks
function checkDisk(): HealthCheck {
  try {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal / 1024 / 1024; // MB
    const usedMemory = usage.heapUsed / 1024 / 1024; // MB
    const memoryUsage = (usedMemory / totalMemory) * 100;
    
    if (memoryUsage > 90) {
      return {
        status: 'unhealthy',
        message: 'High memory usage detected',
        details: { usage: `${memoryUsage.toFixed(2)}%`, used: `${usedMemory.toFixed(2)}MB`, total: `${totalMemory.toFixed(2)}MB` }
      };
    } else if (memoryUsage > 75) {
      return {
        status: 'degraded',
        message: 'Elevated memory usage',
        details: { usage: `${memoryUsage.toFixed(2)}%`, used: `${usedMemory.toFixed(2)}MB`, total: `${totalMemory.toFixed(2)}MB` }
      };
    } else {
      return {
        status: 'healthy',
        message: 'Memory usage normal',
        details: { usage: `${memoryUsage.toFixed(2)}%`, used: `${usedMemory.toFixed(2)}MB`, total: `${totalMemory.toFixed(2)}MB` }
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Unable to check memory usage',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function checkMemory(): HealthCheck {
  try {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal / 1024 / 1024; // MB
    const usedMemory = usage.heapUsed / 1024 / 1024; // MB
    const memoryUsage = (usedMemory / totalMemory) * 100;
    
    if (memoryUsage > 90) {
      return {
        status: 'unhealthy',
        message: 'High memory usage detected',
        details: { usage: `${memoryUsage.toFixed(2)}%`, used: `${usedMemory.toFixed(2)}MB`, total: `${totalMemory.toFixed(2)}MB` }
      };
    } else if (memoryUsage > 75) {
      return {
        status: 'degraded',
        message: 'Elevated memory usage',
        details: { usage: `${memoryUsage.toFixed(2)}%`, used: `${usedMemory.toFixed(2)}MB`, total: `${totalMemory.toFixed(2)}MB` }
      };
    } else {
      return {
        status: 'healthy',
        message: 'Memory usage normal',
        details: { usage: `${memoryUsage.toFixed(2)}%`, used: `${usedMemory.toFixed(2)}MB`, total: `${totalMemory.toFixed(2)}MB` }
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Unable to check memory usage',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Main health check endpoint
router.get('/', async (req: Request, res: Response) => {
  const start = Date.now();
  
  try {
    // Run all health checks in parallel
    const [dbCheck, redisCheck, shipstationCheck, diskCheck, memoryCheck] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkShipStation(),
      Promise.resolve(checkDisk()),
      Promise.resolve(checkMemory())
    ]);

    const checks = {
      database: dbCheck,
      ...(features.enableRedis && { redis: redisCheck }),
      ...(features.enableShipStation && { shipstation: shipstationCheck }),
      disk: diskCheck,
      memory: memoryCheck
    };

    // Determine overall status
    const allChecks = Object.values(checks);
    const hasUnhealthy = allChecks.some(check => check.status === 'unhealthy');
    const hasDegraded = allChecks.some(check => check.status === 'degraded');
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.NODE_ENV,
      checks
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Simple health check for load balancers
router.get('/ping', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Detailed health check with more information
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    // Get system statistics
    const stats = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };

    // Get database statistics
    const dbStats = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM organizations) as org_count,
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM orders) as order_count,
        (SELECT COUNT(*) FROM wallets) as wallet_count
    `);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      system: stats,
      database: dbStats[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get detailed health information',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 