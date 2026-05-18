"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Booking, Promoter, Transport, TransportLeg } from "./types";
import { api } from "@/lib/api-client";

interface VenueResult {
  label: string;
  name: string;
  address: string;
  city: string;
  country: string;
}

interface Props {
  booking: Booking | null;
  promoters: Promoter[];
  onSave: (data: Partial<Booking>) => void | Promise<void>;
  onClose: () => void;
  onPromoterCreated?: (promoter: Promoter) => void;
  artistId?: string;
  agencyDefaults?: { defaultCommissionPercent?: number | null; defaultPaymentTerms?: string | null };
}

function emptyLeg(): TransportLeg {
  return { order: 0, mode: null, departureLocation: null, arrivalLocation: null, departureTime: null, arrivalTime: null, bookingReference: null, carrier: null, notes: null, ticketFileName: null, ticketOriginalName: null };
}

function initTransports(transports?: Transport[]): Transport[] {
  if (transports && transports.length > 0) {
    const sorted = [...transports].sort((a, b) => a.type === "outbound" ? -1 : b.type === "outbound" ? 1 : 0);
    return sorted.map(t => ({ ...t, legs: t.legs.length > 0 ? t.legs : [emptyLeg()] }));
  }
  return [
    { type: "outbound" as const, booked: false, legs: [emptyLeg()] },
    { type: "return" as const, booked: false, legs: [emptyLeg()] },
  ];
}

const transportModes = [
  { value: "plane", label: "Avion" },
  { value: "train", label: "Train" },
  { value: "bus", label: "Bus" },
  { value: "car", label: "Voiture" },
  { value: "taxi", label: "Taxi/VTC" },
  { value: "ferry", label: "Ferry" },
  { value: "other", label: "Autre" },
];

