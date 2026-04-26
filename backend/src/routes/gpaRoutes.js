import { Router } from "express";
import { calculateGPAController } from "../controllers/gpaController.js";

const router = Router();

router.post("/calculate", calculateGPAController);

export default router;
