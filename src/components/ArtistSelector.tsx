"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface Artist {
  id: string;
  label: string;
}

export default function ArtistSelector({
  artists,
  selectedId,
}: {
  artists: Artist[];
  selectedId: string;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  function handleChange(id: string) {
    if (id === "__add__") {
      setShowAdd(true);
      return;
    }
    router.push(`/?artistId=${id}`);
  }

  async function handleAddArtist(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setAdding(true);
    setError("");

    const res = await fetch("/api/artists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      const artist = await res.json();
      setShowAdd(false);
      setEmail("");
      router.push(`/?artistId=${artist.id}`);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Erreur");
    }
    setAdding(false);
  }

  return (
    <div className="relative">
      <select
        value={selectedId}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
      >
        {artists.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
        <option value="__add__">+ Ajouter un artiste</option>
      </select>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold mb-4">Ajouter un artiste</h3>
            <form onSubmit={handleAddArtist}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email de l'artiste"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm mb-3 focus:outline-none focus:border-purple-500"
              />
              {error && (
                <p className="text-red-400 text-sm mb-3">{error}</p>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setError(""); }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm"
                >
                  {adding ? "..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
