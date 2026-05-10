"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";

interface CalendarOption {
  id: string;
  summary: string;
  primary: boolean;
}

interface Settings {
  googleCalendarEnabled: boolean;
  googleCalendarId: string | null;
}

export default function SettingsClient() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    api.get<Settings>("/api/settings")
      .then((data) => {
        setSettings(data ?? { googleCalendarEnabled: false, googleCalendarId: null });
        setLoading(false);
      })
      .catch(() => {
        setSettings({ googleCalendarEnabled: false, googleCalendarId: null });
        setLoading(false);
        setMessage({ type: "error", text: "Impossible de charger les parametres" });
      });
  }, []);

  const loadCalendars = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const data = await api.get<CalendarOption[]>("/api/calendar/calendars");
      setCalendars(data);
    } catch (err) {
      setMessage({
        type: "error",
        text: "Impossible de charger les calendriers. Vous devez vous reconnecter pour autoriser Google Calendar.",
      });
    }
    setCalendarLoading(false);
  }, []);

  useEffect(() => {
    if (settings?.googleCalendarEnabled) {
      loadCalendars();
    }
  }, [settings?.googleCalendarEnabled, loadCalendars]);

  async function handleToggle(enabled: boolean) {
    if (enabled) {
      // Load calendars first
      await loadCalendars();
    }
    setSettings((prev) =>
      prev ? { ...prev, googleCalendarEnabled: enabled } : prev
    );
    await saveSettings({ googleCalendarEnabled: enabled });
  }

  async function handleCalendarSelect(calendarId: string) {
    setSettings((prev) =>
      prev ? { ...prev, googleCalendarId: calendarId } : prev
    );
    await saveSettings({ googleCalendarId: calendarId });
  }

  async function saveSettings(data: Partial<Settings>) {
    setSaving(true);
    setMessage(null);
    try {
      await api.put("/api/settings", data);
      setMessage({ type: "success", text: "Parametres sauvegardes" });
    } catch {
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde" });
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleSyncAll() {
    setSyncing(true);
    setMessage(null);
    try {
      const data = await api.post<{ synced: number }>("/api/calendar/sync-all");
      setMessage({
        type: "success",
        text: `${data.synced} date(s) synchronisee(s) avec Google Calendar`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Erreur lors de la synchronisation",
      });
    }
    setSyncing(false);
  }

  if (loading) {
    return (
      <div className="text-gray-400 text-center py-12">Chargement...</div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Google Calendar Section */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg
            className="w-6 h-6 text-blue-400"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
          </svg>
          <h3 className="text-lg font-semibold">Google Calendar</h3>
        </div>

        <p className="text-gray-400 text-sm mb-6">
          Synchronisez automatiquement vos dates avec Google Calendar. Chaque
          booking creera un evenement dans le calendrier choisi, avec un lien de
          retour vers l&apos;application.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium">
            Activer la synchronisation
          </span>
          <button
            onClick={() => handleToggle(!settings?.googleCalendarEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings?.googleCalendarEnabled ? "bg-purple-600" : "bg-gray-700"
            }`}
            disabled={saving}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                settings?.googleCalendarEnabled ? "translate-x-6" : ""
              }`}
            />
          </button>
        </div>

        {/* Calendar Selection */}
        {settings?.googleCalendarEnabled && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Calendrier cible
              </label>
              {calendarLoading ? (
                <div className="text-gray-500 text-sm">
                  Chargement des calendriers...
                </div>
              ) : calendars.length > 0 ? (
                <select
                  value={settings.googleCalendarId || "primary"}
                  onChange={(e) => handleCalendarSelect(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                  disabled={saving}
                >
                  {calendars.map((cal) => (
                    <option key={cal.id} value={cal.id}>
                      {cal.summary}
                      {cal.primary ? " (principal)" : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-yellow-400">
                  Aucun calendrier trouve. Vous devez vous deconnecter puis vous
                  reconnecter pour autoriser l&apos;acces a Google Calendar.
                </div>
              )}
            </div>

            {/* Sync All Button */}
            <div className="pt-4 border-t border-gray-800">
              <button
                onClick={handleSyncAll}
                disabled={syncing || saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
              >
                {syncing
                  ? "Synchronisation..."
                  : "Synchroniser toutes les dates"}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Synchronise toutes les dates existantes avec Google Calendar.
                Les nouvelles dates seront synchronisees automatiquement.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
