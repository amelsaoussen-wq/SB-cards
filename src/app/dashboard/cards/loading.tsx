export default function CardsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="sb-skeleton h-3 w-24" />
        <div className="sb-skeleton h-9 w-64" />
        <div className="sb-skeleton h-4 w-full max-w-2xl" />
      </div>
      <div className="sb-panel flex flex-col gap-3 p-3.5 lg:flex-row">
        <div className="sb-skeleton h-11 flex-1" />
        <div className="sb-skeleton h-11 w-56" />
        <div className="sb-skeleton h-11 w-44" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="sb-panel flex gap-4 p-4">
            <div className="sb-skeleton h-40 w-[112px] shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <div className="sb-skeleton h-6 w-24" />
                <div className="sb-skeleton h-6 w-32" />
              </div>
              <div className="sb-skeleton h-5 w-2/3" />
              <div className="sb-skeleton h-4 w-full" />
              <div className="sb-skeleton h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
