"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";

const API_BASE_URL = "";

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
  type: "text" | "url" | "email" | "number" | "time" | "date" | "datetime" | "tel" | "textarea" | "select" | "boolean" | "venue-search" | "hotel-search";
  readonly?: boolean;
  placeholder?: string;
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
      { key: "venueName", label: "Name", type: "venue-search" },
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
      { key: "tourManager", label: "Tour manager", type: "text", placeholder: "Name + phone number" },
      { key: "technician", label: "Technician", type: "text", placeholder: "Name + phone number" },
      { key: "artistHandler", label: "Artist handler", type: "text", placeholder: "Name + phone number" },
      { key: "stageManager", label: "Stage manager", type: "text", placeholder: "Name + phone number" },
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
      { key: "hotelName", label: "Hotel name", type: "hotel-search" },
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
      { key: "dinnerDriver", label: "Driver (name + phone)", type: "text" },
    ],
  },
  {
    key: "arrival", label: "Arrival", fields: [
      { key: "arrivalTime", label: "Arrival time", type: "time" },
      { key: "arrivalLocation", label: "Arrival location", type: "text" },
      { key: "arrivalMeetingPoint", label: "Meeting Point", type: "text" },
      { key: "arrivalDriver", label: "Driver (name + phone)", type: "text" },
      { key: "arrivalDuration", label: "Duration", type: "text" },
    ],
  },
  {
    key: "showTransfers", label: "Show Transfers", fields: [
      { key: "transferToVenuePickup", label: "Hotel→Venue pick-up time", type: "time" },
      { key: "transferToVenueMeetingPoint", label: "Meeting Point", type: "text" },
      { key: "transferToVenueDriver", label: "Driver (name + phone)", type: "text" },
      { key: "transferToVenueDuration", label: "Duration", type: "text" },
      { key: "transferToHotelPickup", label: "Venue→Hotel pick-up time", type: "time" },
      { key: "transferToHotelMeetingPoint", label: "Meeting Point", type: "text" },
      { key: "transferToHotelDriver", label: "Driver (name + phone)", type: "text" },
    ],
  },
  {
    key: "departure", label: "Departure", fields: [
      { key: "departurePickup", label: "Pick-up time", type: "time" },
      { key: "departureMeetingPoint", label: "Meeting Point", type: "text" },
      { key: "departureDriver", label: "Driver (name + phone)", type: "text" },
      { key: "departureLocation", label: "Departure location", type: "text" },
    ],
  },
  {
    key: "timetable", label: "Timetable / Running Order", fields: [
      { key: "timetable", label: "Timetable", type: "textarea", placeholder: "JSON format: [{\"artist\":\"DJ Name\",\"startTime\":\"22:00\",\"endTime\":\"00:00\"}]" },
    ],
  },
];

export { SECTIONS };
export type { AdvancingForm, AdvancingFieldValue, SectionDef, FieldDef };

