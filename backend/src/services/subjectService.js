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

export async function createSubject(subject = {}) {
  const normalizedSubject = normalizeSubject(subject);

  if (!isValidSubject(normalizedSubject)) {
    throw new Error("A subject must include at least a course code and grade.");
  }

  const [result] = await dbPool.query(
    `
      INSERT INTO subjects (course_code, course_name, grade)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        course_name = VALUES(course_name),
        id = LAST_INSERT_ID(id)
    `,
    [
      normalizedSubject.courseCode,
      normalizedSubject.courseName || normalizedSubject.courseCode,
      normalizedSubject.grade,
    ],
  );

  const [rows] = await dbPool.query(
    `
      SELECT
        id,
        course_code AS courseCode,
        course_name AS courseName,
        grade,
        created_at AS createdAt
      FROM subjects
      WHERE id = ?
      LIMIT 1
    `,
    [result.insertId],
  );

  return rows[0] ?? null;
}

export async function deleteSubject(subjectId) {
  const parsedId = Number(subjectId);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error("A valid subject id is required.");
  }

  const [result] = await dbPool.query("DELETE FROM subjects WHERE id = ?", [
    parsedId,
  ]);

  return result.affectedRows > 0;
}

export async function clearSubjects() {
  await dbPool.query("DELETE FROM subjects");
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
