"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "ready" | "accepted" | "rejected" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState(false);

  // Invitation details (we'll try to accept/reject directly since we have the token)
  // If user is not logged in, redirect to login
  useEffect(() => {
    if (!loading && !user) {
      // Store the invitation URL to redirect back after login
      if (typeof window !== "undefined") {
        localStorage.setItem("redirectAfterLogin", `/invitations/${token}`);
      }
      router.replace("/login");
      return;
    }
    if (!loading && user && !user.role) {
      router.replace("/onboarding");
      return;
    }
    if (!loading && user && user.role === "artist") {
      setStatus("ready");
    }
    if (!loading && user && user.role !== "artist") {
      setStatus("error");
      setError("Seuls les artistes peuvent accepter une invitation de booker.");
    }
  }, [loading, user, router, token]);

  async function handleRespond(accept: boolean) {
    setResponding(true);
    try {
      await api.post(`/api/artists/invitations/${token}/${accept ? "accept" : "reject"}`);
      setStatus(accept ? "accepted" : "rejected");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur";
      setError(message);
      setStatus("error");
    } finally {
      setResponding(false);
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (status === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">&#10003;</div>
          <h1 className="text-2xl font-bold mb-2">Invitation acceptee</h1>
          <p className="text-gray-400 mb-6">Le booker peut maintenant gerer vos bookings.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Invitation refusee</h1>
          <p className="text-gray-400 mb-6">Vous avez refuse l&apos;invitation.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2 text-red-400">Erreur</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-2">Invitation de booker</h1>
        <p className="text-gray-400 mb-8">
          Un booker souhaite vous ajouter a sa liste d&apos;artistes pour gerer vos bookings.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => handleRespond(true)}
            disabled={responding}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            {responding ? "..." : "Accepter"}
          </button>
          <button
            onClick={() => handleRespond(false)}
            disabled={responding}
            className="bg-gray-700 hover:bg-red-600 disabled:opacity-50 text-gray-300 hover:text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            {responding ? "..." : "Refuser"}
          </button>
        </div>
      </div>
    </div>
  );
}