export default function BookingForm({ booking, promoters, onSave, onClose, onPromoterCreated, artistId, agencyDefaults }: Props) {
  const isProposal = !booking || booking.status === "proposal";

  const [form, setForm] = useState({
    date: booking?.date ? new Date(booking.date).toISOString().split("T")[0] : "",
    promoter: booking?.promoter || "",
    promoterId: booking?.promoterId || "",
    venue: booking?.venue || "",
    venueAddress: booking?.venueAddress || "",
    venueWebsite: booking?.venueWebsite || "",
    city: booking?.city || "",
    country: booking?.country || "",
    fee: booking?.fee?.toString() || "",
    allInclusive: booking?.allInclusive || false,
    contractSigned: booking?.contractSigned || false,
    agencyFeesPaid: booking?.agencyFeesPaid || false,
    artistFeesPaid: booking?.artistFeesPaid || false,
    transports: initTransports(booking?.transports),
    hotel: {
      booked: booking?.hotel?.booked || false,
      name: booking?.hotel?.name || "",
      address: booking?.hotel?.address || "",
      bookingNumber: booking?.hotel?.bookingNumber || "",
      breakfast: booking?.hotel?.breakfast || false,
      lateCheckout: booking?.hotel?.lateCheckout || false,
      checkIn: booking?.hotel?.checkIn || "",
      notes: booking?.hotel?.notes || "",
    },
    notes: booking?.notes || "",
    status: booking?.status || "proposal",
    // Proposal fields (use agency defaults for new proposals)
    format: booking?.format || "",
    setDuration: booking?.setDuration?.toString() || "",
    lineup: booking?.lineup || "",
    ticketPrice: booking?.ticketPrice || "",
    announcementDate: booking?.announcementDate ? new Date(booking.announcementDate).toISOString().split("T")[0] : "",
    numberOfInvitations: booking?.numberOfInvitations?.toString() || "",
    exclusivity: booking?.exclusivity || "",
    commissionPercent: booking?.commissionPercent?.toString() || (!booking && agencyDefaults?.defaultCommissionPercent != null ? agencyDefaults.defaultCommissionPercent.toString() : ""),
    paymentTerms: booking?.paymentTerms || (!booking && agencyDefaults?.defaultPaymentTerms ? agencyDefaults.defaultPaymentTerms : ""),
  });

  const [promoterMode, setPromoterMode] = useState<"select" | "new">(
    booking?.promoterId ? "select" : promoters.length > 0 ? "select" : "new"
  );

  const [showNewPromoter, setShowNewPromoter] = useState(false);
  const [creatingPromoter, setCreatingPromoter] = useState(false);
  const [newPromoter, setNewPromoter] = useState({ name: "", company: "", email: "", phone: "" });

  async function handleCreatePromoter() {
    if (!newPromoter.name) return;
    setCreatingPromoter(true);
    try {
      const created = await api.post<Promoter>("/api/promoters", 
        artistId ? { ...newPromoter, artistId } : newPromoter
      );
      setForm((prev) => ({ ...prev, promoter: created.name, promoterId: created.id }));
      setShowNewPromoter(false);
      setPromoterMode("select");
      setNewPromoter({ name: "", company: "", email: "", phone: "" });
      onPromoterCreated?.(created);
    } finally {
      setCreatingPromoter(false);
    }
  }

  const [saving, setSaving] = useState(false);
  const [contractName, setContractName] = useState<string | null>(booking?.contractOriginalName || null);
  const [contractUploading, setContractUploading] = useState(false);

  async function handleContractUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !booking) return;
    setContractUploading(true);
    try {
      const res = await api.upload<{ contractOriginalName: string }>(`/api/bookings/${booking.id}/contract`, file);
      setContractName(res.contractOriginalName || file.name);
    } catch {
      alert("Erreur lors de l'envoi du contrat");
    } finally {
      setContractUploading(false);
      e.target.value = "";
    }
  }

  async function handleContractDownload() {
    if (!booking) return;
    await api.downloadFile(`/api/bookings/${booking.id}/contract`, contractName || "contract");
  }

  async function handleContractDelete() {
    if (!booking || !confirm("Supprimer le contrat ?")) return;
    setContractUploading(true);
    try {
      await api.delete(`/api/bookings/${booking.id}/contract`);
      setContractName(null);
    } catch {
      alert("Erreur lors de la suppression");
    } finally {
      setContractUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Record<string, unknown> = {
      ...form,
      fee: parseFloat(form.fee) || 0,
      hotel: {
        ...form.hotel,
        checkIn: form.hotel.checkIn || null,
      },
      // Proposal fields
      format: form.format || null,
      setDuration: form.setDuration ? parseInt(form.setDuration) : null,
      lineup: form.lineup || null,
      ticketPrice: form.ticketPrice || null,
      announcementDate: form.announcementDate || null,
      numberOfInvitations: form.numberOfInvitations ? parseInt(form.numberOfInvitations) : null,
      exclusivity: form.exclusivity || null,
      commissionPercent: form.commissionPercent ? parseFloat(form.commissionPercent) : null,
      paymentTerms: form.paymentTerms || null,
    };
    if (promoterMode === "new") {
      data.promoterId = "";
    }
    setSaving(true);
    try {
      await onSave(data as Partial<Booking>);
    } finally {
      setSaving(false);
    }
  }

  function selectPromoter(id: string) {
    const p = promoters.find((p) => p.id === id);
    if (p) {
      setForm((prev) => ({ ...prev, promoter: p.name, promoterId: p.id }));
    } else {
      setForm((prev) => ({ ...prev, promoter: "", promoterId: "" }));
    }
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
      const data = await api.get<VenueResult[]>(`/api/venues/search?q=${encodeURIComponent(query)}`);
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
      venueAddress: result.address || prev.venueAddress,
      city: result.city || prev.city,
      country: result.country || prev.country,
    }));
    setShowVenueDropdown(false); setVenueResults([]);
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

  // Hotel address autocomplete (via backend API)
  interface PlaceResult {
    placeId: string;
    name: string;
    address: string;
    secondaryText: string | null;
  }

  const [hotelPlaceResults, setHotelPlaceResults] = useState<PlaceResult[]>([]);
  const [showHotelDropdown, setShowHotelDropdown] = useState(false);
  const [hotelSearchLoading, setHotelSearchLoading] = useState(false);
  const hotelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hotelWrapperRef = useRef<HTMLDivElement>(null);

  const searchHotelAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setHotelPlaceResults([]);
      setShowHotelDropdown(false);
      return;
    }
    setHotelSearchLoading(true);
    try {
      const data = await api.get<PlaceResult[]>(`/api/places/search?q=${encodeURIComponent(query)}`);
      setHotelPlaceResults(data);
      setShowHotelDropdown(data.length > 0);
    } catch {
      setHotelPlaceResults([]);
    } finally {
      setHotelSearchLoading(false);
    }
  }, []);

  function handleHotelAddressChange(value: string) {
    setHotel("address", value);
    if (hotelTimerRef.current) clearTimeout(hotelTimerRef.current);
    hotelTimerRef.current = setTimeout(() => searchHotelAddress(value), 350);
  }

  function selectHotelPlace(place: PlaceResult) {
    setHotel("address", place.address);
    if (!form.hotel.name) {
      setHotel("name", place.name);
    }
    setShowHotelDropdown(false);
    setHotelPlaceResults([]);
  }

  // Close hotel dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (hotelWrapperRef.current && !hotelWrapperRef.current.contains(e.target as Node)) {
        setShowHotelDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setHotel<K extends keyof typeof form.hotel>(key: K, value: (typeof form.hotel)[K]) {
    setForm((prev) => ({ ...prev, hotel: { ...prev.hotel, [key]: value } }));
  }

  function updateLeg<K extends keyof TransportLeg>(tIdx: number, lIdx: number, key: K, value: TransportLeg[K]) {
    setForm((prev) => {
      const transports = [...prev.transports];
      const legs = [...transports[tIdx].legs];
      legs[lIdx] = { ...legs[lIdx], [key]: value };
      transports[tIdx] = { ...transports[tIdx], legs };
      return { ...prev, transports };
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold">
            {booking ? (isProposal ? "Modifier la proposition" : "Modifier la date") : "Nouvelle proposition"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date */}
          <div>
            <Field label="Date *">
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="input"
              />
            </Field>
          </div>

          {/* Promoter */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-400">Promoteur *</span>
              <div className="flex gap-1">
                {promoters.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPromoterMode("select")}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${
                      promoterMode === "select"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    Liste
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPromoterMode("new");
                    setForm((prev) => ({ ...prev, promoterId: "" }));
                    setShowNewPromoter(false);
                  }}
                  className={`text-xs px-2 py-0.5 rounded transition-colors ${
                    promoterMode === "new" && !showNewPromoter
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  Saisie libre
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPromoterMode("new");
                    setShowNewPromoter(true);
                  }}
                  className={`text-xs px-2 py-0.5 rounded transition-colors ${
                    showNewPromoter
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  + Créer
                </button>
              </div>
            </div>
            {promoterMode === "select" && promoters.length > 0 ? (
              <select
                required
                value={form.promoterId}
                onChange={(e) => selectPromoter(e.target.value)}
                className="input"
              >
                <option value="">-- Choisir un promoteur --</option>
                {promoters.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.company ? ` (${p.company})` : ""}
                  </option>
                ))}
              </select>
            ) : showNewPromoter ? (
              <div className="space-y-3 p-4 rounded-xl bg-gray-800/30 border border-gray-800">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nom *">
                    <input
                      value={newPromoter.name}
                      onChange={(e) => setNewPromoter((p) => ({ ...p, name: e.target.value }))}
                      className="input"
                      placeholder="Live Nation..."
                    />
                  </Field>
                  <Field label="Société">
                    <input
                      value={newPromoter.company}
                      onChange={(e) => setNewPromoter((p) => ({ ...p, company: e.target.value }))}
                      className="input"
                      placeholder="Nom de la société"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Email">
                    <input
                      type="email"
                      value={newPromoter.email}
                      onChange={(e) => setNewPromoter((p) => ({ ...p, email: e.target.value }))}
                      className="input"
                      placeholder="contact@promoteur.com"
                    />
                  </Field>
                  <Field label="Téléphone">
                    <input
                      value={newPromoter.phone}
                      onChange={(e) => setNewPromoter((p) => ({ ...p, phone: e.target.value }))}
                      className="input"
                      placeholder="+33 6 12 34 56 78"
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  disabled={!newPromoter.name || creatingPromoter}
                  onClick={handleCreatePromoter}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
                >
                  {creatingPromoter ? "Création..." : "Créer le promoteur"}
                </button>
              </div>
            ) : (
              <input
                required
                value={form.promoter}
                onChange={(e) => set("promoter", e.target.value)}
                className="input"
                placeholder="Live Nation, Elrow..."
              />
            )}
          </div>

          {/* Venue */}
          <fieldset className="space-y-3 rounded-xl border border-gray-800 p-4">
            <legend className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Venue</legend>
            <Field label="Nom *">
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
            <Field label="Adresse">
              <input
                value={form.venueAddress}
                onChange={(e) => set("venueAddress", e.target.value)}
                className="input"
                placeholder="123 rue de la Musique, 75001 Paris"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ville *">
                <input
                  required
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  className="input text-xs"
                  placeholder="Paris"
                />
              </Field>
              <Field label="Pays *">
                <input
                  required
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  className="input text-xs"
                  placeholder="France"
                />
              </Field>
            </div>
            <Field label="Site web">
              <input
                type="url"
                value={form.venueWebsite}
                onChange={(e) => set("venueWebsite", e.target.value)}
                className="input"
                placeholder="https://www.venue.com"
              />
            </Field>
          </fieldset>

          {/* Cachet */}
          <fieldset className="space-y-3 rounded-xl border border-gray-800 p-4">
            <legend className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cachet</legend>
            <Field label="Montant (€)">
              <input
                type="number"
                value={form.fee}
                onChange={(e) => set("fee", e.target.value)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="input"
                placeholder="0"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allInclusive}
                onChange={(e) => set("allInclusive", e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
              />
              All inclusive
            </label>
          </fieldset>

          {/* Proposal fields */}
          {isProposal && (
            <fieldset className="space-y-3 rounded-xl border border-gray-800 p-4">
              <legend className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Proposition</legend>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Format">
                  <select
                    value={form.format}
                    onChange={(e) => set("format", e.target.value)}
                    className="input"
                  >
                    <option value="">-- Choisir --</option>
                    <option value="djset">DJ Set</option>
                    <option value="live">Live</option>
                  </select>
                </Field>
                <Field label="Durée du set (min)">
                  <input
                    type="number"
                    value={form.setDuration}
                    onChange={(e) => set("setDuration", e.target.value)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    className="input"
                    placeholder="90"
                  />
                </Field>
              </div>
              <Field label="Programme / Lineup">
                <textarea
                  value={form.lineup}
                  onChange={(e) => set("lineup", e.target.value)}
                  className="input min-h-[80px] resize-y"
                  placeholder="23H00-00H30 : DJ A&#10;00H30-02H00 : DJ B&#10;02H00-03H30 : DJ C"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Prix d'entrée">
                  <input
                    value={form.ticketPrice}
                    onChange={(e) => set("ticketPrice", e.target.value)}
                    className="input"
                    placeholder="18€"
                  />
                </Field>
                <Field label="Date d'annonce">
                  <input
                    type="date"
                    value={form.announcementDate}
                    onChange={(e) => set("announcementDate", e.target.value)}
                    className="input"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nombre d'invitations">
                  <input
                    type="number"
                    value={form.numberOfInvitations}
                    onChange={(e) => set("numberOfInvitations", e.target.value)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    className="input"
                    placeholder="4"
                  />
                </Field>
                <Field label="Commission (%)">
                  <input
                    type="number"
                    step="0.1"
                    value={form.commissionPercent}
                    onChange={(e) => set("commissionPercent", e.target.value)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    className="input"
                    placeholder="15"
                  />
                </Field>
              </div>
              <Field label="Exclusivité">
                <input
                  value={form.exclusivity}
                  onChange={(e) => set("exclusivity", e.target.value)}
                  className="input"
                  placeholder="Période & périmètre, ou /"
                />
              </Field>
              <Field label="Conditions de paiement">
                <textarea
                  value={form.paymentTerms}
                  onChange={(e) => set("paymentTerms", e.target.value)}
                  className="input min-h-[60px] resize-y"
                  placeholder="50% à la signature ; 50% le lendemain"
                />
              </Field>
            </fieldset>
          )}

          {/* Status - only for confirmed bookings */}
          {!isProposal && (
            <Field label="Statut">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className="input"
              >
                <option value="confirmed">Confirmé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </Field>
          )}

          {/* Checkboxes - only for confirmed bookings */}
          {!isProposal && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Checkbox
                label="Contrat signé"
                checked={form.contractSigned}
                onChange={() => {}}
                disabled
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
          )}

          {/* Transport - only for confirmed bookings */}
          {!isProposal && form.transports.map((transport, tIdx) => (
            <div key={transport.type} className="space-y-3 p-4 rounded-xl bg-gray-800/30 border border-gray-800">
              <Checkbox
                label={transport.type === "outbound" ? "Transport aller réservé" : "Transport retour réservé"}
                checked={transport.booked}
                onChange={(v) => {
                  const updated = [...form.transports];
                  updated[tIdx] = { ...updated[tIdx], booked: v };
                  setForm((prev) => ({ ...prev, transports: updated }));
                }}
              />
              {transport.booked && (
                <div className="space-y-4">
                  {transport.legs.map((leg, lIdx) => (
                    <div key={lIdx} className="space-y-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-400">Trajet {lIdx + 1}</span>
                        {transport.legs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...form.transports];
                              updated[tIdx] = { ...updated[tIdx], legs: updated[tIdx].legs.filter((_, i) => i !== lIdx) };
                              setForm((prev) => ({ ...prev, transports: updated }));
                            }}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Mode">
                          <select
                            value={leg.mode || ""}
                            onChange={(e) => updateLeg(tIdx, lIdx, "mode", e.target.value || null)}
                            className="input"
                          >
                            <option value="">-- Mode --</option>
                            {transportModes.map((m) => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Compagnie">
                          <input
                            value={leg.carrier || ""}
                            onChange={(e) => updateLeg(tIdx, lIdx, "carrier", e.target.value || null)}
                            className="input"
                            placeholder="SNCF, Ryanair..."
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Départ">
                          <StationAutocomplete
                            value={leg.departureLocation || ""}
                            onChange={(v) => updateLeg(tIdx, lIdx, "departureLocation", v || null)}
                            placeholder="Gare de Lyon, CDG T2..."
                          />
                        </Field>
                        <Field label="Arrivée">
                          <StationAutocomplete
                            value={leg.arrivalLocation || ""}
                            onChange={(v) => updateLeg(tIdx, lIdx, "arrivalLocation", v || null)}
                            placeholder="Berlin Hbf, BCN T1..."
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Heure départ">
                          <input
                            type="datetime-local"
                            value={leg.departureTime ? leg.departureTime.slice(0, 16) : ""}
                            onChange={(e) => updateLeg(tIdx, lIdx, "departureTime", e.target.value ? new Date(e.target.value).toISOString() : null)}
                            className="input"
                          />
                        </Field>
                        <Field label="Heure arrivée">
                          <input
                            type="datetime-local"
                            value={leg.arrivalTime ? leg.arrivalTime.slice(0, 16) : ""}
                            onChange={(e) => updateLeg(tIdx, lIdx, "arrivalTime", e.target.value ? new Date(e.target.value).toISOString() : null)}
                            className="input"
                          />
                        </Field>
                      </div>
                      <Field label="N° de réservation">
                        <input
                          value={leg.bookingReference || ""}
                          onChange={(e) => updateLeg(tIdx, lIdx, "bookingReference", e.target.value || null)}
                          className="input"
                          placeholder="ABC123"
                        />
                      </Field>
                      {/* Ticket upload */}
                      <TicketUpload
                        leg={leg}
                        onUploaded={(fileName, originalName) => {
                          updateLeg(tIdx, lIdx, "ticketFileName", fileName);
                          updateLeg(tIdx, lIdx, "ticketOriginalName", originalName);
                        }}
                        onDeleted={() => {
                          updateLeg(tIdx, lIdx, "ticketFileName", null);
                          updateLeg(tIdx, lIdx, "ticketOriginalName", null);
                        }}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...form.transports];
                      updated[tIdx] = { ...updated[tIdx], legs: [...updated[tIdx].legs, { ...emptyLeg(), order: updated[tIdx].legs.length }] };
                      setForm((prev) => ({ ...prev, transports: updated }));
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    + Ajouter un trajet
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Hotel - only for confirmed bookings */}
          {!isProposal && (
          <div className="space-y-3 p-4 rounded-xl bg-gray-800/30 border border-gray-800">
            <Checkbox
              label="Hotel réservé"
              checked={form.hotel.booked}
              onChange={(v) => setHotel("booked", v)}
            />
            {form.hotel.booked && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nom de l'hôtel">
                    <input
                      value={form.hotel.name}
                      onChange={(e) => setHotel("name", e.target.value)}
                      className="input"
                      placeholder="Mama Shelter, Ibis..."
                    />
                  </Field>
                  <Field label="N° de réservation">
                    <input
                      value={form.hotel.bookingNumber}
                      onChange={(e) => setHotel("bookingNumber", e.target.value)}
                      className="input"
                      placeholder="BKG-123456"
                    />
                  </Field>
                </div>
                <Field label="Adresse">
                  <div ref={hotelWrapperRef} className="relative">
                    <input
                      value={form.hotel.address}
                      onChange={(e) => handleHotelAddressChange(e.target.value)}
                      onFocus={() => hotelPlaceResults.length > 0 && setShowHotelDropdown(true)}
                      className="input"
                      placeholder="Rechercher une adresse..."
                      autoComplete="off"
                    />
                    {hotelSearchLoading && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">...</span>
                    )}
                    {showHotelDropdown && (
                      <ul className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 shadow-xl">
                        {hotelPlaceResults.map((p) => (
                          <li key={p.placeId}>
                            <button
                              type="button"
                              onClick={() => selectHotelPlace(p)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors"
                            >
                              <span className="text-white">{p.name}</span>
                              {p.secondaryText && (
                                <span className="text-gray-400 ml-2 text-xs">{p.secondaryText}</span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Field>
                <Field label="Check-in">
                  <input
                    type="datetime-local"
                    value={form.hotel.checkIn}
                    onChange={(e) => setHotel("checkIn", e.target.value)}
                    className="input"
                  />
                </Field>
                <div className="flex gap-6">
                  <Checkbox
                    label="Petit-déjeuner inclus"
                    checked={form.hotel.breakfast}
                    onChange={(v) => setHotel("breakfast", v)}
                  />
                  <Checkbox
                    label="Late checkout"
                    checked={form.hotel.lateCheckout}
                    onChange={(v) => setHotel("lateCheckout", v)}
                  />
                </div>
                <Field label="Informations supplémentaires">
                  <textarea
                    value={form.hotel.notes}
                    onChange={(e) => setHotel("notes", e.target.value)}
                    className="input min-h-[60px] resize-y"
                    placeholder="Infos complémentaires (accès, parking, contact...)"
                  />
                </Field>
              </div>
            )}
          </div>
          )}

          {/* Notes */}
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="input min-h-[80px] resize-y"
              placeholder="Informations complémentaires..."
            />
          </Field>

          {/* Contract - only for existing confirmed bookings */}
          {booking && booking.status === "confirmed" && (
            <div className="space-y-2">
              <span className="text-sm text-gray-400 block">Contrat</span>
              {contractName ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <svg className="w-5 h-5 text-purple-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="text-sm text-gray-200 truncate flex-1">{contractName}</span>
                  <button
                    type="button"
                    onClick={handleContractDownload}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Télécharger
                  </button>
                  <button
                    type="button"
                    onClick={handleContractDelete}
                    disabled={contractUploading}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-colors">
                    {contractUploading ? "Envoi..." : "Ajouter un contrat"}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={handleContractUpload}
                      disabled={contractUploading}
                    />
                  </label>
                  <span className="text-xs text-gray-500">PDF, JPEG, PNG, WebP (max 10 Mo)</span>
                </div>
              )}
            </div>
          )}

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
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
            >
              {saving ? "Enregistrement..." : booking ? "Enregistrer" : "Créer la proposition"}
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
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center gap-2 select-none ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
      />
      <span className="text-sm text-gray-300">{label}</span>
    </label>
  );
}

function TicketUpload({
  leg,
  onUploaded,
  onDeleted,
}: {
  leg: TransportLeg;
  onUploaded: (fileName: string, originalName: string) => void;
  onDeleted: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    if (!leg.id) return;
    setUploading(true);
    try {
      const result = await api.upload<{ ticketFileName: string; ticketOriginalName: string }>(
        `/api/transport-legs/${leg.id}/ticket`,
        file
      );
      onUploaded(result.ticketFileName, result.ticketOriginalName);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!leg.id) return;
    setDeleting(true);
    try {
      await api.delete(`/api/transport-legs/${leg.id}/ticket`);
      onDeleted();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  }

  if (!leg.id) {
    return (
      <div className="text-xs text-gray-600 italic">
        Enregistrez d&apos;abord pour ajouter un billet
      </div>
    );
  }

  return (
    <Field label="Billet (PDF / Photo)">
      {leg.ticketFileName ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => api.downloadFile(`/api/transport-legs/${leg.id}/ticket`, leg.ticketOriginalName || "ticket")}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors truncate"
          >
            {leg.ticketOriginalName || "Voir le billet"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-400 hover:text-red-300 transition-colors shrink-0"
          >
            {deleting ? "..." : "Supprimer"}
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-sm px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-colors"
          >
            {uploading ? "Upload..." : "Ajouter un billet"}
          </button>
        </div>
      )}
    </Field>
  );
}

function StationAutocomplete({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  interface StationResult {
    placeId: string;
    name: string;
    address: string;
    secondaryText: string | null;
  }

  const [results, setResults] = useState<StationResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get<StationResult[]>(`/api/stations/search?q=${encodeURIComponent(query)}`);
      setResults(data);
      setShowDropdown(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(v: string) {
    onChange(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(v), 350);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
        className="input"
        placeholder={placeholder}
        autoComplete="off"
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">...</span>
      )}
      {showDropdown && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 shadow-xl">
          {results.map((r) => (
            <li key={r.placeId}>
              <button
                type="button"
                onClick={() => {
                  onChange(r.name);
                  setShowDropdown(false);
                  setResults([]);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors"
              >
                <span className="text-white">{r.name}</span>
                {r.secondaryText && (
                  <span className="text-gray-400 ml-2 text-xs">{r.secondaryText}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
