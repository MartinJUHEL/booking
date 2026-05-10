"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Booking } from "./types";

interface VenueResult {
  label: string;
  name: string;
  city: string;
  country: string;
}

interface Props {
  booking: Booking | null;
  onSave: (data: Partial<Booking>) => void;
  onClose: () => void;
}

export default function BookingForm({ booking, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    date: booking?.date ? new Date(booking.date).toISOString().split("T")[0] : "",
    time: booking?.time || "",
    promoter: booking?.promoter || "",
    venue: booking?.venue || "",
    city: booking?.city || "",
    country: booking?.country || "",
    fee: booking?.fee?.toString() || "",
    contractSigned: booking?.contractSigned || false,
    agencyFeesPaid: booking?.agencyFeesPaid || false,
    artistFeesPaid: booking?.artistFeesPaid || false,
    transportBooked: booking?.transportBooked || false,
    transportInfo: booking?.transportInfo || "",
    hotelBooked: booking?.hotelBooked || false,
    hotelInfo: booking?.hotelInfo || "",
    notes: booking?.notes || "",
    status: booking?.status || "pending",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ ...form, fee: parseFloat(form.fee) || 0 } as Partial<Booking>);
  }

  // Venue autocomplete
  const [venueResults, setVenueResults] = useState<VenueResult[]>([]);
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [venueLoading, setVenueLoading] = useState(false);
  const venueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const venueWrapperRef = useRef<HTMLDivElement>(null);

  const searchVenue = useCallback(async (query: string) => {
    if (query.length < 2) {
      setVenueResults([]);
      setShowVenueDropdown(false);
      return;
    }
    setVenueLoading(true);
    try {
      const res = await fetch(`/api/venues/search?q=${encodeURIComponent(query)}`);
      const data: VenueResult[] = await res.json();
      setVenueResults(data);
      setShowVenueDropdown(data.length > 0);
    } catch {
      setVenueResults([]);
    } finally {
      setVenueLoading(false);
    }
  }, []);

  function handleVenueChange(value: string) {
    set("venue", value);
    if (venueTimerRef.current) clearTimeout(venueTimerRef.current);
    venueTimerRef.current = setTimeout(() => searchVenue(value), 350);
  }

  function selectVenue(result: VenueResult) {
    setForm((prev) => ({
      ...prev,
      venue: result.name,
      city: result.city || prev.city,
      country: result.country || prev.country,
    }));
    setShowVenueDropdown(false);
    setVenueResults([]);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (venueWrapperRef.current && !venueWrapperRef.current.contains(e.target as Node)) {
        setShowVenueDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold">
            {booking ? "Modifier la date" : "Nouvelle date"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date *">
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Heure">
              <input
                type="time"
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
                className="input"
              />
            </Field>
          </div>

          {/* Venue info */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Promoter *">
              <input
                required
                value={form.promoter}
                onChange={(e) => set("promoter", e.target.value)}
                className="input"
                placeholder="Live Nation, Elrow..."
              />
            </Field>
            <Field label="Venue *">
              <div ref={venueWrapperRef} className="relative">
                <input
                  required
                  value={form.venue}
                  onChange={(e) => handleVenueChange(e.target.value)}
                  onFocus={() => venueResults.length > 0 && setShowVenueDropdown(true)}
                  className="input"
                  placeholder="Rex Club, Amnesia..."
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
                          onClick={() => selectVenue(r)}
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
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Ville *">
              <input
                required
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className="input"
                placeholder="Paris"
              />
            </Field>
            <Field label="Pays *">
              <input
                required
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                className="input"
                placeholder="France"
              />
            </Field>
            <Field label="Cachet (€)">
              <input
                type="number"
                value={form.fee}
                onChange={(e) => set("fee", e.target.value)}
                className="input"
                placeholder="0"
              />
            </Field>
          </div>

          {/* Status */}
          <Field label="Statut">
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="input"
            >
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmé</option>
              <option value="cancelled">Annulé</option>
            </select>
          </Field>

          {/* Checkboxes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Checkbox
              label="Contrat signé"
              checked={form.contractSigned}
              onChange={(v) => set("contractSigned", v)}
            />
            <Checkbox
              label="Fees agence payés"
              checked={form.agencyFeesPaid}
              onChange={(v) => set("agencyFeesPaid", v)}
            />
            <Checkbox
              label="Fees artiste payés"
              checked={form.artistFeesPaid}
              onChange={(v) => set("artistFeesPaid", v)}
            />
          </div>

          {/* Transport */}
          <div className="space-y-3 p-4 rounded-xl bg-gray-800/30 border border-gray-800">
            <Checkbox
              label="Transport réservé"
              checked={form.transportBooked}
              onChange={(v) => set("transportBooked", v)}
            />
            {form.transportBooked && (
              <input
                value={form.transportInfo}
                onChange={(e) => set("transportInfo", e.target.value)}
                className="input"
                placeholder="Vol AF123 - CDG 18h00..."
              />
            )}
          </div>

          {/* Hotel */}
          <div className="space-y-3 p-4 rounded-xl bg-gray-800/30 border border-gray-800">
            <Checkbox
              label="Hotel réservé"
              checked={form.hotelBooked}
              onChange={(v) => set("hotelBooked", v)}
            />
            {form.hotelBooked && (
              <input
                value={form.hotelInfo}
                onChange={(e) => set("hotelInfo", e.target.value)}
                className="input"
                placeholder="Mama Shelter - Chambre 204..."
              />
            )}
          </div>

          {/* Notes */}
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="input min-h-[80px] resize-y"
              placeholder="Informations complémentaires..."
            />
          </Field>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
            >
              {booking ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-gray-400 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
      />
      <span className="text-sm text-gray-300">{label}</span>
    </label>
  );
}
