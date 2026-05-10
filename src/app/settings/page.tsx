"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import SettingsClient from "./SettingsClient";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎧</span>
            <h1 className="text-xl font-bold">DJ Booking Manager</h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              Retour au dashboard
            </a>
            <span className="text-sm text-gray-400">
              {user.name || user.email}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-bold mb-8">Configuration</h2>
        <SettingsClient />
      </main>
    </div>
  );
}
