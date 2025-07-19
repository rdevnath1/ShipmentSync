import bcrypt from 'bcrypt';
import session from 'express-session';
import type { Express, RequestHandler } from 'express';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-here',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

// Authentication middleware
export const requireAuth: RequestHandler = async (req, res, next) => {
  const user = (req as any).session?.user;
  
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // Attach user info to request
  (req as any).user = user;
  next();
};

// Role-based authorization middleware
export const requireRole = (roles: string[]): RequestHandler => {
  return async (req, res, next) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    next();
  };
};

// Organization access middleware (ensures users can only access their org's data)
export const requireOrgAccess: RequestHandler = async (req, res, next) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // Master users can access any organization
  if (user.role === 'master') {
    return next();
  }
  
  // Attach organization filter to request
  (req as any).organizationId = user.organizationId;
  next();
};

// Setup authentication routes
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Login route
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      
      // Find user with organization info
      const user = await storage.getUserByEmailWithOrg(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ error: "Account is deactivated" });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Update last login
      await storage.updateUserLastLogin(user.id);
      
      // Store user in session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization
      };
      
      res.json({
        success: true,
        user: (req as any).session.user
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Could not log out" });
      }
      res.json({ success: true });
    });
  });

  // Get current user
  app.get('/api/auth/user', requireAuth, async (req, res) => {
    res.json({ user: (req as any).user });
  });

  // Register new organization and admin user (master only)
  app.post('/api/auth/register-org', requireAuth, requireRole(['master']), async (req, res) => {
    try {
      const { orgName, orgSlug, adminEmail, adminPassword, adminFirstName, adminLastName } = req.body;
      
      // Create organization
      const organization = await storage.createOrganization({
        name: orgName,
        slug: orgSlug,
        settings: {}
      });
      
      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Create admin user
      const user = await storage.createUser({
        email: adminEmail,
        password: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        role: 'client',
        organizationId: organization.id
      });
      
      res.json({
        success: true,
        organization,
        user: { ...user, password: undefined } // Don't return password
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
}