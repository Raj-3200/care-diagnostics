import app from './app.js';
import { env } from './config/env.js';
import { prisma, disconnect } from './config/database.js';

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Start server
    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Server is running on port ${env.PORT}`);
      console.log(`📦 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 API Base URL: http://localhost:${env.PORT}/api/v1`);
    });

    // Graceful shutdown
    let isShuttingDown = false;

    const gracefulShutdown = (signal: string) => {
      if (isShuttingDown) {
        return;
      }
      isShuttingDown = true;

      console.log(`\n${signal} received. Starting graceful shutdown...`);

      server.close(() => {
        console.log('🛑 HTTP server closed');

        void disconnect()
          .then(() => {
            console.log('👋 Process terminated');
            process.exit(0);
          })
          .catch((error: unknown) => {
            console.error('❌ Error while disconnecting database:', error);
            process.exit(1);
          });
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

void startServer();
