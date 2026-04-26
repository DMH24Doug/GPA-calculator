export const GRADE_POINTS = {
  "A+": 4.5,
  A: 4,
  "B+": 3.5,
  B: 3,
  "C+": 2.5,
  C: 2,
  R: 1.5,
  D: 1,
  DX: 1,
  E: 0,
  EX: 0,
};

export const EXCLUDED_GRADES = new Set([
  "AEGROTAT PASS",
  "COMPASSIONATE PASS",
  "CREDIT TRANSFER",
  "SE",
  "FAIL",
  "NC",
  "NV",
  "PAS",
  "S",
  "U",
]);

export function normalizeGrade(grade = "") {
  return grade.trim().toUpperCase();
}

export function normalizeCourseCode(courseCode = "") {
  return courseCode.trim().toUpperCase();
}

export function getGradePoints(grade) {
  const normalizedGrade = normalizeGrade(grade);
  return GRADE_POINTS[normalizedGrade];
}

export function isExcludedGrade(grade, courseCode = "") {
  const normalizedGrade = normalizeGrade(grade);
  const normalizedCourseCode = normalizeCourseCode(courseCode);

  if (normalizedCourseCode === "EL001") {
    return true;
  }

  return EXCLUDED_GRADES.has(normalizedGrade);
}

export function isCountedForGPA(subject = {}) {
  const { grade, courseCode } = subject;

  if (!grade) {
    return false;
  }

  if (isExcludedGrade(grade, courseCode)) {
    return false;
  }

  return getGradePoints(grade) !== undefined;
}
