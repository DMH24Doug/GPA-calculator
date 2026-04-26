import { testDatabaseConnection } from "../db/mysql.js";

export function getHealthController(_request, response) {
  return response.json({ status: "ok" });
}

export async function getDatabaseHealthController(_request, response) {
  try {
    await testDatabaseConnection();

    return response.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    return response.status(500).json({
      status: "error",
      database: "disconnected",
      message: error.message,
    });
  }
}
