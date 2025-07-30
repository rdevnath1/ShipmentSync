import bcrypt from 'bcrypt';
import session from 'express-session';
import type { Express, RequestHandler } from 'express';
import connectPg from 'connect-pg-simple';
import MemoryStore from 'memorystore';
import { storage } from './storage';

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  let sessionStore;
  
  // Always use memory store in development for simplicity
  if (process.env.NODE_ENV === 'development') {
    console.log("Using memory store for sessions in development mode");
    const memoryStore = MemoryStore(session);
    sessionStore = new memoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  } else {
    const pgStore = connectPg(session);
    sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    });
  }

  const sessionSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-session-secret-12345678901234567890' : undefined);
  
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET environment variable is required');
  }

  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: 'strict',
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
      
      // Development mode bypass - allow demo login
      if (process.env.NODE_ENV === 'development' && 
          (email === 'demo@client.com' || email === 'rajan@quikpik.io') && 
          password === 'demo123') {
        
        const mockUser = {
          id: email === 'rajan@quikpik.io' ? 1 : 2,
          email: email,
          firstName: email === 'rajan@quikpik.io' ? 'Master' : 'Demo',
          lastName: email === 'rajan@quikpik.io' ? 'Admin' : 'User',
          role: email === 'rajan@quikpik.io' ? 'master' : 'client',
          isActive: true,
          organizationId: email === 'rajan@quikpik.io' ? null : 1,
          organization: email === 'rajan@quikpik.io' ? null : { id: 1, name: 'Demo Organization' }
        };
        
        // Store user in session with proper types
        (req as any).session.userId = mockUser.id;
        (req as any).session.user = mockUser;
        
        console.log('Development login successful for:', email);
        
        return res.json({ 
          success: true, 
          user: {
            id: mockUser.id,
            email: mockUser.email,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            role: mockUser.role,
            organizationId: mockUser.organizationId
          }
        });
      }
      
      // In development mode, if database is not available, still try demo credentials
      if (process.env.NODE_ENV === 'development') {
        console.log('Database not available, rejecting non-demo credentials');
        return res.status(401).json({ error: "Use demo credentials: demo@client.com / demo123 or rajan@quikpik.io / demo123" });
      }
      
      // Try normal authentication (production mode)
      try {
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
      } catch (dbError) {
        console.error("Database error during login:", dbError);
        return res.status(500).json({ error: "Database unavailable" });
      }
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

  // Change password
  app.post('/api/auth/change-password', requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req as any).user.id;
      
      // Get user from database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ success: false, error: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password in database
      await storage.updateUserPassword(userId, hashedNewPassword);
      
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ success: false, error: "Failed to change password" });
    }
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