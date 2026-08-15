"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No se pudo iniciar sesión.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-4 border border-rotary-ink/10 rounded-xl p-6 shadow-sm"
      >
        <h1 className="text-xl font-extrabold text-rotary-ink">Panel de administración</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          required
          type="password"
          autoFocus
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-rotary-ink/15 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rotary-azure"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-rotary-azure text-white font-bold rounded-full py-2.5 hover:bg-rotary-azure-dark disabled:opacity-50 transition-colors"
        >
          {submitting ? "Ingresando..." : "Ingresar"}
        </button>
        <Link
          href="/"
          className="self-center text-sm text-rotary-azure hover:underline"
        >
          ‹ Volver a la página principal
        </Link>
      </form>
    </main>
  );
}
