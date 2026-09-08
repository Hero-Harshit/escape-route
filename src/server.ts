import app from './app';
import { env } from './config/env';

const startServer = () => {
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`[Server] Server is running on http://0.0.0.0:${env.PORT}`);
    console.log(`[Server] Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('[Server] Shutting down server...');
    server.close(() => {
      console.log('[Server] Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startServer();
