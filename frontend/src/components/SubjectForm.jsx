import { useState } from "react";

const GRADE_OPTIONS = [
  "A+",
  "A",
  "B+",
  "B",
  "C+",
  "C",
  "R",
  "D",
  "DX",
  "E",
  "EX",
  "SE",
  "FAIL",
  "NC",
  "NV",
  "PAS",
  "S",
  "U",
  "AEGROTAT PASS",
  "COMPASSIONATE PASS",
  "CREDIT TRANSFER",
];

const initialFormState = {
  courseCode: "",
  courseName: "",
  grade: "A",
};

function ScanIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 7V5h2M20 7V5h-2M4 17v2h2M20 17v2h-2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 12h10" strokeLinecap="round" />
      <path d="M9 9h6v6H9z" strokeLinejoin="round" />
    </svg>
  );
}

function SubjectForm({ onAddSubject, onLoadSampleData, onOpenScanner }) {
  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.courseCode.trim() || !formData.grade.trim()) {
      return;
    }

    onAddSubject(formData);
    setFormData(initialFormState);
  };

  return (
    <section className="border border-slate-300 bg-slate-50 p-4 transition-colors dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Add Subject
          </p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Add a subject
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onLoadSampleData}
            className="self-start border border-slate-300 bg-transparent px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            Load sample subjects
          </button>
          <button
            type="button"
            onClick={onOpenScanner}
            className="inline-flex items-center gap-1.5 self-start border border-slate-300 bg-transparent px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <ScanIcon />
            Scan
          </button>
        </div>
      </div>

      <form
        className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_110px_110px]"
        onSubmit={handleSubmit}
      >
        <label className="min-w-0 flex flex-col gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
          Course Code
          <input
            type="text"
            name="courseCode"
            value={formData.courseCode}
            onChange={handleChange}
            placeholder="e.g. CS101"
            className="border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-500"
          />
        </label>

        <label className="min-w-0 flex flex-col gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
          Course Name
          <input
            type="text"
            name="courseName"
            value={formData.courseName}
            onChange={handleChange}
            placeholder="Optional title"
            className="border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-500"
          />
        </label>

        <label className="min-w-0 flex flex-col gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
          Grade
          <select
            name="grade"
            value={formData.grade}
            onChange={handleChange}
            className="border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-500"
          >
            {GRADE_OPTIONS.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="mt-auto h-[34px] border border-slate-900 bg-slate-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-slate-800 dark:border-slate-200 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Add subject
        </button>
      </form>
    </section>
  );
}

export default SubjectForm;
