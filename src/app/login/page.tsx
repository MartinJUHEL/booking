"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";

type Step = "form" | "verify" | "new-password";

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  checks: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasDigit: boolean;
    hasSpecial: boolean;
  };
}

function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const levels: { label: string; color: string }[] = [
    { label: "Tres faible", color: "bg-red-500" },
    { label: "Faible", color: "bg-red-400" },
    { label: "Moyen", color: "bg-yellow-500" },
    { label: "Bon", color: "bg-blue-500" },
    { label: "Fort", color: "bg-green-500" },
    { label: "Fort", color: "bg-green-500" },
  ];
  return { score, ...levels[score], checks };
}

function isPasswordValid(checks: PasswordStrength["checks"]): boolean {
  return Object.values(checks).every(Boolean);
}

export default function LoginPage() {
  const { user, loading, login, loginWithCredentials, register, verifyEmail, resendCode, setPassword: setPasswordApi, forgotPassword, resetPassword } = useAuth();
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Verification step
  const [step, setStep] = useState<Step>("form");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  // "google" = Google-only account linking, "reset" = forgot password
  const [passwordMode, setPasswordMode] = useState<"google" | "reset">("reset");

  useEffect(() => {
    if (!loading && user) {
      setRedirecting(true);
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
    // Don't try to render while the auth state is loading (the form is not mounted yet)
    if (loading) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    let cancelled = false;

    function renderGoogleButton() {
      if (cancelled || !window.google || !googleBtnRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId!,
        callback: (res: { credential: string }) => handleGoogleCallbackRef.current?.(res),
        auto_select: false,
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: 350,
        text: "signin_with",
      });
    }

    // If the script is already loaded, just render
    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    // Otherwise load the script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [loading]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleGoogleCallbackRef = useRef<(response: { credential: string }) => void>(undefined);
  handleGoogleCallbackRef.current = async (response: { credential: string }) => {
    setError("");
    setRedirecting(true);
    const success = await login(response.credential);
    if (!success) {
      setRedirecting(false);
      setError("Echec de la connexion. Verifiez que le backend est accessible.");
    }
    // Redirect is handled by the useEffect watching `user`
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isRegister) {
        const strength = getPasswordStrength(password);
        if (!isPasswordValid(strength.checks)) {
          setError("Le mot de passe ne respecte pas tous les criteres de securite.");
          setSubmitting(false);
          return;
        }
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
          // Redirect is handled by the useEffect watching `user`
        } else if (result.needsPassword) {
          setVerificationEmail(result.email || email);
          setPasswordMode("google");
          setStep("new-password");
          setResendCooldown(120);
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
        setRedirecting(true);
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

  if (redirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-gray-400 text-sm">Connexion en cours...</div>
      </div>
    );
  }

  // New password step (shared between Google-only linking and forgot password)
  if (step === "new-password") {
    const strength = getPasswordStrength(newPassword);
    const passwordReady = isPasswordValid(strength.checks);
    const isGoogleMode = passwordMode === "google";

    async function handleNewPassword(e: React.FormEvent) {
      e.preventDefault();
      setError("");
      setSubmitting(true);

      try {
        const result = isGoogleMode
          ? await setPasswordApi(verificationEmail, code, newPassword)
          : await resetPassword(verificationEmail, code, newPassword);
        if (result.success) {
          setRedirecting(true);
        } else {
          setError(result.error || "Code invalide ou expiré");
        }
      } finally {
        setSubmitting(false);
      }
    }

    async function handleResendNewPassword() {
      setError("");
      try {
        if (isGoogleMode) {
          await api.post("/api/auth/resend-set-password-code", { email: verificationEmail });
        } else {
          await forgotPassword(verificationEmail);
        }
      } catch { /* silently fail */ }
      setResendCooldown(120);
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <h1 className="text-2xl font-bold mb-2">
            {isGoogleMode ? "Définir un mot de passe" : "Réinitialiser le mot de passe"}
          </h1>
          <p className="text-gray-400 mb-6">
            {isGoogleMode ? (
              <>Votre compte <span className="text-white font-medium">{verificationEmail}</span> a été créé via Google. Vérifiez votre email et définissez un mot de passe pour vous connecter aussi par email.</>
            ) : (
              <>Un code à 6 chiffres a été envoyé à <span className="text-white font-medium">{verificationEmail}</span></>
            )}
          </p>

          <form onSubmit={handleNewPassword} className="space-y-4 text-left">
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
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="Min. 8 caractères"
              />
              {newPassword.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${(strength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-20 text-right">{strength.label}</span>
                  </div>
                  <ul className="text-xs space-y-0.5">
                    {[
                      { key: "minLength" as const, label: "8 caracteres minimum" },
                      { key: "hasUpper" as const, label: "Une majuscule" },
                      { key: "hasLower" as const, label: "Une minuscule" },
                      { key: "hasDigit" as const, label: "Un chiffre" },
                      { key: "hasSpecial" as const, label: "Un caractere special (!@#$...)" },
                    ].map(({ key, label }) => (
                      <li key={key} className={strength.checks[key] ? "text-green-400" : "text-gray-500"}>
                        {strength.checks[key] ? "\u2713" : "\u2717"} {label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting || code.length !== 6 || !passwordReady}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {submitting ? "Enregistrement..." : (isGoogleMode ? "Définir le mot de passe" : "Réinitialiser le mot de passe")}
            </button>
          </form>

          <div className="mt-4 space-y-2">
            <button
              onClick={handleResendNewPassword}
              disabled={resendCooldown > 0}
              className="text-sm text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Renvoyer le code (${resendCooldown}s)`
                : "Renvoyer le code"}
            </button>
            <br />
            <button
              onClick={() => { setStep("form"); setCode(""); setNewPassword(""); setError(""); }}
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
            {isRegister && password.length > 0 && (() => {
              const strength = getPasswordStrength(password);
              return (
                <div className="mt-2 space-y-2">
                  {/* Strength bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${(strength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-20 text-right">{strength.label}</span>
                  </div>
                  {/* Criteria checklist */}
                  <ul className="text-xs space-y-0.5">
                    {[
                      { key: "minLength" as const, label: "8 caracteres minimum" },
                      { key: "hasUpper" as const, label: "Une majuscule" },
                      { key: "hasLower" as const, label: "Une minuscule" },
                      { key: "hasDigit" as const, label: "Un chiffre" },
                      { key: "hasSpecial" as const, label: "Un caractere special (!@#$...)" },
                    ].map(({ key, label }) => (
                      <li key={key} className={strength.checks[key] ? "text-green-400" : "text-gray-500"}>
                        {strength.checks[key] ? "\u2713" : "\u2717"} {label}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>
          <button
            type="submit"
            disabled={submitting || (isRegister && !isPasswordValid(getPasswordStrength(password).checks))}
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
          {!isRegister && (
            <p className="text-center text-sm mt-1">
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    setError("Entrez votre email pour réinitialiser le mot de passe.");
                    return;
                  }
                  setError("");
                  setSubmitting(true);
                  await forgotPassword(email);
                  setVerificationEmail(email);
                  setPasswordMode("reset");
                  setStep("new-password");
                  setResendCooldown(120);
                  setSubmitting(false);
                }}
                className="text-gray-400 hover:text-gray-300 underline"
              >
                Mot de passe oublié ?
              </button>
            </p>
          )}
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

        <div className="mt-8 pt-6 border-t border-gray-700 flex justify-center gap-4 text-xs text-gray-500">
          <a href="/privacy-policy" className="hover:text-gray-300 transition-colors">
            Politique de confidentialite
          </a>
          <span>·</span>
          <a href="/terms" className="hover:text-gray-300 transition-colors">
            Conditions d&apos;utilisation
          </a>
        </div>
      </div>
    </div>
  );
}
