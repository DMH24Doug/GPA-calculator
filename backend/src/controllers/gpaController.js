import { calculateGPAResult } from "../services/gpaService.js";

export function calculateGPAController(request, response) {
  const { subjects = [] } = request.body ?? {};

  if (!Array.isArray(subjects)) {
    return response.status(400).json({
      message: "The 'subjects' field must be an array.",
    });
  }

  const result = calculateGPAResult(subjects);

  return response.json(result);
}
