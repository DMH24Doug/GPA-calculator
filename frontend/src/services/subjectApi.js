import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000/api";

const api = axios.create({
  baseURL: apiBaseUrl,
});

export async function getSubjects() {
  const response = await api.get("/subjects");
  return response.data.subjects ?? [];
}

export async function createSubject(subject) {
  const response = await api.post("/subjects", subject);
  return response.data.subject ?? null;
}

export async function importSubjects(subjects = []) {
  const response = await api.post("/subjects/import", { subjects });
  return response.data;
}

export async function deleteSubject(subjectId) {
  await api.delete(`/subjects/${subjectId}`);
}

export async function clearSubjects() {
  await api.delete("/subjects");
}
