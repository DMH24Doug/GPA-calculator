import { Router } from "express";
import {
  getSubjectsController,
  importSubjectsController,
} from "../controllers/subjectController.js";

const router = Router();

router.get("/", getSubjectsController);
router.post("/import", importSubjectsController);

export default router;
