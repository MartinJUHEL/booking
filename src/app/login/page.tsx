"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type Step = "form" | "verify";

export default function LoginPage() {
  const { user, loading, login, loginWithCredentials, register, verifyEmail, resendCode } = useAuth();
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Verification step
  const [step, setStep] = useState<Step>("form");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [code, setCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!loading && user) {
      const redirect = typeof window !== "undefined" ? localStorage.getItem("redirectAfterLogin") : null;
      if (redirect) {
        localStorage.removeItem("redirectAfterLogin");
        router.replace(redirect);
      } else {
        router.replace(user.role ? "/" : "/onboarding");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleGoogleCallback(response: { credential: string }) {
    setError("");
    const success = await login(response.credential);
    if (success) {
      router.push("/");
    } else {
      setError("Echec de la connexion. Verifiez que le backend est accessible.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isRegister) {
        const result = await register(email, password, name || undefined);
        if (result.success) {
          setVerificationEmail(email);
          setStep("verify");
          setResendCooldown(120);
        } else {
          setError(result.error || "Erreur lors de l'inscription");
        }
      } else {
        const result = await loginWithCredentials(email, password);
        if (result.success) {
          router.push("/");
        } else if (result.needsVerification) {
          setVerificationEmail(result.email || email);
          setStep("verify");
          setResendCooldown(120);
        } else {
          setError(result.error || "Email ou mot de passe incorrect");
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await verifyEmail(verificationEmail, code);
      if (result.success) {
        router.push("/onboarding");
      } else {
        setError(result.error || "Code invalide ou expiré");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError("");
    await resendCode(verificationEmail);
    setResendCooldown(120);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  // Verification code step
  if (step === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <h1 className="text-2xl font-bold mb-2">Vérifiez votre email</h1>
          <p className="text-gray-400 mb-6">
            Un code à 6 chiffres a été envoyé à <span className="text-white font-medium">{verificationEmail}</span>
          </p>

          <form onSubmit={handleVerify} className="space-y-4 text-left">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Code de vérification</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                maxLength={6}
                className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="000000"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {submitting ? "Vérification..." : "Vérifier"}
            </button>
          </form>

          <div className="mt-4 space-y-2">
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-sm text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Renvoyer le code (${resendCooldown}s)`
                : "Renvoyer le code"}
            </button>
            <br />
            <button
              onClick={() => { setStep("form"); setCode(""); setError(""); }}
              className="text-sm text-gray-400 hover:text-gray-300"
            >
              Retour
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm mt-4">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        <h1 className="text-2xl font-bold mb-2">Gigflow</h1>
        <p className="text-gray-400 mb-6">
          Gérez vos dates, contrats et logistique en un seul endroit.
        </p>

        {/* Email/Password form */}
        <form onSubmit={handleSubmit} className="space-y-3 mb-6 text-left">
          {isRegister && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="Votre nom"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="email@exemple.com"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="Min. 8 caractères"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {submitting
              ? "Chargement..."
              : isRegister
                ? "Créer un compte"
                : "Se connecter"}
          </button>
          <p className="text-center text-sm text-gray-400">
            {isRegister ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {isRegister ? "Se connecter" : "S'inscrire"}
            </button>
          </p>
        </form>

        {/* Separator */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-sm text-gray-500">ou</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Google button */}
        <div ref={googleBtnRef} className="flex justify-center" />

        {error && (
          <p className="text-red-400 text-sm mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}
