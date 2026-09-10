require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const { connectDB, sequelize } = require("./config/database");
const routes = require("./routes/index");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

// Behind nginx (production) the real client IP arrives in X-Forwarded-For.
// Trust the first proxy hop so req.ip / express-rate-limit key on the real
// client instead of 127.0.0.1 — and so newer express-rate-limit versions
// stop throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR. TRUST_PROXY can override
// (e.g. "2" for two proxy hops, or "false" for local dev with no proxy).
const trustProxyEnv = process.env.TRUST_PROXY;
app.set(
  "trust proxy",
  trustProxyEnv === undefined
    ? 1
    : trustProxyEnv === "false"
      ? false
      : /^\d+$/.test(trustProxyEnv)
        ? parseInt(trustProxyEnv, 10)
        : trustProxyEnv,
);

// CORS_ORIGIN may be a single origin, a comma-separated list ("a,b,c" — how
// we configure it in production for the website + admin frontends), or "*".
// The `cors` package does NOT split comma-separated strings itself — passed
// as-is it treats "a,b" as one literal origin, which never matches a real
// request's Origin header and the browser rejects it. Parse it into an
// array (or leave "*" as a bare string) so every listed origin is honored.
// Shared with the CSP directives below so production domains only need to
// be set once, via this same env var.
const corsOriginEnv = process.env.CORS_ORIGIN || "*";
const corsOrigin =
  corsOriginEnv === "*"
    ? "*"
    : corsOriginEnv.split(",").map((o) => o.trim()).filter(Boolean);
const corsOriginList = () => (Array.isArray(corsOrigin) ? corsOrigin : []);

// ─── Security ────────────────────────────────────────────────────────────────
// Relax helmet CSP for Swagger UI (it needs inline scripts/styles)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
        // Dev origins (localhost:3000/4200) stay so `npm run dev` keeps working;
        // production frontends are added via CORS_ORIGIN (same env var the CORS
        // middleware below parses) so this doesn't need editing per deploy.
        imgSrc: ["'self'", "data:", "cdn.jsdelivr.net", "http://localhost:3000", "http://localhost:4200", ...corsOriginList()],
        connectSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'", "http://localhost:4200", "http://localhost:3000", ...corsOriginList()],
        upgradeInsecureRequests: [],
      },
    },
    frameguard: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static uploads
const uploadPath = path.join(
  __dirname,
  "..",
  process.env.UPLOAD_PATH || "uploads",
);
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
app.use("/uploads", express.static(uploadPath));
app.use("/uploads", express.static(path.join(uploadPath, "media")));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  // max: parseInt(process.env.RATE_LIMIT_MAX) || 100,

  max: process.env.NODE_ENV === "production" ? (parseInt(process.env.RATE_LIMIT_MAX) || 100) : 1000, // 1000 for development
  skip: (req) => process.env.NODE_ENV === "development", // skip rate limiting in development
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
  message: {
    success: false,
    message: "Too many login attempts. Please wait 15 minutes.",
  },
});

app.use("/api", limiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ─── Swagger UI ───────────────────────────────────────────────────────────────
const swaggerUiOptions = {
  customSiteTitle: "RAM Projects API",
  customfavIcon: "/favicon.ico",
  customCss: `
    .swagger-ui .topbar { background: #1e3a5f; padding: 10px 0; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .topbar-wrapper img { content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 30'%3E%3Ctext y='22' font-size='18' font-weight='bold' fill='white' font-family='sans-serif'%3E🏗 RAM Projects%3C/text%3E%3C/svg%3E"); height:30px; }
    .swagger-ui .info .title { color: #1e3a5f; }
    .swagger-ui .btn.authorize { background: #1e3a5f; border-color: #1e3a5f; color: white; }
    .swagger-ui .btn.authorize svg { fill: white; }
    .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #2563eb; }
    .swagger-ui .opblock.opblock-get  .opblock-summary { border-color: #16a34a; }
    .swagger-ui table thead tr td, .swagger-ui table thead tr th { color: #1e3a5f; }
  `,
  swaggerOptions: {
    persistAuthorization: true, // token stays after page refresh
    displayRequestDuration: true, // shows how long each request took
    filter: true, // search/filter endpoints box
    deepLinking: true, // URL updates as you open endpoints
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    docExpansion: "none", // all tags collapsed by default
    tryItOutEnabled: true, // "Try it out" enabled by default
    requestSnippetsEnabled: true, // shows curl/axios code snippets
    requestSnippets: {
      generators: {
        curl_bash: { title: "cURL (bash)", syntax: "bash" },
        node_fetch: { title: "Node (fetch)", syntax: "javascript" },
      },
      defaultExpanded: true,
    },
  },
};

// Serve raw OpenAPI JSON (useful for Postman import)
app.get("/api/docs/openapi.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Swagger UI
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerUiOptions),
);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: process.env.APP_NAME || "RAM Projects API",
    version: "2.0.0",
    docs: `http://localhost:${PORT}/api/docs`,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api", routes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Boot ─────────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();

  const { runMigrations } = require("./migrations");
  await runMigrations();
  await sequelize.sync({ alter: true });

  app.listen(PORT, () => {
    console.log(`\n🚀 RAM Projects API  →  http://localhost:${PORT}`);
    console.log(`📖 Swagger UI           →  http://localhost:${PORT}/api/docs`);
    console.log(
      `📄 OpenAPI JSON         →  http://localhost:${PORT}/api/docs/openapi.json`,
    );
    console.log(
      `🔑 Login                →  POST http://localhost:${PORT}/api/auth/login`,
    );
    console.log(`\nEnv: ${process.env.NODE_ENV || "development"}\n`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

module.exports = app;
