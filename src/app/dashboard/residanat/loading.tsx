export default function ResidanatLoading() {
  return <div role="status" aria-label="Chargement de l’espace Résidanat" className="mx-auto max-w-5xl space-y-6">
    <div className="space-y-3"><div className="sb-skeleton h-3 w-32" /><div className="sb-skeleton h-10 w-60" /><div className="sb-skeleton h-4 w-3/4" /></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((key) => <div key={key} className="sb-panel p-4"><div className="sb-skeleton h-3 w-24" /><div className="sb-skeleton mt-3 h-8 w-12" /></div>)}</div>
    <div className="sb-panel space-y-4 p-5"><div className="sb-skeleton h-10 w-full" />{[0, 1, 2, 3].map((key) => <div key={key} className="sb-skeleton h-14 w-full" />)}</div>
  </div>;
}
