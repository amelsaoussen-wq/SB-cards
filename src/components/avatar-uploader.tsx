"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/avatar";

/**
 * Photo de profil du compte : choix d'une image, redimensionnement côté
 * client (256 px) puis enregistrement en base (data URL).
 */
export function AvatarUploader({
  name,
  initialAvatar,
}: {
  name: string;
  initialAvatar: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(initialAvatar);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onFile(file: File) {
    setMsg(null);
    if (!file.type.startsWith("image/")) {
      setMsg("Choisissez un fichier image.");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      URL.revokeObjectURL(url);
      setPreview(dataUrl);
      setBusy(true);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      }).catch(() => null);
      setBusy(false);
      if (res && res.ok) {
        setMsg("Photo de profil enregistrée ✅");
        router.refresh();
      } else {
        setMsg("Échec de l’enregistrement. Réessayez avec une image plus petite.");
      }
    };
    img.src = url;
  }

  async function remove() {
    setBusy(true);
    await fetch("/api/profile/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl: "" }),
    }).catch(() => undefined);
    setBusy(false);
    setPreview("");
    setMsg("Photo retirée.");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} avatar={preview} className="h-20 w-20 text-xl" />
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="sb-btn-primary !px-3 !py-2 text-xs"
          >
            {busy ? "Enregistrement…" : "📷 Changer la photo"}
          </button>
          {preview && (
            <button
              type="button"
              disabled={busy}
              onClick={remove}
              className="sb-btn-secondary !px-3 !py-2 text-xs"
            >
              Retirer
            </button>
          )}
        </div>
        {msg && <p className="text-xs text-plum-900/55">{msg}</p>}
      </div>
    </div>
  );
}
