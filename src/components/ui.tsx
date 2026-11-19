import type { ReactNode } from "react";
import { CLUE_TONES } from "@/lib/constants";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-blush-500">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1.5 font-serif text-[1.75rem] font-bold leading-tight tracking-tight text-plum-900 sm:text-[2.1rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-plum-900/60">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
}) {
  return (
    <div className="sb-panel flex items-start justify-between gap-3 p-4 sm:p-5">
      <div className="min-w-0">
        <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-plum-900/45">
          {label}
        </p>
        <p className="mt-1.5 font-serif text-[1.7rem] font-bold leading-none text-plum-900">
          {value}
        </p>
        {hint && <p className="mt-1.5 truncate text-xs text-plum-900/50">{hint}</p>}
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blush-100 text-blush-600">
        {icon}
      </span>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const published = status === "published";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-bold ${
        published
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          published ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {published ? "Publiée" : "Brouillon"}
    </span>
  );
}

export function ClueDots({ count = 6 }: { count?: number }) {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {CLUE_TONES.slice(0, count).map((tone) => (
        <span
          key={tone.name}
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: tone.circle }}
        />
      ))}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon = "✦",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-blush-300 bg-white/70 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(140deg,#fbe4ef,#f7d0e3)] text-2xl text-blush-600 ring-1 ring-blush-200">
        {icon}
      </span>
      <h2 className="mt-4 font-serif text-xl font-bold text-plum-900">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-plum-900/60">
        {description}
      </p>
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function SectionTitle({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="font-serif text-lg font-bold text-plum-900">{title}</h2>
        {hint && <p className="text-xs text-plum-900/50">{hint}</p>}
      </div>
      {action}
    </div>
  );
}
