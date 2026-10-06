import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

// Render (and any host) sits in front of the app as a proxy.
app.set("trust proxy", 1);

// Only the store's own site may call the API from a browser. Requests without
// an Origin (Stripe's webhooks, health checks, tests) aren't affected.
const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:5173", "http://localhost:5174"])
  ].filter(Boolean)
);
app.use(cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)) }));

// Render checks this before sending traffic to a new version.
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Stripe needs the raw body to verify webhook signatures, so this must
// run before the global JSON parser claims the request stream.
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));

app.use(express.json());
app.use("/api", routes);

app.use(errorHandler);

export default app;
