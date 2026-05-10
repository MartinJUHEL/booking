"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { API_BASE_URL } from "@/lib/api-client";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.push(user.role ? "/" : "/onboarding");
    }
  }, [loading, user, router]);

  useEffect(() => {
    // Load Google Identity Services
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId || !window.google) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
        auto_select: false,
      });

      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: 350,
          text: "signin_with",
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  async function handleGoogleCallback(response: { credential: string }) {
    setError("");
    const success = await login(response.credential);
    if (success) {
      router.push("/");
    } else {
      setError("Echec de la connexion. Verifiez que le backend est accessible.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        <span className="text-5xl block mb-4">🎧</span>
        <h1 className="text-2xl font-bold mb-2">DJ Booking Manager</h1>
        <p className="text-gray-400 mb-8">
          Gérez vos dates, contrats et logistique en un seul endroit.
        </p>
        <div ref={googleBtnRef} className="flex justify-center" />
        {error && (
          <p className="text-red-400 text-sm mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}

