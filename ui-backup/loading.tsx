export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="h-6 w-2/3 bg-slate-200 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="rounded border p-4">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-28 bg-slate-200 rounded" />
              <div className="h-3 w-24 bg-slate-200 rounded" />
            </div>
            <div className="mt-4 h-8 w-24 bg-slate-300 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}


