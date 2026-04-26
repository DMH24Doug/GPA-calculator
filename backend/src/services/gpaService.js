import {
  getGradePoints,
  isCountedForGPA,
  normalizeCourseCode,
} from "../models/gradeModel.js";

export function selectBestAttempts(subjects = []) {
  const bestByCourse = new Map();
  const subjectsWithoutCourseCode = [];

  subjects.forEach((subject) => {
    if (!isCountedForGPA(subject)) {
      return;
    }

    const points = getGradePoints(subject.grade);
    const normalizedCourseCode = normalizeCourseCode(subject.courseCode);
    const attempt = { ...subject, gradePoints: points };

    if (!normalizedCourseCode) {
      subjectsWithoutCourseCode.push(attempt);
      return;
    }

    const currentBest = bestByCourse.get(normalizedCourseCode);

    if (!currentBest || points > currentBest.gradePoints) {
      bestByCourse.set(normalizedCourseCode, attempt);
    }
  });

  return [...bestByCourse.values(), ...subjectsWithoutCourseCode];
}

export function calculateGPAResult(subjects = []) {
  const includedSubjects = selectBestAttempts(subjects);
  const totalGradePoints = includedSubjects.reduce(
    (sum, subject) => sum + subject.gradePoints,
    0,
  );
  const totalCourses = includedSubjects.length;
  const gpa = totalCourses === 0 ? 0 : totalGradePoints / totalCourses;

  return {
    gpa,
    totalGradePoints,
    totalCourses,
    includedSubjects,
    excludedSubjects: subjects.filter((subject) => !isCountedForGPA(subject)),
  };
}
