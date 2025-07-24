import { createClient } from 'redis';

interface CacheConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  ttl?: number;
}

class CacheManager {
  private client: any;
  private ttl: number;
  private isConnected: boolean = false;

  constructor(config: CacheConfig = {}) {
    this.ttl = config.ttl || 300; // 5 minutes default
    
    // Only initialize Redis if REDIS_URL is provided
    if (process.env.REDIS_URL) {
      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          host: config.host || 'localhost',
          port: config.port || 6379,
        },
        password: config.password,
        database: config.db || 0,
      });

      this.client.on('error', (err: any) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected');
        this.isConnected = true;
      });

      this.client.connect().catch(console.error);
    }
  }

  private getKey(prefix: string, key: string): string {
    return `${prefix}:${key}`;
  }

  async get<T>(prefix: string, key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(this.getKey(prefix, key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(prefix: string, key: string, value: T, ttl?: number): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.setEx(
        this.getKey(prefix, key),
        ttl || this.ttl,
        JSON.stringify(value)
      );
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(prefix: string, key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.del(this.getKey(prefix, key));
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async deletePattern(prefix: string, pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const keys = await this.client.keys(this.getKey(prefix, pattern));
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }

  async invalidateOrganization(orgId: number): Promise<void> {
    await this.deletePattern('org', `*:${orgId}:*`);
  }

  async invalidateUser(userId: number): Promise<void> {
    await this.deletePattern('user', `*:${userId}:*`);
  }

  async invalidateOrder(orderId: number): Promise<void> {
    await this.deletePattern('order', `*:${orderId}:*`);
  }

  // Cache decorator for methods
  static cache<T extends any[], R>(
    prefix: string,
    keyFn: (...args: T) => string,
    ttl?: number
  ) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;

      descriptor.value = async function (...args: T): Promise<R> {
        const cacheKey = keyFn(...args);
        const cached = await cacheManager.get<R>(prefix, cacheKey);
        
        if (cached !== null) {
          return cached;
        }

        const result = await method.apply(this, args);
        await cacheManager.set(prefix, cacheKey, result, ttl);
        return result;
      };
    };
  }
}

// Global cache instance
export const cacheManager = new CacheManager();

// Cache prefixes
export const CACHE_PREFIXES = {
  RATES: 'rates',
  TRACKING: 'tracking',
  ORDERS: 'orders',
  USERS: 'users',
  ORGANIZATIONS: 'orgs',
  CARRIER_ACCOUNTS: 'carriers',
  WALLET: 'wallet'
} as const; 