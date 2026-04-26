import { getSubjects, importSubjects } from "../services/subjectService.js";

export async function importSubjectsController(request, response) {
  const { subjects = [] } = request.body ?? {};

  if (!Array.isArray(subjects)) {
    return response.status(400).json({
      message: "The 'subjects' field must be an array.",
    });
  }

  try {
    const result = await importSubjects(subjects);
    return response.status(201).json(result);
  } catch (error) {
    return response.status(500).json({
      message: "Failed to import subjects.",
      error: error.message,
    });
  }
}

export async function getSubjectsController(_request, response) {
  try {
    const subjects = await getSubjects();
    return response.json({ subjects });
  } catch (error) {
    return response.status(500).json({
      message: "Failed to load subjects.",
      error: error.message,
    });
  }
}
