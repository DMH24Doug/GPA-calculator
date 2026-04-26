const FILTERS = [
  { id: "all", label: "All" },
  { id: "counted", label: "Counted" },
  { id: "excluded", label: "Excluded" },
  { id: "repeated", label: "Repeated" },
];

function GradeFilter({ selectedFilter, onChange, counts }) {
  return (
    <section className="min-w-0 rounded-md border border-slate-300 bg-slate-50 p-3 transition-colors dark:border-slate-700 dark:bg-slate-700/80">
      <div className="grid grid-cols-4 gap-2">
        {FILTERS.map((filter) => {
          const isActive = selectedFilter === filter.id;

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onChange(filter.id)}
              className={`min-w-0 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500"
              }`}
            >
              {filter.label} ({counts[filter.id] ?? 0})
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default GradeFilter;
