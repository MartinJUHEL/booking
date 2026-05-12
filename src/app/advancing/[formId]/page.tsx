"use client";

import { useState, useEffect, useCallback, use } from "react";
import { api } from "@/lib/api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5062";

interface AdvancingFieldValue {
  id: string;
  section: string;
  fieldKey: string;
  value: string | null;
  updatedAt: string;
  sentAt: string | null;
  validatedAt: string | null;
  validatedBy: string | null;
  rejectionComment: string | null;
}

interface AdvancingForm {
  id: string;
  bookingId: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  fieldValues: AdvancingFieldValue[];
  artistName: string | null;
  bookingDate: string | null;
}

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "url" | "email" | "number" | "time" | "date" | "datetime" | "tel" | "textarea" | "select" | "boolean";
  readonly?: boolean;
  options?: string[];
}

interface SectionDef {
  key: string;
  label: string;
  fields: FieldDef[];
}

const SECTIONS: SectionDef[] = [
  {
    key: "show", label: "Show", fields: [
      { key: "artistName", label: "Artist", type: "text", readonly: true },
      { key: "eventName", label: "Name of event", type: "text" },
      { key: "eventWebsite", label: "Event website", type: "url" },
      { key: "capacity", label: "Capacity", type: "number" },
      { key: "doorsOpen", label: "Doors open", type: "time" },
      { key: "doorsClose", label: "Doors close", type: "time" },
      { key: "ageRestrictions", label: "Age restrictions", type: "select", options: ["Unknown", "18+", "21+", "All ages"] },
    ],
  },
  {
    key: "promoter", label: "Promoter", fields: [
      { key: "companyName", label: "Company name", type: "text" },
      { key: "address1", label: "Address line 1", type: "text" },
      { key: "address2", label: "Address line 2", type: "text" },
      { key: "postalCode", label: "Postal code", type: "text" },
      { key: "city", label: "City", type: "text" },
      { key: "country", label: "Country - State", type: "text" },
      { key: "phone", label: "Phone", type: "tel" },
      { key: "companyWebsite", label: "Company website", type: "url" },
      { key: "vatNumber", label: "VAT/Tax number", type: "text" },
      { key: "email", label: "Email", type: "email" },
      { key: "siret", label: "SIRET", type: "text" },
      { key: "ape", label: "Code APE", type: "text" },
    ],
  },
  {
    key: "venue", label: "Venue", fields: [
      { key: "venueName", label: "Name", type: "text" },
      { key: "venueAddress", label: "Address", type: "text" },
      { key: "venueCity", label: "City", type: "text" },
      { key: "venueCountry", label: "Country - State", type: "text" },
      { key: "venueWebsite", label: "Website", type: "url" },
    ],
  },
  {
    key: "tickets", label: "Tickets", fields: [
      { key: "ticketLink", label: "Ticket link", type: "url" },
      { key: "priceDoor", label: "Door", type: "text" },
      { key: "pricePresale", label: "Presale", type: "text" },
      { key: "priceReduced", label: "Reduced", type: "text" },
      { key: "onPresaleDate", label: "On presale", type: "date" },
      { key: "soldOut", label: "Sold out", type: "boolean" },
    ],
  },
  {
    key: "contacts", label: "Contacts", fields: [
      { key: "tourManager", label: "Tour manager", type: "text" },
      { key: "technician", label: "Technician", type: "text" },
      { key: "artistHandler", label: "Artist handler", type: "text" },
      { key: "stageManager", label: "Stage manager", type: "text" },
    ],
  },
  {
    key: "eventDetails", label: "Event Details", fields: [
      { key: "stageFloor", label: "Stage / floor", type: "text" },
      { key: "furtherDetails", label: "Further Details", type: "textarea" },
      { key: "soundcheckRequired", label: "Soundcheck Required?", type: "select", options: ["Yes", "No"] },
      { key: "riderConfirmed", label: "Rider confirmed?", type: "select", options: ["Yes", "No"] },
    ],
  },
  {
    key: "hotel", label: "Hotel", fields: [
      { key: "hotelName", label: "Hotel name", type: "text" },
      { key: "hotelBookingNumber", label: "Booking reference", type: "text" },
      { key: "hotelAddress", label: "Address", type: "text" },
      { key: "hotelCheckIn", label: "Check in", type: "datetime" },
      { key: "hotelLateCheckout", label: "Late Check Out", type: "boolean" },
      { key: "hotelBreakfast", label: "Breakfast included", type: "boolean" },
      { key: "hotelNotes", label: "Additional information", type: "textarea" },
    ],
  },
  {
    key: "dinner", label: "Dinner", fields: [
      { key: "restaurant", label: "Restaurant", type: "text" },
      { key: "pickUpTime", label: "Pick-Up Time", type: "time" },
      { key: "meetingPoint", label: "Meeting Point", type: "text" },
      { key: "dinnerDriver", label: "Driver", type: "text" },
    ],
  },
  {
    key: "arrival", label: "Arrival", fields: [
      { key: "arrivalTime", label: "Arrival time", type: "time" },
      { key: "arrivalLocation", label: "Arrival location", type: "text" },
      { key: "arrivalMeetingPoint", label: "Meeting Point", type: "text" },
      { key: "arrivalDriver", label: "Driver", type: "text" },
      { key: "arrivalDuration", label: "Duration", type: "text" },
    ],
  },
  {
    key: "showTransfers", label: "Show Transfers", fields: [
      { key: "transferToVenuePickup", label: "Hotel→Venue pick-up time", type: "time" },
      { key: "transferToVenueMeetingPoint", label: "Meeting Point", type: "text" },
      { key: "transferToVenueDriver", label: "Driver", type: "text" },
      { key: "transferToVenueDuration", label: "Duration", type: "text" },
      { key: "transferToHotelPickup", label: "Venue→Hotel pick-up time", type: "time" },
      { key: "transferToHotelMeetingPoint", label: "Meeting Point", type: "text" },
      { key: "transferToHotelDriver", label: "Driver", type: "text" },
    ],
  },
  {
    key: "departure", label: "Departure", fields: [
      { key: "departurePickup", label: "Pick-up time", type: "time" },
      { key: "departureMeetingPoint", label: "Meeting Point", type: "text" },
      { key: "departureDriver", label: "Driver", type: "text" },
      { key: "departureLocation", label: "Departure location", type: "text" },
    ],
  },
];

