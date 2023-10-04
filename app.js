import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'cookie-session';
import cookieParser from 'cookie-parser';
import YAML from 'yaml';
import 'colors';

// Load ENV variable
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = fs.readFileSync(path.resolve(__dirname, './swagger.yaml'), 'utf8');
const swaggerDocument = YAML.parse(file);

import { initializeSocketIO } from './socket/index.js';
import router from './routes/index.js';
import { errorHandler } from './middlewares/error.js';
import logger from './utils/logger.js';
import { corsOrigin } from './config/constants.js';

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  pingTimeout: 60000,
  serveClient: false,
  connectTimeout: 60000,
  allowEIO3: false,
  transports: ['polling', 'websocket'],
  allowUpgrades: true,
  addTrailingSlash: false,

  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

app.set('trust proxy', 1); // trust first proxy
// using set method to mount the `io` instance on the app to avoid usage of `global`
app.set('io', io);

// global middlewares
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(helmet());

// Rate limiter to avoid misuse of the service and avoid cost spikes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_, __, ___, options) => {
    throw new ApiError(
      options.statusCode || 429,
      `There are too many requests. You are only allowed ${
        options.max
      } requests per ${options.windowMs / 60000} minutes`
    );
  },
});

// Apply the rate limiting middleware to all requests
app.use(limiter);
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// required for passport
app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    secure: false,
    httpOnly: true,
    resave: false,
    saveUninitialized: true,
  })
); // session secret

// Dev Logging Middleware
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Static
app.use(express.static('public'));

// Routes
app.use('/api/v1/notification', router);

// * API DOCS
// ? Keeping swagger code at the end so that we can load swagger on "/" route
if (process.env.NODE_ENV === 'development') {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      // keep all the sections collapsed by default
      swaggerOptions: { docExpansion: 'none' },
      customSiteTitle: 'TheHTTP docs',
    })
  );
}

initializeSocketIO(io);

const PORT = Number(process.env.PORT) || 5000;
const server = httpServer.listen(
  PORT,
  logger.info(
    `🚀 Started on Port ${process.env.PORT} in ${process.env.NODE_ENV} mode`
      .blue.bold
  )
);

// common error handling middleware
app.use(errorHandler);

// Handle Unhandled Rejection
process.on('unhandledRejection', (err, promise) => {
  logger.info(`Error: ${err.message}`.red.bold);
  // Close Server and Exit
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated!');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated!');
  });
});

export default app;
