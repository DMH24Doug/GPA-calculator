import { runMigrations } from "./migrate.js";

try {
  await runMigrations();
  console.log("Database migrations completed successfully.");
  process.exit(0);
} catch (error) {
  console.error("Database migrations failed:", error.message);
  process.exit(1);
}
