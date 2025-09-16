import { createServer } from 'http';
import path from 'path';

import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';


import { connectDB } from './config/database';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import routes from './routes';
import { validateEnv } from './config/env';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy to properly handle X-Forwarded-For headers
app.set('trust proxy', true);

// Create HTTP server
const server = createServer(app);

// Validate required environment configuration early
validateEnv();

// Helper to parse allowlist from environment
const parseAllowedOrigins = (): string[] => {
  const raw = process.env.ALLOWED_ORIGINS || process.env.CORS_ALLOWED_ORIGINS || '';
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
};

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman/mobile) and all in development
      if (!origin || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      const allowedOrigins = parseAllowedOrigins();
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-branch-id']
  },
  transports: ['websocket', 'polling']
});

// Make io accessible throughout the app
app.set('io', io);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:5000", "http://localhost:*"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(compression());
app.use(morgan('combined'));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Production allowed origins
    const allowedOrigins = parseAllowedOrigins();
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-branch-id']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// API routes
app.use('/api', routes);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve static files for uploads (logos, images, etc.)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    socketConnections: io.engine.clientsCount
  });
});

// Error handling middleware
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  // Join user to their specific room for targeted updates
  socket.on('join-user', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} joined room`);
  });

  // Join order room for order-specific updates
  socket.on('join-order', (orderId: string) => {
    socket.join(`order:${orderId}`);
    console.log(`📦 Joined order room: ${orderId}`);
  });

  // Join kitchen room for tenant-specific kitchen updates
  socket.on('join-kitchen', (tenantId: string) => {
    if (!tenantId) {
      console.warn('⚠️ Cannot join kitchen room: tenantId is required');
      return;
    }
    
    const kitchenRoom = `kitchen:${tenantId}`;
    socket.join(kitchenRoom);
    console.log(`🍳 Kitchen joined room: ${kitchenRoom} (socket: ${socket.id})`);
    
    // Confirm joining
    socket.emit('kitchen-room-joined', { tenantId, room: kitchenRoom });
  });

  // Join analytics room for real-time metrics updates
  socket.on('join-analytics', (tenantId: string) => {
    if (!tenantId) {
      console.warn('⚠️ Cannot join analytics room: tenantId is required');
      return;
    }
    
    websocketService.joinAnalyticsRoom(socket.id, tenantId);
  });

  // Leave kitchen room
  socket.on('leave-kitchen', (tenantId: string) => {
    if (!tenantId) {
      console.warn('⚠️ Cannot leave kitchen room: tenantId is required');
      return;
    }
    
    const kitchenRoom = `kitchen:${tenantId}`;
    socket.leave(kitchenRoom);
    console.log(`🍳 Kitchen left room: ${kitchenRoom} (socket: ${socket.id})`);
  });

  // Leave analytics room
  socket.on('leave-analytics', (tenantId: string) => {
    if (!tenantId) {
      console.warn('⚠️ Cannot leave analytics room: tenantId is required');
      return;
    }
    
    websocketService.leaveAnalyticsRoom(socket.id, tenantId);
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
  });
});

const startServer = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
  
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`WebSocket server initialized`);
  });
};

startServer();

export { io };

// Initialize WebSocket service
import { websocketService } from './services/websocket.service';
websocketService.initialize(io);

// Initialize Real-time Analytics Service
import { realTimeAnalyticsService } from './services/realTimeAnalytics.service';
realTimeAnalyticsService.initialize();
console.log('📊 Real-time Analytics Service initialized');

// Initialize Report Queue Service - Temporarily disabled due to TypeScript issues
// import { reportQueueService } from './services/reportQueue.service';
// reportQueueService.initialize().catch(error => {
//   console.error('Failed to initialize Report Queue Service:', error);
// });
