import { Router } from "express";
import {
  clearSubjectsController,
  createSubjectController,
  deleteSubjectController,
  getSubjectsController,
  importSubjectsController,
} from "../controllers/subjectController.js";

const router = Router();

router.get("/", getSubjectsController);
router.post("/", createSubjectController);
router.post("/import", importSubjectsController);
router.delete("/:id", deleteSubjectController);
router.delete("/", clearSubjectsController);

export default router;
