import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1); // Trust first proxy for rate limiting
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Production-safe logging function
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Production static file serving
function serveStatic(app: express.Express) {
  // Use process.cwd() for production compatibility
  const distPath = path.resolve(process.cwd(), "dist", "public");
  
  if (!fs.existsSync(distPath)) {
    log(`Build directory not found at ${distPath}, trying alternative paths...`);
    
    // Try alternative paths for different deployment environments
    const alternativePaths = [
      path.resolve(process.cwd(), "public"),
      path.resolve(process.cwd(), "dist"),
      path.resolve(__dirname, "public"),
      path.resolve(__dirname, "..", "public")
    ];
    
    let foundPath = null;
    for (const altPath of alternativePaths) {
      if (fs.existsSync(altPath)) {
        foundPath = altPath;
        break;
      }
    }
    
    if (!foundPath) {
      log(`Warning: No static files found. Available paths: ${alternativePaths.join(", ")}`);
      return; // Skip static file serving if no build directory found
    }
    
    log(`Using static files from: ${foundPath}`);
    app.use(express.static(foundPath));
    
    // fall through to index.html if the file doesn't exist
    const indexPath = path.resolve(foundPath, "index.html");
    if (fs.existsSync(indexPath)) {
      app.use("*", (_req, res) => {
        res.sendFile(indexPath);
      });
    }
    return;
  }
  
  app.use(express.static(distPath));
  
  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

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
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${message}`);
      res.status(status).json({ message });
    });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    // Only import vite setup in development to avoid production dependencies
    const { setupVite } = await import("./vite.js");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use environment port or default to 5000
  // this serves both the API and the client.
  const portEnv = process.env.PORT || "5000";
  
  // Clean and validate port value
  const cleanPort = portEnv.toString().trim();
  const port = parseInt(cleanPort, 10);
  
  // Validate port is within valid range
  if (isNaN(port) || port < 0 || port > 65535) {
    log(`Invalid PORT value: "${portEnv}" (cleaned: "${cleanPort}"). Must be integer between 0 and 65535.`);
    log(`Port type: ${typeof portEnv}, value: ${JSON.stringify(portEnv)}`);
    process.exit(1);
  }
  
  log(`Using port: ${port} (from env: "${portEnv}")`);
  
  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  });
  
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
      log(`Health check available at /api/health`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      log(`Server error: ${error.message}`);
      process.exit(1);
    });

  } catch (error: any) {
    log(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
})();
