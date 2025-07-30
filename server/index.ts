import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // In production, serve static files from the built client
    const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
    console.log("Looking for dist path:", distPath);
    console.log("Dist path exists:", fs.existsSync(distPath));
    
    if (fs.existsSync(distPath)) {
      console.log("Serving static files from:", distPath);
      app.use(express.static(distPath));
      // fall through to index.html if the file doesn't exist
      app.use("*", (req, res) => {
        console.log("Serving index.html for path:", req.path);
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    } else {
      // If no build exists, serve a simple message
      console.log("No dist directory found, serving error message");
      app.use("*", (req, res) => {
        console.log("Request for:", req.path);
        if (req.path.startsWith("/api")) {
          res.status(404).json({ error: "API endpoint not found" });
        } else {
          res.status(404).json({ 
            error: "Client not built. Run 'npm run build' first.",
            path: req.path,
            distPath: distPath
          });
        }
      });
    }
  }

  // serve the app on the specified port (default 5000)
  // this serves both the API and the client.
  const port = parseInt(process.env.PORT || "5000");
  const serverInstance = server.listen(port, '127.0.0.1', () => {
    log(`serving on port ${port}`);
    console.log(`✅ Server successfully listening on port ${port}`);
    console.log(`✅ Frontend should be accessible at http://localhost:${port}`);
    console.log(`✅ API should be accessible at http://localhost:${port}/api`);
    
    // Test the server immediately after startup
    setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:${port}/api/health`);
        if (response.ok) {
          console.log(`✅ Server self-test successful: ${response.status}`);
        } else {
          console.log(`❌ Server self-test failed: ${response.status}`);
        }
      } catch (err: any) {
        console.log(`❌ Server self-test failed: ${err.message}`);
      }
    }, 1000);
  }).on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  });
})();
