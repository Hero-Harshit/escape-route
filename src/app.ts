import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import escapeRouteRoutes from './routes/escapeRoute.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API Routes
app.use('/api', escapeRouteRoutes);

// 404 Handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint was not found.',
    },
  });
});

// Centralized error handling
app.use(errorHandler);

export default app;
