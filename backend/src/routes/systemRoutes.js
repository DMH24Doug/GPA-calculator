import { Router } from "express";
import {
  getDatabaseHealthController,
  getHealthController,
} from "../controllers/systemController.js";

const router = Router();

router.get("/health", getHealthController);
router.get("/health/db", getDatabaseHealthController);

export default router;
