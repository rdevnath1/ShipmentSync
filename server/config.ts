import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	DATABASE_URL: z.string().optional(),
	SESSION_SECRET: z.string().optional(),
	SHIPSTATION_API_KEY: z.string().optional(),
	SHIPSTATION_API_SECRET: z.string().optional(),
	MASTER_ADMIN_PASSWORD: z.string().optional(),
	DEMO_USER_PASSWORD: z.string().optional(),
	REDIS_URL: z.string().optional(),
	PORT: z.string().transform(Number).pipe(z.number().positive()).default('5000'),
	LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
	CORS_ORIGIN: z.string().optional(),
	RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default('900000'), // 15 minutes
	RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),
});

// Validate environment variables
function validateEnv() {
	try {
		return envSchema.parse(process.env);
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('❌ Environment validation failed:');
			error.errors.forEach((err) => {
				console.error(`  - ${err.path.join('.')}: ${err.message}`);
			});
			process.exit(1);
		}
		throw error;
	}
}

// Export validated config
export const config = validateEnv();

// Configuration helper functions
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// Security configuration
export const securityConfig = {
	sessionSecret: config.SESSION_SECRET || (isDevelopment ? 'dev-session-secret-12345678901234567890' : ''),
	corsOrigin: config.CORS_ORIGIN || (isDevelopment ? '*' : undefined),
	rateLimit: {
		windowMs: config.RATE_LIMIT_WINDOW_MS,
		max: config.RATE_LIMIT_MAX_REQUESTS,
	},
	bcryptRounds: 12, // Increased from 10 for better security
	jwtExpiresIn: '7d',
	maxLoginAttempts: 5,
	lockoutDuration: 15 * 60 * 1000, // 15 minutes
};

// Database configuration
export const dbConfig = {
	url: config.DATABASE_URL || undefined,
	pool: {
		min: 2,
		max: 10,
		idleTimeoutMillis: 30000,
		connectionTimeoutMillis: 2000,
	},
};

// API configuration
export const apiConfig = {
	port: config.PORT,
	baseUrl: isDevelopment ? `http://localhost:${config.PORT}` : undefined,
	timeout: 30000, // 30 seconds
	retries: 3,
};

// Logging configuration
export const loggingConfig = {
	level: config.LOG_LEVEL,
	format: isProduction ? 'json' : 'pretty',
	enableAuditLogs: true,
	enableCarrierLogs: true,
};

// Feature flags
export const features = {
	enableRedis: !!config.REDIS_URL,
	enableShipStation: !!(config.SHIPSTATION_API_KEY && config.SHIPSTATION_API_SECRET),
	enableRateLimiting: true,
	enableAuditLogging: true,
	enableEnhancedTracking: true,
	enableWalletSystem: true,
	enableMultiTenancy: true,
};

// Validation helpers
export function validateRequiredEnv(envVars: string[]): void {
	const missing = envVars.filter(envVar => !process.env[envVar]);
	if (missing.length > 0) {
		console.error('❌ Missing required environment variables:', missing.join(', '));
		process.exit(1);
	}
}

export function validateApiCredentials(): void {
	if (!features.enableShipStation) {
		console.warn('⚠️  ShipStation API credentials not configured - ShipStation features will be disabled');
	}
}

// Initialize configuration
export function initializeConfig(): void {
	console.log('🔧 Initializing configuration...');
	console.log(`  Environment: ${config.NODE_ENV}`);
	console.log(`  Port: ${config.PORT}`);
	console.log(`  Database: ${config.DATABASE_URL ? 'Configured' : 'Missing'}`);
	console.log(`  Redis: ${features.enableRedis ? 'Enabled' : 'Disabled'}`);
	console.log(`  ShipStation: ${features.enableShipStation ? 'Enabled' : 'Disabled'}`);
	console.log(`  Rate Limiting: ${features.enableRateLimiting ? 'Enabled' : 'Disabled'}`);
	console.log('✅ Configuration initialized successfully');
} 