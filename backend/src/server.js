import app from "./app.js";
import { env } from "./config/env.js";
import { runMigrations } from "./db/migrate.js";

async function startServer() {
  try {
    await runMigrations();
    console.log("Database migrations completed successfully.");

    app.listen(env.port, () => {
      console.log(`Backend server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start backend server:", error.message);
    process.exit(1);
  }
}

startServer();
