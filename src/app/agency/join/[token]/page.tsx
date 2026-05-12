"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { API_BASE_URL } from "@/lib/api-client";

interface InviteInfo {
  agencyName: string;
  inviterName: string;
  email: string;
  expiresAt: string;
}

export default function JoinAgencyPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [expired, setExpired] = useState(false);

  // Fetch invite info (public endpoint)
  useEffect(() => {
    async function fetchInvite() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/agency/invite/${token}`);
        if (res.status === 410) {
          setExpired(true);
          return;
        }
        if (!res.ok) {
          setError("Invitation introuvable ou invalide.");
          return;
        }
        const data = await res.json();
        setInviteInfo(data);
      } catch {
        setError("Impossible de charger l'invitation.");
      } finally {
        setInviteLoading(false);
      }
    }
    fetchInvite();
  }, [token]);

  // If user is not logged in, redirect to login with return URL
  useEffect(() => {
    if (!loading && !user && !inviteLoading) {
      // Store return URL for after login
      if (typeof window !== "undefined") {
        localStorage.setItem("redirectAfterLogin", `/agency/join/${token}`);
      }
      router.replace("/login");
    }
  }, [loading, user, inviteLoading, token, router]);

  async function handleJoin() {
    setJoining(true);
    setError(null);
    try {
      await api.post("/api/agency/join", { token });
      await refreshUser();
      router.replace("/agency");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la jonction";
      if (message.includes("expire")) {
        setExpired(true);
      } else {
        setError(message);
      }
    } finally {
      setJoining(false);
    }
  }

  if (inviteLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="text-5xl mb-4">&#x23F0;</div>
          <h1 className="text-xl font-bold mb-2">Invitation expiree</h1>
          <p className="text-gray-400 mb-6">
            Ce lien d&apos;invitation a expire. Demandez a l&apos;agence de vous envoyer un nouveau lien.
          </p>
          <button
            onClick={() => router.replace("/")}
            className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
          >
            Retour a l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  if (error && !inviteInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="text-5xl mb-4">&#x26A0;&#xFE0F;</div>
          <h1 className="text-xl font-bold mb-2">Invitation invalide</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.replace("/")}
            className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
          >
            Retour a l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // User already in an agency
  if (user.agencyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <h1 className="text-xl font-bold mb-2">Vous appartenez deja a une agence</h1>
          <p className="text-gray-400 mb-6">
            Vous etes deja membre de l&apos;agence <strong>{user.agencyName}</strong>. 
            Vous ne pouvez pas rejoindre une autre agence.
          </p>
          <button
            onClick={() => router.replace("/")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  // User is not a booker
  if (user.role !== "booker") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <h1 className="text-xl font-bold mb-2">Acces reserve aux bookers</h1>
          <p className="text-gray-400 mb-6">
            Seuls les utilisateurs avec le role &quot;booker&quot; peuvent rejoindre une agence.
          </p>
          <button
            onClick={() => router.replace("/")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // Check email mismatch
  const emailMismatch = inviteInfo && user.email.toLowerCase() !== inviteInfo.email.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <span className="text-2xl font-bold">Gigflow</span>
        </div>

        <h1 className="text-xl font-bold mb-2 text-center">Rejoindre une agence</h1>

        {inviteInfo && (
          <div className="text-center mb-6">
            <p className="text-gray-400">
              <strong>{inviteInfo.inviterName}</strong> vous invite a rejoindre
            </p>
            <p className="text-2xl font-bold text-purple-400 mt-2">{inviteInfo.agencyName}</p>
          </div>
        )}

        {emailMismatch ? (
          <div className="text-center">
            <p className="text-red-400 text-sm mb-4">
              Cette invitation est destinee a <strong>{inviteInfo?.email}</strong>, 
              mais vous etes connecte avec <strong>{user.email}</strong>.
            </p>
            <p className="text-gray-500 text-sm">
              Connectez-vous avec le bon compte pour accepter cette invitation.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <p className="text-red-400 text-sm text-center mb-4">{error}</p>
            )}

            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {joining ? "..." : "Rejoindre l'agence"}
            </button>

            {inviteInfo && (
              <p className="text-gray-500 text-xs text-center mt-4">
                Ce lien expire a {new Date(inviteInfo.expiresAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
