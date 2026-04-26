import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

export async function getSubjects() {
  const response = await api.get("/subjects");
  return response.data.subjects ?? [];
}

export async function importSubjects(subjects = []) {
  const response = await api.post("/subjects/import", { subjects });
  return response.data;
}
