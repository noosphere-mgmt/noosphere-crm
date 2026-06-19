"use client";

export function DrawerLoadError({
  label,
  message,
  onClose,
}: {
  label: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-slate-900/10" aria-label="Close" onClick={onClose} />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white p-6 shadow-xl"
        role="alertdialog"
        aria-labelledby="drawer-load-error-title"
      >
        <h2 id="drawer-load-error-title" className="text-lg font-semibold text-slate-900">
          Could not open {label}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 self-start rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to list
        </button>
      </aside>
    </>
  );
}
