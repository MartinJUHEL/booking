"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import HeaderBar from "@/components/HeaderBar";
import SettingsClient from "./SettingsClient";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    if (!loading && user?.role === "booker") {
      router.replace("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <HeaderBar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-bold mb-8">Configuration</h2>
        <SettingsClient />
      </main>
    </div>
  );
}
