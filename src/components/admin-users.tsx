"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  cards: number;
};

export function AdminUsers({ rows, selfId }: { rows: Row[]; selfId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(id: string) {
    if (!confirm("Supprimer ce compte et toutes ses cartes ?")) return;
    setBusy(id);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" }).catch(() => undefined);
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="sb-panel overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-blush-50 text-[0.68rem] uppercase tracking-wider text-plum-900/50">
          <tr>
            <th className="px-4 py-3">Membre</th>
            <th className="px-4 py-3">Cartes</th>
            <th className="px-4 py-3">Rôle</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-blush-100">
              <td className="px-4 py-3">
                <span className="block font-semibold text-plum-900">{r.name}</span>
                <span className="block text-xs text-plum-900/45">{r.email}</span>
              </td>
              <td className="px-4 py-3 text-plum-900/70">{r.cards}</td>
              <td className="px-4 py-3">
                {r.isAdmin ? (
                  <span className="rounded-full bg-gold-300/40 px-2 py-0.5 text-[0.62rem] font-bold text-gold-500">
                    👑 Propriétaire
                  </span>
                ) : (
                  <span className="text-xs text-plum-900/45">Membre</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {r.id !== selfId && !r.isAdmin && (
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => remove(r.id)}
                    className="sb-btn-danger !px-3 !py-1.5 text-xs"
                  >
                    Supprimer
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
