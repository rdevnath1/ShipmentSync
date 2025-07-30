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
      
      // Serve index.html for all non-API routes
      app.use("*", (req, res) => {
        console.log("Request for:", req.path);
        if (req.path.startsWith("/api")) {
          res.status(404).json({ error: "API endpoint not found" });
        } else {
          console.log("Serving index.html for path:", req.path);
          res.setHeader('Content-Type', 'text/html');
          res.sendFile(path.resolve(distPath, "index.html"));
        }
      });
    } else {
      // If no build exists, serve a simple HTML page
      console.log("No dist directory found, serving fallback HTML");
      app.use("*", (req, res) => {
        console.log("Request for:", req.path);
        if (req.path.startsWith("/api")) {
          res.status(404).json({ error: "API endpoint not found" });
        } else {
          // Serve a simple HTML page instead of JSON
          res.setHeader('Content-Type', 'text/html');
          res.send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Quikpik - Shipment Management</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .container { max-width: 600px; margin: 0 auto; }
                .error { color: #e74c3c; }
                .info { color: #3498db; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🚚 Quikpik Shipment Management</h1>
                <p class="info">Your shipment management platform is being deployed...</p>
                <p class="error">The client application is not yet built.</p>
                <p>Please check the Vercel deployment logs for build errors.</p>
                <hr>
                <p><strong>Path requested:</strong> ${req.path}</p>
                <p><strong>Expected build path:</strong> ${distPath}</p>
              </div>
            </body>
            </html>
          `);
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
