export const id = "001_create_subjects_table";

export async function up(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS subjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      course_code VARCHAR(20) NOT NULL,
      course_name VARCHAR(255) NOT NULL,
      grade VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
