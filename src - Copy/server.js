require('dotenv').config();
const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');
const fs          = require('fs');
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const { connectDB, sequelize } = require('./config/database');
const routes  = require('./routes/index');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Security ────────────────────────────────────────────────────────────────
// Relax helmet CSP for Swagger UI (it needs inline scripts/styles)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      styleSrc:      ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      imgSrc:        ["'self'", 'data:', 'cdn.jsdelivr.net'],
      connectSrc:    ["'self'"],
      workerSrc:     ["'self'", 'blob:'],
      objectSrc:     ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads
const uploadPath = path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
app.use('/uploads', express.static(uploadPath));




// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  // max: parseInt(process.env.RATE_LIMIT_MAX) || 100,

  max: parseInt(process.env.RATE_LIMIT_MAX) === "production" ? 100 : 1000, // 1000 kwa development
  skip: (req) => parseInt(process.env.RATE_LIMIT_MAX) === "development", // au skip kabisa kwa dev
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
});

app.use('/api', limiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Swagger UI ───────────────────────────────────────────────────────────────
const swaggerUiOptions = {
  customSiteTitle: 'Farida Projects API',
  customfavIcon:   '/favicon.ico',
  customCss: `
    .swagger-ui .topbar { background: #1e3a5f; padding: 10px 0; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .topbar-wrapper img { content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 30'%3E%3Ctext y='22' font-size='18' font-weight='bold' fill='white' font-family='sans-serif'%3E🏗 Farida Projects%3C/text%3E%3C/svg%3E"); height:30px; }
    .swagger-ui .info .title { color: #1e3a5f; }
    .swagger-ui .btn.authorize { background: #1e3a5f; border-color: #1e3a5f; color: white; }
    .swagger-ui .btn.authorize svg { fill: white; }
    .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #2563eb; }
    .swagger-ui .opblock.opblock-get  .opblock-summary { border-color: #16a34a; }
    .swagger-ui table thead tr td, .swagger-ui table thead tr th { color: #1e3a5f; }
  `,
  swaggerOptions: {
    persistAuthorization: true,           // token stays after page refresh
    displayRequestDuration: true,         // shows how long each request took
    filter: true,                         // search/filter endpoints box
    deepLinking: true,                    // URL updates as you open endpoints
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    docExpansion: 'none',                 // all tags collapsed by default
    tryItOutEnabled: true,                // "Try it out" enabled by default
    requestSnippetsEnabled: true,         // shows curl/axios code snippets
    requestSnippets: {
      generators: {
        curl_bash:  { title: 'cURL (bash)',   syntax: 'bash' },
        node_fetch: { title: 'Node (fetch)',  syntax: 'javascript' },
      },
      defaultExpanded: true,
    },
  },
};

// Serve raw OpenAPI JSON (useful for Postman import)
app.get('/api/docs/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    app:       process.env.APP_NAME || 'Farida Projects API',
    version:   '2.0.0',
    docs:      `http://localhost:${PORT}/api/docs`,
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Boot ─────────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();

  if (process.env.NODE_ENV !== 'production') {
    //await sequelize.sync({ alter: true });
    await sequelize.sync();
    console.log('✅ Models synced');
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Farida Projects API  →  http://localhost:${PORT}`);
    console.log(`📖 Swagger UI           →  http://localhost:${PORT}/api/docs`);
    console.log(`📄 OpenAPI JSON         →  http://localhost:${PORT}/api/docs/openapi.json`);
    console.log(`🔑 Login                →  POST http://localhost:${PORT}/api/auth/login`);
    console.log(`\nEnv: ${process.env.NODE_ENV || 'development'}\n`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
