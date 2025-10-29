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

const app = express();

app.use(helmet());
/* FOR DEPLOYMENT
app.use(
  cors({
    origin: [
      "https://giewellzon-realty-pms-1.onrender.com",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
*/
app.use(
  cors({
    origin: [
      "https://giewellzon-realty-pms-1.onrender.com",
      "http://localhost:5173" /* Add your actual frontend domain here if it's different 
          from the Render domain, e.g., "https://your-frontend.com"
      */,
      "http://localhost:8081/",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true, // This is key for authentication
  })
);

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
