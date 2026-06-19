export function OpportunitiesListError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-900">
      <p className="font-semibold">Could not load Opportunities</p>
      <p className="mt-2 text-red-800">{message}</p>
      <p className="mt-3 text-red-700">
        If you recently updated the app, run <code className="rounded bg-red-100 px-1">npm run db:migrate</code>{" "}
        and refresh.
      </p>
    </div>
  );
}
