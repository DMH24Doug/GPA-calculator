import { useEffect, useRef, useState } from "react";
import GPAResult from "../components/GPAResult";
import ConfirmToast from "../components/ConfirmToast";
import GradeTable from "../components/GradeTable";
import ImageScanner from "../components/ImageScanner";
import SubjectForm from "../components/SubjectForm";
import { sampleSubjects } from "../data/sampleSubjects";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  clearSubjects as clearSubjectsInApi,
  createSubject as createSubjectInApi,
  deleteSubject as deleteSubjectInApi,
  getSubjects as getSubjectsFromApi,
  importSubjects as importSubjectsToApi,
} from "../services/subjectApi";
import { calculateGPA } from "../utils/gpaCalculator";

function IconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-100 dark:hover:bg-slate-700 dark:hover:text-white"
    >
      {children}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M22 12h-2.5M4.5 12H2M19.07 4.93l-1.77 1.77M6.7 17.3l-1.77 1.77M19.07 19.07 17.3 17.3M6.7 6.7 4.93 4.93" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function createSubjectRecord(subject) {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    courseCode: (subject.courseCode ?? "").trim().toUpperCase(),
    courseName: (subject.courseName ?? "").trim(),
    grade: (subject.grade ?? "").trim().toUpperCase(),
  };
}

function createDatabaseSubjectRecord(subject) {
  return {
    id: `db-${subject.id}`,
    dbId: subject.id,
    courseCode: (subject.courseCode ?? "").trim().toUpperCase(),
    courseName: (subject.courseName ?? "").trim(),
    grade: (subject.grade ?? "").trim().toUpperCase(),
  };
}

function isSameCourseAndGrade(leftSubject, rightSubject) {
  return (
    leftSubject.courseCode === rightSubject.courseCode &&
    leftSubject.grade === rightSubject.grade
  );
}

function filterNewUniqueSubjects(existingSubjects, incomingSubjects) {
  return incomingSubjects.filter((incomingSubject, incomingIndex) => {
    const alreadyExists = existingSubjects.some((existingSubject) =>
      isSameCourseAndGrade(existingSubject, incomingSubject),
    );
    const alreadyIncludedEarlier = incomingSubjects
      .slice(0, incomingIndex)
      .some((previousSubject) =>
        isSameCourseAndGrade(previousSubject, incomingSubject),
      );

    return !alreadyExists && !alreadyIncludedEarlier;
  });
}

function mergeDatabaseSubjects(existingSubjects, databaseSubjects) {
  const databaseRecords = databaseSubjects.map(createDatabaseSubjectRecord);
  const localOnlySubjects = existingSubjects.filter((subject) => !subject.dbId);
  const deduplicatedLocalSubjects = filterNewUniqueSubjects(
    databaseRecords,
    localOnlySubjects,
  );

  return [...deduplicatedLocalSubjects, ...databaseRecords];
}

function mapSubjectsByStatus(result, subjects) {
  const countedIds = new Set(result.includedSubjects.map((subject) => subject.id));
  const excludedIds = new Set(result.excludedSubjects.map((subject) => subject.id));
  const repeatedIds = new Set(
    result.omittedRepeatedSubjects.map((subject) => subject.id),
  );

  return subjects.map((subject) => {
    if (countedIds.has(subject.id)) {
      return { ...subject, status: "Counted" };
    }

    if (repeatedIds.has(subject.id)) {
      return { ...subject, status: "Repeated Lower Attempt" };
    }

    if (excludedIds.has(subject.id)) {
      return { ...subject, status: "Excluded" };
    }

    return { ...subject, status: "Excluded" };
  });
}

function filterSubjects(subjects, selectedFilter) {
  if (selectedFilter === "counted") {
    return subjects.filter((subject) => subject.status === "Counted");
  }

  if (selectedFilter === "excluded") {
    return subjects.filter((subject) => subject.status === "Excluded");
  }

  if (selectedFilter === "repeated") {
    return subjects.filter(
      (subject) => subject.status === "Repeated Lower Attempt",
    );
  }

  return subjects;
}

function getCourseLevel(courseCode = "") {
  const normalizedCode = String(courseCode).trim().toUpperCase();
  const match = normalizedCode.match(/(\d{3})[A-Z]?$/);

  if (!match) {
    return "other";
  }

  return `${match[1][0]}00`;
}

function filterSubjectsByLevel(subjects, selectedLevel) {
  if (selectedLevel === "all") {
    return subjects;
  }

  return subjects.filter(
    (subject) => getCourseLevel(subject.courseCode) === selectedLevel,
  );
}