export default function AdvancingPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token");
  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState<AdvancingForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingField, setSavingField] = useState<string | null>(null);

  // Authenticate: check stored JWT, or exchange URL token for JWT
  useEffect(() => {
    const stored = localStorage.getItem(`advancing_token_${formId}`);
    if (stored) {
      setToken(stored);
      return;
    }

    if (!urlToken) {
      setError("Invalid or missing link.");
      setLoading(false);
      return;
    }

    // Exchange URL token for JWT
    async function authenticate() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/advancing/${formId}/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: urlToken }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.error || "Invalid or expired link.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        localStorage.setItem(`advancing_token_${formId}`, data.token);
        setToken(data.token);
      } catch {
        setError("Authentication failed.");
        setLoading(false);
      }
    }
    authenticate();
  }, [formId, urlToken]);

  // Load form when token available
  useEffect(() => {
    if (!token) return;
    loadForm();
  }, [token]);

  async function loadForm() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/advancing/${formId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        // Token expired, try re-auth with URL token
        localStorage.removeItem(`advancing_token_${formId}`);
        setToken(null);
        if (urlToken) {
          // Will trigger the auth useEffect again
          window.location.reload();
        } else {
          setError("Session expired. Please use the original link from your email.");
        }
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

  // Loading or error state
  if (!form) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          {error ? (
            <p className="text-red-400">{error}</p>
          ) : (
            <p className="text-gray-400">Loading...</p>
          )}
        </div>
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
            onAutoFill={(fields) => {
              for (const { section: s, key, value } of fields) {
                saveField(s, key, value);
              }
            }}
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
  onAutoFill,
}: {
  section: SectionDef;
  getFieldValue: (section: string, key: string) => string;
  getFieldStatus: (section: string, key: string) => string;
  savingField: string | null;
  onSave: (section: string, key: string, value: string | null) => void;
  onSend: (section: string, key: string) => void;
  artistName: string | null;
  fieldValues: AdvancingFieldValue[];
  onAutoFill: (fields: { section: string; key: string; value: string | null }[]) => void;
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
              onAutoFill={onAutoFill}
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
  onAutoFill,
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
  onAutoFill: (fields: { section: string; key: string; value: string | null }[]) => void;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const isFocusedRef = useRef(false);

  // Venue search state
  const [venueResults, setVenueResults] = useState<{ name: string; address: string; city: string; country: string }[]>([]);
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [venueLoading, setVenueLoading] = useState(false);
  const venueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const venueWrapperRef = useRef<HTMLDivElement>(null);

  // Hotel search state
  const [hotelResults, setHotelResults] = useState<{ placeId: string; name: string; address: string; secondaryText: string | null }[]>([]);
  const [showHotelDropdown, setShowHotelDropdown] = useState(false);
  const [hotelLoading, setHotelLoading] = useState(false);
  const hotelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hotelWrapperRef = useRef<HTMLDivElement>(null);

  // Close venue dropdown on outside click
  useEffect(() => {
    if (field.type !== "venue-search") return;
    function handleClick(e: MouseEvent) {
      if (venueWrapperRef.current && !venueWrapperRef.current.contains(e.target as Node)) {
        setShowVenueDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [field.type]);

  // Close hotel dropdown on outside click
  useEffect(() => {
    if (field.type !== "hotel-search") return;
    function handleClick(e: MouseEvent) {
      if (hotelWrapperRef.current && !hotelWrapperRef.current.contains(e.target as Node)) {
        setShowHotelDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [field.type]);

  const searchVenue = useCallback(async (query: string) => {
    if (query.length < 2) { setVenueResults([]); setShowVenueDropdown(false); return; }
    setVenueLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/venues/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setVenueResults(data);
        setShowVenueDropdown(data.length > 0);
      }
    } catch { setVenueResults([]); }
    finally { setVenueLoading(false); }
  }, []);

  function handleVenueChange(newValue: string) {
    handleChange(newValue);
    if (venueTimerRef.current) clearTimeout(venueTimerRef.current);
    venueTimerRef.current = setTimeout(() => searchVenue(newValue), 350);
  }

  const searchHotel = useCallback(async (query: string) => {
    if (query.length < 3) { setHotelResults([]); setShowHotelDropdown(false); return; }
    setHotelLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/places/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setHotelResults(data);
        setShowHotelDropdown(data.length > 0);
      }
    } catch { setHotelResults([]); }
    finally { setHotelLoading(false); }
  }, []);

  function handleHotelChange(newValue: string) {
    handleChange(newValue);
    if (hotelTimerRef.current) clearTimeout(hotelTimerRef.current);
    hotelTimerRef.current = setTimeout(() => searchHotel(newValue), 350);
  }

  function selectHotelResult(result: { placeId: string; name: string; address: string; secondaryText: string | null }) {
    setLocalValue(result.name);
    onSave(sectionKey, field.key, result.name);
    setShowHotelDropdown(false);
    setHotelResults([]);
    // Auto-fill hotel address
    if (result.address) {
      onAutoFill([{ section: sectionKey, key: "hotelAddress", value: result.address }]);
    }
  }

  function selectVenueResult(result: { name: string; address: string; city: string; country: string }) {
    setLocalValue(result.name);
    onSave(sectionKey, field.key, result.name);
    setShowVenueDropdown(false);
    setVenueResults([]);
    // Auto-fill sibling venue fields
    const fills: { section: string; key: string; value: string | null }[] = [];
    if (result.address) fills.push({ section: sectionKey, key: "venueAddress", value: result.address });
    if (result.city) fills.push({ section: sectionKey, key: "venueCity", value: result.city });
    if (result.country) fills.push({ section: sectionKey, key: "venueCountry", value: result.country });
    if (fills.length > 0) onAutoFill(fills);
  }

  useEffect(() => {
    // Don't overwrite local value while the user is actively typing
    if (!isFocusedRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  function handleChange(newValue: string) {
    setLocalValue(newValue);
    if (readOnly) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      onSave(sectionKey, field.key, newValue || null);
    }, 1500);
    setDebounceTimer(timer);
  }

  function handleFocus() {
    isFocusedRef.current = true;
  }

  function handleBlur() {
    isFocusedRef.current = false;
    if (readOnly) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    if (localValue !== value) {
      onSave(sectionKey, field.key, localValue || null);
    }
  }

  const isSent = !!fieldValue?.sentAt;
  const isValidated = !!fieldValue?.validatedAt;
  const isSaved = status === "saved" && !isSent;
  const canSend = !readOnly && !!localValue && !isValidated && !isSent;

  const statusBorder =
    isValidated ? "border-green-500/50" :
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
           {isSaved && !isSent && <span className="text-xs text-blue-400">Saved</span>}
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          {field.type === "venue-search" ? (
            <div ref={venueWrapperRef} className="relative">
              <input
                value={localValue}
                onChange={e => handleVenueChange(e.target.value)}
                onFocus={() => { handleFocus(); venueResults.length > 0 && setShowVenueDropdown(true); }}
                onBlur={handleBlur}
                readOnly={readOnly || isValidated}
                className={inputClass}
                autoComplete="off"
              />
              {venueLoading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">...</span>
              )}
              {showVenueDropdown && (
                <ul className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 shadow-xl">
                  {venueResults.map((r, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => selectVenueResult(r)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors"
                      >
                        <span className="text-white">{r.name}</span>
                        {(r.city || r.country) && (
                          <span className="text-gray-400 ml-2 text-xs">
                            {[r.city, r.country].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : field.type === "hotel-search" ? (
            <div ref={hotelWrapperRef} className="relative">
              <input
                value={localValue}
                onChange={e => handleHotelChange(e.target.value)}
                onFocus={() => { handleFocus(); hotelResults.length > 0 && setShowHotelDropdown(true); }}
                onBlur={handleBlur}
                readOnly={readOnly || isValidated}
                className={inputClass}
                autoComplete="off"
              />
              {hotelLoading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">...</span>
              )}
              {showHotelDropdown && (
                <ul className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 shadow-xl">
                  {hotelResults.map((r, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => selectHotelResult(r)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors"
                      >
                        <span className="text-white">{r.name}</span>
                        {r.address && (
                          <span className="text-gray-400 ml-2 text-xs">{r.address}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : field.type === "textarea" ? (
            <textarea
              value={localValue}
              onChange={e => handleChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              readOnly={readOnly || isValidated}
              rows={3}
              className={inputClass}
            />
          ) : field.type === "select" ? (
            <select
              value={localValue}
              onChange={e => handleChange(e.target.value)}
              onFocus={handleFocus}
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
              onFocus={handleFocus}
              onBlur={handleBlur}
              readOnly={readOnly || isValidated}
              placeholder={field.placeholder}
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
