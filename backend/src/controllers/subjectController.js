import {
  clearSubjects,
  createSubject,
  deleteSubject,
  getSubjects,
  importSubjects,
} from "../services/subjectService.js";

export async function createSubjectController(request, response) {
  try {
    const subject = await createSubject(request.body ?? {});

    return response.status(201).json({ subject });
  } catch (error) {
    const statusCode = error.message.includes("required") ? 400 : 500;

    return response.status(statusCode).json({
      message: "Failed to save subject.",
      error: error.message,
    });
  }
}

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

export async function deleteSubjectController(request, response) {
  try {
    const deleted = await deleteSubject(request.params.id);

    if (!deleted) {
      return response.status(404).json({
        message: "Subject not found.",
      });
    }

    return response.status(204).send();
  } catch (error) {
    const statusCode = error.message.includes("valid subject id") ? 400 : 500;

    return response.status(statusCode).json({
      message: "Failed to delete subject.",
      error: error.message,
    });
  }
}

export async function clearSubjectsController(_request, response) {
  try {
    await clearSubjects();
    return response.status(204).send();
  } catch (error) {
    return response.status(500).json({
      message: "Failed to clear subjects.",
      error: error.message,
    });
  }
}