export { SECTIONS };
export type { AdvancingForm, AdvancingFieldValue, SectionDef, FieldDef };

type Step = "email" | "code" | "form";

export default function AdvancingPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState<AdvancingForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savingField, setSavingField] = useState<string | null>(null);

  // Check if we have a stored token
  useEffect(() => {
    const stored = localStorage.getItem(`advancing_token_${formId}`);
    if (stored) {
      setToken(stored);
      setStep("form");
    }
  }, [formId]);

  // Load form when token available
  useEffect(() => {
    if (!token) return;
    loadForm();
  }, [token]);

  async function loadForm() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/advancing/${formId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        // Token expired, restart
        localStorage.removeItem(`advancing_token_${formId}`);
        setToken(null);
        setStep("email");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to load form");
        return;
      }
      const data = await res.json();
      setForm(data);
    } catch {
      setError("Failed to load form");
    }
  }

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/advancing/${formId}/request-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "An error occurred");
        return;
      }
      setStep("code");
    } catch {
      setError("Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/advancing/${formId}/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Invalid code");
        return;
      }
      const data = await res.json();
      localStorage.setItem(`advancing_token_${formId}`, data.token);
      setToken(data.token);
      setStep("form");
    } catch {
      setError("Verification failed");
    } finally {
      setLoading(false);
    }
  }

  const saveField = useCallback(async (section: string, fieldKey: string, value: string | null) => {
    if (!token) return;
    const fieldId = `${section}.${fieldKey}`;
    setSavingField(fieldId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/advancing/${formId}/fields`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ section, fieldKey, value }),
      });
      if (res.ok) {
        const saved = await res.json();
        setForm(prev => {
          if (!prev) return prev;
          const existing = prev.fieldValues.findIndex(
            fv => fv.section === section && fv.fieldKey === fieldKey
          );
          const newValues = [...prev.fieldValues];
          if (existing >= 0) {
            newValues[existing] = saved;
          } else {
            newValues.push(saved);
          }
          return { ...prev, fieldValues: newValues };
        });
      }
    } catch {
      // Silent fail for auto-save
    } finally {
      setTimeout(() => setSavingField(null), 500);
    }
  }, [token, formId]);

  const sendField = useCallback(async (section: string, fieldKey: string) => {
    if (!token) return;
    const fieldId = `${section}.${fieldKey}`;
    setSavingField(fieldId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/advancing/${formId}/fields/${section}/${fieldKey}/send`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const saved = await res.json();
        setForm(prev => {
          if (!prev) return prev;
          const existing = prev.fieldValues.findIndex(
            fv => fv.section === section && fv.fieldKey === fieldKey
          );
          const newValues = [...prev.fieldValues];
          if (existing >= 0) {
            newValues[existing] = saved;
          }
          return { ...prev, fieldValues: newValues };
        });
      }
    } catch {
      // ignore
    } finally {
      setTimeout(() => setSavingField(null), 500);
    }
  }, [token, formId]);

  // Email step
  if (step === "email") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Advancing Form</h1>
            <p className="text-gray-400">Enter your email to access the form</p>
          </div>
          <form onSubmit={handleRequestCode} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? "Sending..." : "Send verification code"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Code step
  if (step === "code") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-gray-400">We sent a 6-digit code to <strong>{email}</strong></p>
          </div>
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-purple-500"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); setError(""); }}
              className="w-full text-gray-400 hover:text-white text-sm transition-colors"
            >
              Use a different email
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Form step
  if (!form) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400">{error || "Loading..."}</div>
      </div>
    );
  }

  const getFieldValue = (section: string, key: string) => {
    const fv = form.fieldValues.find(v => v.section === section && v.fieldKey === key);
    return fv?.value ?? "";
  };

  const getFieldStatus = (section: string, key: string) => {
    const fv = form.fieldValues.find(v => v.section === section && v.fieldKey === key);
    if (!fv) return "empty";
    if (fv.rejectionComment) return "rejected";
    if (fv.validatedAt) return "validated";
    if (fv.sentAt) return "sent";
    return "saved";
  };

  const dateStr = form.bookingDate
    ? new Date(form.bookingDate).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    : "";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold">{form.artistName || "Advancing Form"}</h1>
          {dateStr && <p className="text-sm text-gray-400">{dateStr}</p>}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {SECTIONS.map(section => (
          <Section
            key={section.key}
            section={section}
            getFieldValue={getFieldValue}
            getFieldStatus={getFieldStatus}
            savingField={savingField}
            onSave={saveField}
            onSend={sendField}
            artistName={form.artistName}
            fieldValues={form.fieldValues}
          />
        ))}
      </main>
    </div>
  );
}

