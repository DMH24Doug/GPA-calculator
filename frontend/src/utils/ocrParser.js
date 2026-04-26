const COURSE_CODE_PATTERN = /\b[A-Z]{2,5}\s*-?\s*\d{3}[A-Z]?\b/g;

const GRADE_TOKENS = [
  "AEGROTAT PASS",
  "COMPASSIONATE PASS",
  "CREDIT TRANSFER",
  "FAIL",
  "IP",
  "A+",
  "B+",
  "C+",
  "DX",
  "EX",
  "SE",
  "NC",
  "NV",
  "PAS",
  "A",
  "B",
  "C",
  "R",
  "D",
  "E",
  "S",
  "U",
];

const LOCATION_TOKENS = ["SOLOMON ISLANDS", "LAUCALA"];
const DELIVERY_MODE_TOKENS = [
  "ONLINE",
  "BLENDED",
  "FACE TO FACE",
  "FACE-TO-FACE",
];

const COMMON_CODE_PREFIX_FIXES = [
  [/^[€$£]\s*/, "C"],
  [/^C8/, "CS"],
  [/^C&/, "CS"],
  [/^C5/, "CS"],
  [/^€S/, "CS"],
  [/^CSO/, "CS0"],
  [/^1S/, "IS"],
  [/^15/, "IS"],
  [/^18/, "IS"],
  [/^I8/, "IS"],
];

