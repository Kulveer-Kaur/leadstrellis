import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { corsOptions } from './config/cors.config.js';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware.js';
import { requestLogger } from './middlewares/request-logger.middleware.js';
import { apiRouter } from './routes/index.js';

/** Builds the Express app (no listening here, so tests can mount it). */
export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // behind ngrok / a load balancer
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use(requestLogger);

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'leadstrellis-api', time: new Date().toISOString() }));
  app.use('/api/v1', apiRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  return app;
}
