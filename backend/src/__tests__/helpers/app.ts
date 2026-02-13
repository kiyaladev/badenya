import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from '../../routes';

/**
 * Create Express app for testing without starting server
 */
export const createTestApp = (): Application => {
  const app: Application = express();

  // Security Middleware
  app.use(helmet());
  app.use(cors({
    origin: '*',
    credentials: true,
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check route
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Badenya API is running',
      timestamp: new Date().toISOString(),
    });
  });

  // API v1 routes
  app.use('/api/v1', routes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'Route not found',
    });
  });

  return app;
};
