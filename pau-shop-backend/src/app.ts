import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.use(cors());

// Stripe needs the raw body to verify webhook signatures, so this must
// run before the global JSON parser claims the request stream.
app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }));

app.use(express.json());
app.use("/api", routes);

app.use(errorHandler);

export default app;