function Section({
  section,
  getFieldValue,
  getFieldStatus,
  savingField,
  onSave,
  onSend,
  artistName,
  fieldValues,
}: {
  section: SectionDef;
  getFieldValue: (section: string, key: string) => string;
  getFieldStatus: (section: string, key: string) => string;
  savingField: string | null;
  onSave: (section: string, key: string, value: string | null) => void;
  onSend: (section: string, key: string) => void;
  artistName: string | null;
  fieldValues: AdvancingFieldValue[];
}) {
  const [open, setOpen] = useState(true);

  // Count sent fields in this section
  const sectionFieldValues = fieldValues.filter(fv => fv.section === section.key);
  const sentCount = sectionFieldValues.filter(fv => fv.sentAt).length;
  const totalCount = section.fields.filter(f => !f.readonly).length;

  return (
    <section className="rounded-xl border border-gray-800 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gray-900/50 hover:bg-gray-900 transition-colors"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider">{section.label}</h2>
        <div className="flex items-center gap-2">
          {sentCount > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${sentCount === totalCount ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>
              {sentCount}/{totalCount} sent
            </span>
          )}
          <span className="text-gray-500 text-sm">{open ? "−" : "+"}</span>
        </div>
      </button>
      {open && (
        <div className="p-6 space-y-4">
          {section.fields.map(field => (
            <Field
              key={field.key}
              sectionKey={section.key}
              field={field}
              value={field.readonly && field.key === "artistName" ? (artistName || "") : getFieldValue(section.key, field.key)}
              status={getFieldStatus(section.key, field.key)}
              saving={savingField === `${section.key}.${field.key}`}
              onSave={onSave}
              onSend={onSend}
              readOnly={field.readonly}
              fieldValue={fieldValues.find(fv => fv.section === section.key && fv.fieldKey === field.key)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Field({
  sectionKey,
  field,
  value,
  status,
  saving,
  onSave,
  onSend,
  readOnly,
  fieldValue,
}: {
  sectionKey: string;
  field: FieldDef;
  value: string;
  status: string;
  saving: boolean;
  onSave: (section: string, key: string, value: string | null) => void;
  onSend: (section: string, key: string) => void;
  readOnly?: boolean;
  fieldValue?: AdvancingFieldValue;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function handleChange(newValue: string) {
    setLocalValue(newValue);
    if (readOnly) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      onSave(sectionKey, field.key, newValue || null);
    }, 500);
    setDebounceTimer(timer);
  }

  function handleBlur() {
    if (readOnly) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    if (localValue !== value) {
      onSave(sectionKey, field.key, localValue || null);
    }
  }

  const isSent = !!fieldValue?.sentAt;
  const isValidated = !!fieldValue?.validatedAt;
  const isRejected = !isValidated && !!fieldValue?.rejectionComment;
  const isSaved = status === "saved" && !isSent;
  const canSend = !readOnly && !!localValue && !isValidated && !isSent;

  const statusBorder =
    isValidated ? "border-green-500/50" :
    isRejected ? "border-red-500/50" :
    isSent ? "border-purple-500/30" :
    isSaved ? "border-blue-500/30" :
    "border-gray-700";

  const inputClass = `w-full bg-gray-900 border ${statusBorder} rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500 ${readOnly || isValidated ? "opacity-60 cursor-not-allowed" : ""}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-gray-500">{field.label}</label>
        <div className="flex items-center gap-2">
          {saving && <span className="text-xs text-gray-500">...</span>}
          {isValidated && <span className="text-xs text-green-400">Validated</span>}
          {isSent && !isValidated && <span className="text-xs text-purple-400">Sent</span>}
          {isRejected && <span className="text-xs text-red-400">!</span>}
          {isSaved && !isSent && <span className="text-xs text-blue-400">Saved</span>}
        </div>
      </div>
      {isRejected && fieldValue?.rejectionComment && (
        <p className="text-xs text-red-400 mb-1">Rejected: {fieldValue.rejectionComment} — please update and re-send</p>
      )}
      <div className="flex gap-2">
        <div className="flex-1">
          {field.type === "textarea" ? (
            <textarea
              value={localValue}
              onChange={e => handleChange(e.target.value)}
              onBlur={handleBlur}
              readOnly={readOnly || isValidated}
              rows={3}
              className={inputClass}
            />
          ) : field.type === "select" ? (
            <select
              value={localValue}
              onChange={e => handleChange(e.target.value)}
              onBlur={handleBlur}
              disabled={readOnly || isValidated}
              className={inputClass}
            >
              <option value="">—</option>
              {field.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === "boolean" ? (
            <div className="flex gap-2">
              {["Yes", "No"].map(opt => (
                <button
                  key={opt}
                  type="button"
                  disabled={readOnly || isValidated}
                  onClick={() => handleChange(opt === "Yes" ? "true" : "false")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    localValue === (opt === "Yes" ? "true" : "false")
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  } ${readOnly || isValidated ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <input
              type={field.type === "datetime" ? "datetime-local" : field.type}
              value={localValue}
              onChange={e => handleChange(e.target.value)}
              onBlur={handleBlur}
              readOnly={readOnly || isValidated}
              className={inputClass}
            />
          )}
        </div>
        {!readOnly && !isValidated && (
          <button
            onClick={() => onSend(sectionKey, field.key)}
            disabled={!canSend || saving}
            className={`self-start px-3 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              canSend
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : isSent
                  ? "bg-purple-500/10 text-purple-400 cursor-default"
                  : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            {isSent ? "Sent" : "Send"}
          </button>
        )}
      </div>
    </div>
  );
}
