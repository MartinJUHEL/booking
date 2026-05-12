"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function OnboardingClient({ userName }: { userName: string }) {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [role, setRole] = useState<"artist" | "booker" | null>(null);
  const [artistName, setArtistName] = useState("");
  const [saving, setSaving] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Booker agency step
  const [step, setStep] = useState<"role" | "agency">(
    user?.role === "booker" && !user?.agencyId ? "agency" : "role"
  );
  const [agencyName, setAgencyName] = useState("");
  const [agencyError, setAgencyError] = useState("");

  async function handleSubmit() {
    if (!role) return;
    setSaving(true);

    try {
      const result = await api.put<{ role: string; artistName?: string; token: string }>("/api/user/role", { role, artistName: artistName || undefined });
      if (result.token) {
        api.setToken(result.token);
      }

      if (role === "booker") {
        await refreshUser();
        setStep("agency");
        setSaving(false);
        return;
      }

      await refreshUser();
      setRedirecting(true);
      router.push("/");
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  async function handleAgencySubmit() {
    setAgencyError("");
    setSaving(true);

    try {
      await api.post("/api/agency", { name: agencyName.trim() });
      await refreshUser();
      setRedirecting(true);
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Une erreur est survenue";
      setAgencyError(msg);
    }
    setSaving(false);
  }

  if (redirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-gray-400 text-sm">Preparation de votre espace...</div>
      </div>
    );
  }

  if (step === "agency") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-lg w-full mx-4">
          <div className="text-center mb-4"><span className="text-2xl font-bold">Gigflow</span></div>
          <h1 className="text-2xl font-bold mb-2 text-center">Creer votre agence</h1>
          <p className="text-gray-400 mb-8 text-center">
            Creez votre agence pour commencer a gerer vos artistes.
            Vous pourrez ensuite inviter d&apos;autres bookers a vous rejoindre.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom de l&apos;agence
            </label>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="Ex: Stellar Bookings"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          {agencyError && (
            <div className="mb-4 text-red-400 text-sm text-center">{agencyError}</div>
          )}

          <button
            onClick={handleAgencySubmit}
            disabled={saving || !agencyName.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            {saving ? "..." : "Creer l'agence"}
          </button>

          <p className="text-gray-500 text-xs text-center mt-4">
            Si vous avez recu un lien d&apos;invitation, utilisez-le directement pour rejoindre une agence existante.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-lg w-full mx-4">
        <div className="text-center mb-4"><span className="text-2xl font-bold">Gigflow</span></div>
        <h1 className="text-2xl font-bold mb-2 text-center">
          Bienvenue, {userName} !
        </h1>
        <p className="text-gray-400 mb-8 text-center">
          Choisissez votre profil pour commencer.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setRole("artist")}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              role === "artist"
                ? "border-purple-500 bg-purple-500/10"
                : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
            }`}
          >
            <div className="text-3xl mb-3">&#x1F3B5;</div>
            <div className="font-semibold mb-1">Artiste</div>
            <div className="text-sm text-gray-400">
              Gerez vos dates, contrats et logistique.
            </div>
          </button>

          <button
            onClick={() => setRole("booker")}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              role === "booker"
                ? "border-purple-500 bg-purple-500/10"
                : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
            }`}
          >
            <div className="text-3xl mb-3">&#x1F4CB;</div>
            <div className="font-semibold mb-1">Booker</div>
            <div className="text-sm text-gray-400">
              Gerez plusieurs artistes et leurs bookings.
            </div>
          </button>
        </div>

        {role === "artist" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom de scene
            </label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Ex: DJ Shadow"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!role || saving || (role === "artist" && !artistName.trim())}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          {saving ? "..." : "Continuer"}
        </button>
      </div>
    </div>
  );
}
