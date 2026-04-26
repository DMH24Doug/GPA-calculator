import { dbPool } from "../config/database.js";

export async function testDatabaseConnection() {
  const connection = await dbPool.getConnection();

  try {
    await connection.ping();
    return { connected: true };
  } finally {
    connection.release();
  }
}
