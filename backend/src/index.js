// Load env ASAP
require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connect = require("./configs/db");
const routes = require("./routes");

const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

console.log(
  "[ENV] ALLOWED_ADMIN_EMAILS =",
  process.env.ALLOWED_ADMIN_EMAILS || "(empty)"
);

// --- CORS Configuration from .env ---
// Read the comma-separated list from .env
const allowedOriginsEnv = process.env.CORS_ALLOWED_ORIGINS || "";

// Define default origins for development
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:8081", // Removed trailing slash
];

// Split the .env string by comma, trim whitespace, and filter out empty strings
const allowedOrigins = allowedOriginsEnv
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin) // Removes any empty strings
  .concat(defaultOrigins); // Always include defaults for local dev

console.log("[CORS] Allowed Origins:", allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};
// --- End of CORS Configuration ---

const app = express();

app.use(helmet());

// Use the new corsOptions
app.use(cors(corsOptions));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(requestLogger);

app.get("/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

// Static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// API routes
app.get("/api", (req, res) => res.json({ status: "ok", base: "/api" }));
app.use("/api", routes);

// 404 + error
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connect()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`API running at http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("[DB] Connection error:", err);
    process.exit(1);
  });

module.exports = app;
