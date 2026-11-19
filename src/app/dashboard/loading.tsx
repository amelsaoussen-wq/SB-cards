export default function DashboardLoading() {
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <div className="sb-skeleton h-3 w-28" />
        <div className="sb-skeleton h-9 w-72" />
        <div className="sb-skeleton h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="sb-panel p-5">
            <div className="sb-skeleton h-3 w-24" />
            <div className="sb-skeleton mt-3 h-7 w-16" />
            <div className="sb-skeleton mt-3 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <div className="sb-panel space-y-4 p-5">
          <div className="sb-skeleton h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="sb-skeleton h-64 w-full" />
            ))}
          </div>
        </div>
        <div className="sb-panel space-y-4 p-5">
          <div className="sb-skeleton h-5 w-36" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="sb-skeleton h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
