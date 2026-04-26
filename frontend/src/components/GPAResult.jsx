function StatCard({ label, value, accentClass }) {
  return (
    <div className="rounded-md border border-slate-300 bg-slate-50 p-4 transition-colors dark:border-slate-700 dark:bg-slate-700/80">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-3 text-3xl font-semibold ${accentClass}`}>{value}</p>
    </div>
  );
}

function GPAResult({ result }) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      <StatCard
        label="Current GPA"
        value={result.gpa.toFixed(2)}
        accentClass="text-slate-900 dark:text-slate-50"
      />
      <StatCard
        label="Counted Courses"
        value={result.totalCourses}
        accentClass="text-slate-900 dark:text-slate-50"
      />
      <StatCard
        label="Total Grade Points"
        value={result.totalGradePoints.toFixed(1)}
        accentClass="text-slate-900 dark:text-slate-50"
      />
    </section>
  );
}

export default GPAResult;