function Dashboard() {
  const [subjects, setSubjects, clearSubjects] = useLocalStorage(
    "gpa-subjects",
    [],
  );
  const initialLocalSubjectCountRef = useRef(subjects.length);
  const [theme, setTheme] = useLocalStorage("gpa-theme", "light");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [confirmToast, setConfirmToast] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });

  const result = calculateGPA(subjects);
  const subjectsWithStatus = mapSubjectsByStatus(result, subjects);
  const visibleSubjects = filterSubjectsByLevel(
    filterSubjects(subjectsWithStatus, selectedFilter),
    selectedLevel,
  );

  const counts = {
    all: subjectsWithStatus.length,
    counted: subjectsWithStatus.filter((subject) => subject.status === "Counted")
      .length,
    excluded: subjectsWithStatus.filter(
      (subject) => subject.status === "Excluded",
    ).length,
    repeated: subjectsWithStatus.filter(
      (subject) => subject.status === "Repeated Lower Attempt",
    ).length,
  };

  const showStatusMessage = (type, message) => {
    setStatusMessage({ type, message });
  };

  const syncSubjectsFromDatabase = async () => {
    const apiSubjects = await getSubjectsFromApi();
    setSubjects((currentSubjects) =>
      mergeDatabaseSubjects(currentSubjects, apiSubjects),
    );
  };

  const handleAddSubject = async (subject) => {
    const nextSubject = createSubjectRecord(subject);

    const uniqueSubjects = filterNewUniqueSubjects(subjects, [nextSubject]);

    if (uniqueSubjects.length === 0) {
      showStatusMessage("info", "That subject and grade is already in the list.");
      return;
    }

    try {
      await createSubjectInApi(nextSubject);
      await syncSubjectsFromDatabase();
      showStatusMessage("success", "Subject saved to the database.");
    } catch {
      setSubjects((currentSubjects) => [...uniqueSubjects, ...currentSubjects]);
      showStatusMessage(
        "warning",
        "Backend unavailable, so this subject was saved only in your browser.",
      );
    }
  };

  const handleRemoveSubject = async (subject) => {
    if (!subject.dbId) {
      setSubjects((currentSubjects) =>
        currentSubjects.filter((currentSubject) => currentSubject.id !== subject.id),
      );
      showStatusMessage("success", "Subject removed from the current list.");
      return;
    }

    try {
      await deleteSubjectInApi(subject.dbId);
      await syncSubjectsFromDatabase();
      showStatusMessage("success", "Subject removed.");
    } catch {
      showStatusMessage(
        "error",
        "Could not remove that subject from the database right now.",
      );
    }
  };

  const handleClearAllSubjects = async () => {
    const hasDatabaseSubjects = subjects.some((subject) => subject.dbId);

    if (!hasDatabaseSubjects) {
      clearSubjects();
      showStatusMessage("success", "Subject list cleared.");
      return;
    }

    try {
      await clearSubjectsInApi();
      clearSubjects();
      showStatusMessage("success", "All database subjects were cleared.");
    } catch {
      showStatusMessage(
        "error",
        "Could not clear subjects from the database right now.",
      );
    }
  };

  const closeConfirmToast = () => {
    setConfirmToast({
      isOpen: false,
      message: "",
      onConfirm: null,
    });
  };

  const openConfirmToast = (message, onConfirm) => {
    setConfirmToast({
      isOpen: true,
      message,
      onConfirm,
    });
  };

  const handleConfirmDelete = () => {
    confirmToast.onConfirm?.();
    closeConfirmToast();
  };

  const handleLoadSampleData = () => {
    setSubjects(sampleSubjects);
    showStatusMessage(
      "info",
      "Sample subjects loaded locally. They are not saved to the database until you add or import them there.",
    );
  };

  const handleImportScannedSubjects = async (scannedSubjects) => {
    const nextSubjects = scannedSubjects.map((subject) =>
      createSubjectRecord(subject),
    );

    try {
      await importSubjectsToApi(nextSubjects);
      await syncSubjectsFromDatabase();
      setIsScannerOpen(false);
      showStatusMessage("success", "Scanned subjects imported to the database.");
    } catch (error) {
      console.error("Failed to import scanned subjects to database:", error);
      showStatusMessage(
        "error",
        "Could not save scanned subjects to the database. Please check that the backend and MySQL are running.",
      );
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadInitialSubjects = async () => {
      try {
        const apiSubjects = await getSubjectsFromApi();

        if (!isActive) {
          return;
        }

        if (apiSubjects.length > 0 || initialLocalSubjectCountRef.current === 0) {
          setSubjects((currentSubjects) =>
            mergeDatabaseSubjects(currentSubjects, apiSubjects),
          );
        }

        showStatusMessage("success", "Connected to the database.");
      } catch {
        if (!isActive) {
          return;
        }

        showStatusMessage(
          "warning",
          "Backend not reachable. The app is using browser storage for now.",
        );
      }
    };

    loadInitialSubjects();

    return () => {
      isActive = false;
    };
  }, [setSubjects]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (!confirmToast.isOpen) {
      return undefined;
    }

    const timeoutId = globalThis.setTimeout(() => {
      closeConfirmToast();
    }, 5000);

    return () => globalThis.clearTimeout(timeoutId);
  }, [confirmToast.isOpen]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }

    const timeoutId = globalThis.setTimeout(() => {
      setStatusMessage(null);
    }, 4500);

    return () => globalThis.clearTimeout(timeoutId);
  }, [statusMessage]);

  return (
    <>
      <main className="mx-auto flex h-screen w-full max-w-7xl flex-col gap-4 overflow-hidden px-4 py-4 text-slate-900 transition-colors sm:px-6 lg:px-8 dark:text-slate-100">
        <section className="grid h-full min-h-0 gap-4 lg:grid-cols-2">
          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/96 shadow-[0_18px_40px_rgba(148,163,184,0.14)] backdrop-blur-sm transition-colors dark:border-slate-700 dark:bg-slate-800/95">
            <div className="border-b border-slate-300 px-5 py-4 dark:border-slate-700">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="max-w-3xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Dashboard
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
                    GPA Calculator
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Add subjects, scan result sheets, and track which grades count
                    toward your GPA under your official rules.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-md border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                      A+ = 4.5
                    </span>
                    <span className="rounded-md border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                      EL001 excluded
                    </span>
                    <span className="rounded-md border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
                      Highest repeat only
                    </span>
                  </div>

                  {statusMessage ? (
                    <div
                      className={`mt-3 border px-3 py-2 text-xs ${
                        statusMessage.type === "error"
                          ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
                          : statusMessage.type === "warning"
                            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                            : statusMessage.type === "success"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                              : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-700/70 dark:text-slate-100"
                      }`}
                    >
                      {statusMessage.message}
                    </div>
                  ) : null}
                </div>

                <IconButton
                  label={theme === "dark" ? "Light mode" : "Dark mode"}
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                </IconButton>
              </div>
            </div>

            <div className="border-b border-slate-300 p-4 dark:border-slate-700">
              <GPAResult result={result} />
            </div>

            <div className="p-4">
              <SubjectForm
                onAddSubject={handleAddSubject}
                onLoadSampleData={handleLoadSampleData}
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            </div>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/96 shadow-[0_18px_40px_rgba(148,163,184,0.14)] backdrop-blur-sm transition-colors dark:border-slate-700 dark:bg-slate-800/95">
            <div className="min-h-0 flex-1 p-4">
              <GradeTable
                className="flex h-full min-h-0 flex-1 flex-col border-0 bg-transparent"
                subjects={visibleSubjects}
                selectedFilter={selectedFilter}
                onChangeFilter={setSelectedFilter}
                selectedLevel={selectedLevel}
                onChangeLevel={setSelectedLevel}
                counts={counts}
                onClearAll={() =>
                  openConfirmToast(
                    "Delete all subjects from this list?",
                    handleClearAllSubjects,
                  )
                }
                onRequestRemoveSubject={(subject) =>
                  openConfirmToast(
                    `Delete ${subject.courseCode || "this subject"} from the list?`,
                    () => handleRemoveSubject(subject),
                  )
                }
              />
            </div>
          </div>
        </section>
      </main>

      {isScannerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-300 px-5 py-4 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Image Scanner
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Upload a results image and import detected subjects.
                </p>
              </div>
              <IconButton
                label="Close scanner"
                onClick={() => setIsScannerOpen(false)}
              >
                <CloseIcon />
              </IconButton>
            </div>

            <div className="max-h-[calc(90vh-78px)] overflow-auto p-4">
              <ImageScanner onImportSubjects={handleImportScannedSubjects} />
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmToast
        isOpen={confirmToast.isOpen}
        message={confirmToast.message}
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmToast}
      />
    </>
  );
}

export default Dashboard;