function normalizeSpacing(text = "") {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeGradeFormatting(text = "") {
  return text
    .replace(/\bA\s*\+\b/g, "A+")
    .replace(/\bB\s*\+\b/g, "B+")
    .replace(/\bC\s*\+\b/g, "C+")
    .replace(/\bBLENDED\s+P\b/g, "BLENDED IP")
    .replace(/\bFACE TO FACE\s+P\b/g, "FACE TO FACE IP")
    .replace(/\bONLINE\s+P\b/g, "ONLINE IP");
}

function normalizeCourseCode(courseCode = "") {
  let normalizedCode = courseCode.replace(/[\s-]+/g, "").toUpperCase();

  COMMON_CODE_PREFIX_FIXES.forEach(([pattern, replacement]) => {
    normalizedCode = normalizedCode.replace(pattern, replacement);
  });

  if (/^[A-Z]{2,3}\d{2}$/.test(normalizedCode)) {
    normalizedCode = `${normalizedCode}1`;
  }

  return normalizedCode;
}

function escapeForRegex(text = "") {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findGrade(line = "") {
  const normalizedLine = normalizeGradeFormatting(line.toUpperCase());

  return (
    GRADE_TOKENS.find((token) => {
      const escapedToken = token.replace(/[+]/g, "\\$&");
      const pattern = new RegExp(`(^|[^A-Z0-9])${escapedToken}([^A-Z0-9]|$)`);
      return pattern.test(normalizedLine);
    }) ?? null
  );
}

function removeKnownTrailingColumns(text = "") {
  let cleanedText = text;

  [...LOCATION_TOKENS, ...DELIVERY_MODE_TOKENS].forEach((token) => {
    const tokenPattern = new RegExp(`${escapeForRegex(token)}$`);
    cleanedText = cleanedText.replace(tokenPattern, "").trim();
  });

  return cleanedText.trim();
}

function fixCommonOcrCourseTokens(text = "") {
  return text
    .replace(/\b[€$£](CS?\d{3}[A-Z]?)\b/g, "C$1")
    .replace(/\b[€$£]S(\d{3}[A-Z]?)\b/g, "CS$1")
    .replace(/\bC8(\d{3}[A-Z]?)\b/g, "CS$1")
    .replace(/\bC&(\d{3}[A-Z]?)\b/g, "CS$1")
    .replace(/\bC5(\d{3}[A-Z]?)\b/g, "CS$1")
    .replace(/\b18(\d{3}[A-Z]?)\b/g, "IS$1")
    .replace(/\b15(\d{3}[A-Z]?)\b/g, "IS$1")
    .replace(/\bI8(\d{3}[A-Z]?)\b/g, "IS$1")
    .replace(/\b1S(\d{3}[A-Z]?)\b/g, "IS$1")
    .replace(/\bCS(\d{2})\b/g, "CS$11")
    .replace(/\bIS(\d{2})\b/g, "IS$11")
    .replace(/\bUU(\d{2})\b/g, "UU$10");
}

function buildCourseName(line, courseCode, grade) {
  const withoutCode = line.replace(courseCode, " ");
  const withoutTrailingGrade = grade
    ? withoutCode.replace(new RegExp(`${escapeForRegex(grade)}$`), " ")
    : withoutCode;

  return normalizeSpacing(
    removeKnownTrailingColumns(withoutTrailingGrade)
      .replace(/[|/\\]+/g, " ")
      .replace(/[‘’']/g, " ")
      .replace(/\s{2,}/g, " "),
  );
}

function parseSegment(segment, segmentIndex) {
  const normalizedLine = normalizeGradeFormatting(normalizeSpacing(segment));

  if (!normalizedLine) {
    return null;
  }

  const leadingCourseCode = normalizedLine.match(
    new RegExp(`^${COURSE_CODE_PATTERN.source}`),
  )?.[0];
  const trailingGrade = normalizedLine.match(
    new RegExp(
      `(?:${GRADE_TOKENS.map((token) => escapeForRegex(token)).join("|")})$`,
    ),
  )?.[0];
  const grade = trailingGrade ?? findGrade(normalizedLine);

  if (!leadingCourseCode || !grade) {
    return null;
  }

  return {
    id: `ocr-${segmentIndex}-${normalizeCourseCode(leadingCourseCode)}`,
    courseCode: normalizeCourseCode(leadingCourseCode),
    courseName: buildCourseName(normalizedLine, leadingCourseCode, grade),
    grade,
    sourceLine: normalizedLine,
  };
}

function splitIntoCourseSegments(text = "") {
  const normalizedText = normalizeGradeFormatting(
    fixCommonOcrCourseTokens(
      text
        .toUpperCase()
        .replace(/\r/g, "\n")
        .replace(/[|]/g, " ")
        .replace(/[ \t]+/g, " "),
    ),
  );

  const matches = [...normalizedText.matchAll(COURSE_CODE_PATTERN)];

  if (matches.length === 0) {
    return [];
  }

  return matches.map((match, index) => {
    const startIndex = match.index ?? 0;
    const endIndex =
      index + 1 < matches.length
        ? matches[index + 1].index
        : normalizedText.length;

    return normalizedText.slice(startIndex, endIndex).trim();
  });
}

function parseLine(line, lineIndex) {
  const parsedSegment = parseSegment(
    normalizeGradeFormatting(
      fixCommonOcrCourseTokens(normalizeSpacing(line.toUpperCase())),
    ),
    lineIndex,
  );

  return parsedSegment ? [parsedSegment] : [];
}

function parseDenseText(text = "") {
  const segments = splitIntoCourseSegments(text);

  return segments.flatMap((segment, index) => {
    const parsedSegment = parseSegment(segment, index);
    return parsedSegment ? [parsedSegment] : [];
  });
}

export function parseOCRRows(lines = []) {
  const parsedSubjects = lines.flatMap((line, index) => parseLine(line, index));
  const seen = new Set();

  return parsedSubjects.filter((subject) => {
    const key = `${subject.courseCode}-${subject.grade}-${subject.sourceLine}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function parseOCRText(text = "") {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeSpacing(line))
    .filter(Boolean);

  const parsedSubjects = [...parseDenseText(text), ...parseOCRRows(lines)];
  const seen = new Set();

  return parsedSubjects.filter((subject) => {
    const key = `${subject.courseCode}-${subject.grade}-${subject.sourceLine}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
