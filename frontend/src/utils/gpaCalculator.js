export const GRADE_POINTS = {
  "A+": 4.5,
  A: 4.0,
  "B+": 3.5,
  B: 3.0,
  "C+": 2.5,
  C: 2.0,
  R: 1.5,
  D: 1.0,
  DX: 1.0,
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

function normalizeGrade(grade = "") {
  return grade.trim().toUpperCase();
}

function normalizeCourseCode(courseCode = "") {
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

export function selectBestAttempts(subjects = []) {
  const bestByCourse = new Map();
  const subjectsWithoutCourseCode = [];
  const omittedRepeatedSubjects = [];

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

    if (!currentBest) {
      bestByCourse.set(normalizedCourseCode, attempt);
      return;
    }

    if (points > currentBest.gradePoints) {
      omittedRepeatedSubjects.push(currentBest);
      bestByCourse.set(normalizedCourseCode, attempt);
      return;
    }

    omittedRepeatedSubjects.push(attempt);
  });

  return {
    includedSubjects: [...bestByCourse.values(), ...subjectsWithoutCourseCode],
    omittedRepeatedSubjects,
  };
}

export function calculateGPA(subjects = []) {
  const { includedSubjects, omittedRepeatedSubjects } =
    selectBestAttempts(subjects);
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
    omittedRepeatedSubjects,
    excludedSubjects: subjects.filter((subject) => !isCountedForGPA(subject)),
  };
}
