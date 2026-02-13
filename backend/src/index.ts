import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from './config/database';
import swaggerSpec from './config/swagger';
import routes from './routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet()); // Set security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// General rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Badenya API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Documentation (Swagger)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Badenya API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Swagger JSON spec
app.get('/api/docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API v1 routes
app.use('/api/v1', routes);

// API root
app.get('/api/v1', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Badenya API v1',
    version: '1.0.0',
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
