import express from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());
app.use(errorHandler);

app.use("/api", routes);

export default app;
