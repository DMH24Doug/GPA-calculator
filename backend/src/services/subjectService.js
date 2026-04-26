import { dbPool } from "../config/database.js";

function normalizeSubject(subject = {}) {
  return {
    courseCode: String(subject.courseCode ?? "").trim().toUpperCase(),
    courseName: String(subject.courseName ?? "").trim(),
    grade: String(subject.grade ?? "").trim().toUpperCase(),
  };
}

function isValidSubject(subject) {
  return subject.courseCode && subject.grade;
}

export async function importSubjects(subjects = []) {
  const normalizedSubjects = subjects
    .map(normalizeSubject)
    .filter(isValidSubject);

  if (normalizedSubjects.length === 0) {
    return {
      importedCount: 0,
      skippedCount: subjects.length,
      subjects: [],
    };
  }

  const values = normalizedSubjects.map((subject) => [
    subject.courseCode,
    subject.courseName || subject.courseCode,
    subject.grade,
  ]);

  await dbPool.query(
    `
      INSERT INTO subjects (course_code, course_name, grade)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        course_name = VALUES(course_name)
    `,
    [values],
  );

  return {
    importedCount: normalizedSubjects.length,
    skippedCount: subjects.length - normalizedSubjects.length,
    subjects: normalizedSubjects,
  };
}

export async function getSubjects() {
  const [rows] = await dbPool.query(`
    SELECT
      id,
      course_code AS courseCode,
      course_name AS courseName,
      grade,
      created_at AS createdAt
    FROM subjects
    ORDER BY created_at DESC, id DESC
  `);

  return rows;
}
