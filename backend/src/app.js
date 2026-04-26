import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import gpaRoutes from "./routes/gpaRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
  }),
);
app.use(express.json());

app.use("/api", systemRoutes);
app.use("/api/gpa", gpaRoutes);
app.use("/api/subjects", subjectRoutes);

export default app;
