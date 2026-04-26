export const id = "002_add_subject_course_grade_unique_key";

export async function up(connection) {
  await connection.execute(`
    ALTER TABLE subjects
    ADD UNIQUE KEY uq_subjects_course_grade (course_code, grade)
  `);
}
