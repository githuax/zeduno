import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { swaggerSpec } from './config/swagger';
import routes from './routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy to properly handle X-Forwarded-For headers
app.set('trust proxy', true);

// Create HTTP server
const server = createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow all origins for WebSocket in development
      if (!origin || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      
      // Production allowed origins
      const allowedOrigins = [
        'https://zeduno.piskoe.com',
        'http://192.168.2.43:8080',
        'http://192.168.2.43:5173',
        'http://localhost:3000',
        'http://localhost:5173'
      ];
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for now to avoid connection issues
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
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
    const allowedOrigins = [
      'https://zeduno.piskoe.com',
      'http://192.168.2.43:8080',
      'http://192.168.2.43:5173',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
