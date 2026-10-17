import "dotenv/config";
import { closeDueProposals } from "./services/proposal-lifecycle.service";
import { deliverEvents } from "./services/events.service";
import { sendDueReminders } from "./services/reminder.service";
import mongoose from "mongoose";
import { capabilities } from "./services/capabilities.service";
import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import { serveUpload } from "./controllers/upload.controller";
import { cleanupAbandonedUploads } from "./services/upload.service";
import swaggerUi from "swagger-ui-express";
import { connectDatabase } from "./config/database";
import { initializeFirebase } from "./config/firebase";
import swaggerSpec from "./config/swagger";
import routes from "./routes";
import { correlationId } from "./middleware/correlationId";
import { validateEnv } from "./utils/validateEnv";
import logger from "./utils/logger";

// Load environment variables

// Validate all required env vars at startup (fail-fast)

export function createApp(): Application {
  const app: Application = express();
  app.set("trust proxy", "loopback");

  // Security Middleware
  app.use(helmet()); // Set security headers
  app.use(correlationId); // Assign correlation ID to each request
  app.use(cookieParser()); // Parse cookies
  app.use(
    cors({
      origin: (origin, callback) => {
        const origins = (process.env.CORS_ORIGIN || "http://localhost:3000")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        callback(null, !origin || origins.includes(origin));
      },
      credentials: true,
      optionsSuccessStatus: 200,
    }),
  );

  // Response compression (gzip)
  app.use(compression());

  // General rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: Math.min(
      5000,
      Math.max(100, Number(process.env.API_RATE_LIMIT) || 600),
    ),
    message: "Trop de requêtes. Réessayez plus tard.",
  });
  app.use("/api/", limiter);

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Browser mutations must originate from an allowlisted application.
  app.use(
    (req: Request, res: Response, next: import("express").NextFunction) => {
      if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        const origins = (process.env.CORS_ORIGIN || "http://localhost:3000")
          .split(",")
          .map((value) => value.trim());
        const origin = req.headers.origin;
        if (origin && !origins.includes(origin)) {
          res.status(403).json({
            status: "error",
            code: "UNTRUSTED_ORIGIN",
            message: "Origine non autorisée",
          });
          return;
        }
        const publicRequest =
          /^\/api\/v1\/(?:contact(?:\/|$)|auth\/(?:login|register|forgot-password|reset-password)$)/.test(
            req.path,
          );
        const cookieOnly =
          (req.cookies?.admin_token || req.cookies?.admin_refresh_token) &&
          !req.headers.authorization &&
          !req.body?.refreshToken;
        if (cookieOnly && !publicRequest && !origin) {
          res.status(403).json({
            status: "error",
            code: "UNTRUSTED_ORIGIN",
            message: "Origine requise",
          });
          return;
        }
      }
      next();
    },
  );

  // Data sanitization against NoSQL query injection (Express 5 compatible in-place sanitize)
  app.use(
    (req: Request, _res: Response, next: import("express").NextFunction) => {
      if (req.body) mongoSanitize.sanitize(req.body);
      if (req.params) mongoSanitize.sanitize(req.params);
      if (req.query) mongoSanitize.sanitize(req.query);
      next();
    },
  );

  // Every file, including legacy names, passes through metadata and access checks.
  app.get("/uploads/:filename", serveUpload);

  // Health check route
  app.get("/health", async (_req: Request, res: Response) => {
    try {
      await mongoose.connection.db?.admin().command({ ping: 1 });
      const database = mongoose.connection.readyState === 1;
      const hello = database
        ? await mongoose.connection.db?.admin().command({ hello: 1 })
        : undefined;
      res.status(database ? 200 : 503).json({
        status: database ? "success" : "error",
        database,
        financialStorage: Boolean(hello?.setName || hello?.msg === "isdbgrid"),
        services: capabilities(),
        timestamp: new Date().toISOString(),
      });
    } catch {
      res
        .status(503)
        .json({ status: "error", database: false, services: capabilities() });
    }
  });

  // API Documentation (Swagger)
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: "Badenya API Documentation",
      customCss: ".swagger-ui .topbar { display: none }",
    }),
  );

  // Swagger JSON spec
  app.get("/api/docs.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // API v1 routes
  app.use("/api/v1", routes);

  // API root
  app.get("/api/v1", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "success",
      message: "Welcome to Badenya API v1",
      version: "1.0.0",
    });
  });

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      status: "error",
      message: "Route introuvable",
    });
  });

  // Error handler
  app.use(
    (
      err: Error,
      _req: Request,
      res: Response,
      _next: import("express").NextFunction,
    ) => {
      logger.error(err.stack);
      res.status(500).json({
        status: "error",
        message: "Erreur interne du serveur",
      });
    },
  );

  return app;
}
const PORT = process.env.PORT || 5000;
const app = createApp();
export const startServer = async () => {
  try {
    validateEnv();
    await connectDatabase();
    initializeFirebase();
    let working = false;
    let lastCleanup = 0;
    const tick = async () => {
      if (working) return;
      working = true;
      try {
        try {
          await closeDueProposals();
        } catch (error) {
          logger.warn(
            "Proposal job failed",
            error instanceof Error ? error.message : "failed",
          );
        }
        await sendDueReminders();
        if (Date.now() - lastCleanup > 3600000) {
          await cleanupAbandonedUploads();
          lastCleanup = Date.now();
        }
      } catch (error) {
        logger.warn(
          "Background jobs:",
          error instanceof Error ? error.message : "failed",
        );
      } finally {
        try {
          await deliverEvents();
        } catch (error) {
          logger.warn(
            "Notification job failed",
            error instanceof Error ? error.message : "failed",
          );
        }
        working = false;
      }
    };
    const timer = setInterval(() => void tick(), 60000);
    timer.unref();
    void tick();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      if (process.send) process.send("ready");
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};
if (require.main === module) void startServer();
export default app;
