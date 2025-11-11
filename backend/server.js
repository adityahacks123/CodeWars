// MUST be first - before any other imports!
import dotenv from 'dotenv';
dotenv.config();

// Debug: Check if .env is loaded
console.log('🔍 Server.js Debug:');
console.log(`   .env loaded: ${process.env.JUDGE0_API_KEY ? 'YES' : 'NO'}`);
console.log(`   JUDGE0_API_KEY: ${process.env.JUDGE0_API_KEY || 'UNDEFINED'}`);
console.log(`   Working Directory: ${process.cwd()}`);

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import connectDB from './config/database.js';
import passportConfig, { configureStrategies } from './config/passport.js';
import authRoutes from './routes/authRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import codeRoutes from './routes/codeRoutes.js';
import roomRoutes from './routes/roomRoutes.js';

// Connect to database
connectDB();

// Configure Passport strategies after env vars are loaded
configureStrategies();

// Initialize Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
app.use(cookieParser());

// Session middleware (required for Passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Initialize Passport
app.use(passportConfig.initialize());
app.use(passportConfig.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/rooms', roomRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CodeHub API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      googleAuth: 'GET /api/auth/google',
      logout: 'POST /api/auth/logout',
      me: 'GET /api/auth/me'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 CodeHub API Server Running                          ║
║                                                           ║
║   📡 Port: ${PORT}                                        ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                              ║
║   🔗 URL: http://localhost:${PORT}                        ║
║                                                           ║
║   📚 API Documentation:                                   ║
║   - Health Check: GET /api/health                         ║
║   - Register: POST /api/auth/register                     ║
║   - Login: POST /api/auth/login                           ║
║   - Google Auth: GET /api/auth/google                     ║
║   - Get User: GET /api/auth/me                            ║
║   - Logout: POST /api/auth/logout                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
