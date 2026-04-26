function ConfirmToast({ isOpen, message, onConfirm, onCancel }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 p-4">
      <div className="w-full max-w-sm border border-slate-300 bg-white px-4 py-3 shadow-lg dark:border-slate-600 dark:bg-slate-700">
        <p className="text-sm text-slate-700 dark:text-slate-100">{message}</p>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-500 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmToast;
