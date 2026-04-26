import { useEffect, useRef, useState } from "react";

function RemoveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const LEVEL_OPTIONS = [
  { value: "all", label: "All lvls" },
  { value: "100", label: "100 lvl" },
  { value: "200", label: "200 lvl" },
  { value: "300", label: "300 lvl" },
  { value: "400", label: "400 lvl" },
];

function createValidator() {
  return () => null;
}

function getStatusBadge(status) {
  const styles = {
    Counted:
      "bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-100",
    Excluded:
      "bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-100",
    "Repeated Lower Attempt":
      "bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-100",
  };

  return (
    styles[status] ?? "bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-100"
  );
}

function getStatusLabel(status) {
  const labels = {
    Counted: "Used",
    Excluded: "Skip",
    "Repeated Lower Attempt": "Repeat",
  };

  return labels[status] ?? status;
}

function GradeTable({
  subjects,
  onRequestRemoveSubject,
  selectedFilter,
  onChangeFilter,
  selectedLevel,
  onChangeLevel,
  counts,
  onClearAll,
  className = "",
}) {
  const [isLevelMenuOpen, setIsLevelMenuOpen] = useState(false);
  const levelMenuRef = useRef(null);
  const selectedLevelLabel =
    LEVEL_OPTIONS.find((option) => option.value === selectedLevel)?.label ??
    LEVEL_OPTIONS[0].label;

  useEffect(() => {
    if (!isLevelMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!levelMenuRef.current?.contains(event.target)) {
        setIsLevelMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsLevelMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLevelMenuOpen]);

  return (
    <section
      className={`overflow-visible rounded-md border border-slate-300 bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 ${className}`}
    >
      <div className="border-b border-slate-300 px-4 py-3 dark:border-slate-700">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Subject List
            </h2>
            <p className="mt-0.5 text-[10px] text-slate-600 dark:text-slate-300">
              Repeated courses only keep the highest grade in the GPA.
            </p>
          </div>

          <button
            type="button"
            aria-label="Clear all subjects"
            title="Clear all subjects"
            onClick={onClearAll}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 7h16" strokeLinecap="round" />
              <path
                d="M9 7V5h6v2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 7l1 12h8l1-12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M10 11v5M14 11v5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-2 flex items-center gap-1">
          <div className="grid min-w-0 flex-1 grid-cols-4 gap-1">
            {[
              { id: "all", label: "All" },
              { id: "counted", label: "Used" },
              { id: "excluded", label: "Skip" },
              { id: "repeated", label: "Repeat" },
            ].map((filter) => {
              const isActive = selectedFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => onChangeFilter(filter.id)}
                  className={`min-w-0 rounded px-1 py-px text-[8px] font-normal leading-3 transition ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500"
                  }`}
                >
                  <span className="inline-block origin-center scale-90">
                    {filter.label} ({counts[filter.id] ?? 0})
                  </span>
                </button>
              );
            })}
          </div>

          <div
            ref={levelMenuRef}
            className="relative z-10 w-20 shrink-0"
          >
            <button
              type="button"
              aria-label="Filter by course level"
              aria-expanded={isLevelMenuOpen}
              onClick={() => setIsLevelMenuOpen((currentValue) => !currentValue)}
              className="flex h-5 w-full items-center justify-between rounded border border-slate-300 bg-slate-100 px-1 text-[7px] font-normal text-slate-700 transition hover:bg-slate-200 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:focus:border-slate-400 dark:focus:ring-slate-500"
            >
              <span className="inline-block scale-90 origin-left">
                {selectedLevelLabel}
              </span>
              <span className="text-slate-500 dark:text-slate-300">
                <ChevronDownIcon />
              </span>
            </button>

            {isLevelMenuOpen ? (
              <div
                className="absolute right-0 top-[calc(100%+4px)] z-30 w-full overflow-hidden rounded border border-slate-300 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-700"
              >
                {LEVEL_OPTIONS.map((option) => {
                  const isActive = selectedLevel === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChangeLevel(option.value);
                        setIsLevelMenuOpen(false);
                      }}
                      className={`flex w-full items-center px-1 py-1 text-left text-[7px] transition ${
                        isActive
                          ? "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900"
                          : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                      }`}
                    >
                      <span className="inline-block scale-90 origin-left">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-12 text-center text-slate-500 dark:text-slate-400">
          Add your first subject to start calculating.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <table className="w-full table-fixed text-left text-xs text-slate-700 dark:text-slate-100">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[38%]" />
              <col className="w-[14%]" />
              <col className="w-[20%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-3 py-3">Course</th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Grade</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Act</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id} className="border-t border-slate-300 dark:border-slate-700">
                  <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-50">
                    {subject.courseCode || "No code"}
                  </td>
                  <td className="px-3 py-3 wrap-break-word">
                    {subject.courseName || "Untitled course"}
                  </td>
                  <td className="px-3 py-3">{subject.grade}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex max-w-full wrap-break-word rounded-md px-2 py-1 text-[11px] font-semibold ${getStatusBadge(
                        subject.status,
                      )}`}
                    >
                      {getStatusLabel(subject.status)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      aria-label={`Remove ${subject.courseCode || "subject"}`}
                      title="Remove subject"
                      onClick={() => onRequestRemoveSubject(subject)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      <RemoveIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

GradeTable.propTypes = {
  subjects: createValidator(),
  onRequestRemoveSubject: createValidator(),
  selectedFilter: createValidator(),
  onChangeFilter: createValidator(),
  selectedLevel: createValidator(),
  onChangeLevel: createValidator(),
  counts: createValidator(),
  onClearAll: createValidator(),
  className: createValidator(),
};

export default GradeTable;
