import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { dbPool } from "../config/database.js";

const migrationsDirectory = path.resolve("src/db/migrations");

async function ensureMigrationsTable(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrationIds(connection) {
  const [rows] = await connection.query(
    "SELECT id FROM migrations ORDER BY applied_at ASC",
  );

  return new Set(rows.map((row) => row.id));
}

async function loadMigrationModules() {
  const files = await readdir(migrationsDirectory);
  const migrationFiles = files
    .filter((fileName) => fileName.endsWith(".js"))
    .sort((left, right) => left.localeCompare(right));

  const migrations = [];

  for (const fileName of migrationFiles) {
    const filePath = path.join(migrationsDirectory, fileName);
    const moduleUrl = pathToFileURL(filePath).href;
    const migrationModule = await import(moduleUrl);

    migrations.push({
      id: migrationModule.id,
      up: migrationModule.up,
      fileName,
    });
  }

  return migrations;
}

export async function runMigrations() {
  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();
    await ensureMigrationsTable(connection);

    const appliedMigrationIds = await getAppliedMigrationIds(connection);
    const migrations = await loadMigrationModules();

    for (const migration of migrations) {
      if (appliedMigrationIds.has(migration.id)) {
        continue;
      }

      await migration.up(connection);
      await connection.execute("INSERT INTO migrations (id) VALUES (?)", [
        migration.id,
      ]);
      console.log(`Applied migration: ${migration.id}`);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
