"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import BookingForm from "./BookingForm";
import AdvancingReview from "./AdvancingReview";
import type { Booking, Promoter } from "./types";

const statusColors: Record<string, string> = {
  proposal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  declined: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels: Record<string, string> = {
  proposal: "Proposition",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  declined: "Refusée",
};

const formatLabels: Record<string, string> = {
  djset: "DJ Set",
  live: "Live",
};

const MODE_LABELS: Record<string, string> = {
  plane: "Avion",
  train: "Train",
  bus: "Bus",
  car: "Voiture",
  taxi: "Taxi/VTC",
  ferry: "Ferry",
  other: "Autre",
};

export default function BookerBookingPage({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [agencyDefaults, setAgencyDefaults] = useState<{ defaultCommissionPercent?: number | null; defaultPaymentTerms?: string | null }>({});

  // Validate/Decline
  const [validating, setValidating] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [contractFile, setContractFile] = useState<File | null>(null);

  // Roadsheet
  const [sendingRoadsheet, setSendingRoadsheet] = useState(false);
  const [roadsheetSent, setRoadsheetSent] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState(false);

  const fetchBooking = useCallback(async () => {
    try {
      const data = await api.get<Booking>(`/api/bookings/${bookingId}`);
      setBooking(data);
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [bookingId, router]);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "booker") { router.push("/"); return; }
    fetchBooking();
  }, [user, router, fetchBooking]);

  async function handleEdit() {
    try {
      const [data, agency] = await Promise.all([
        api.get<Promoter[]>(`/api/promoters`),
        api.get<{ defaultCommissionPercent?: number | null; defaultPaymentTerms?: string | null }>(`/api/agency`),
      ]);
      setPromoters(data);
      if (agency) setAgencyDefaults(agency);
    } catch {}
    setEditing(true);
  }

  async function handleSave(data: Partial<Booking>) {
    const updated = await api.put<Booking>(`/api/bookings/${bookingId}`, data);
    setBooking(updated);
    setEditing(false);
  }

  async function handleValidate() {
    if (!booking) return;
    setValidating(true);
    try {
      if (contractFile) {
        const formData = new FormData();
        formData.append("file", contractFile);
        const res = await fetch(`/api/bookings/${booking.id}/validate`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        await api.post(`/api/bookings/${booking.id}/validate`, {});
      }
      await fetchBooking();
      setShowValidateModal(false);
      setContractFile(null);
    } finally {
      setValidating(false);
    }
  }

  async function handleDecline() {
    if (!booking || !confirm("Refuser cette proposition ?")) return;
    setDeclining(true);
    try {
      await api.post(`/api/bookings/${booking.id}/decline`, {});
      await fetchBooking();
    } finally {
      setDeclining(false);
    }
  }

  async function handleDelete() {
    if (!booking || !confirm("Supprimer cette date ?")) return;
    setDeleting(true);
    try {
      await api.delete(`/api/bookings/${booking.id}`);
      router.push("/");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSendRoadsheet() {
    setSendingRoadsheet(true);
    try {
      await api.post(`/api/bookings/${bookingId}/send-roadsheet`, {});
      setRoadsheetSent(true);
      setTimeout(() => setRoadsheetSent(false), 3000);
    } catch {
      alert("Erreur lors de l'envoi");
    } finally {
      setSendingRoadsheet(false);
    }
  }

  if (loading || !booking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

  const dateStr = new Date(booking.date).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // Edit mode
  if (editing) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
              ← Retour au détail
            </button>
            <h1 className="text-sm font-medium text-gray-300">Modification</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <BookingForm
            booking={booking}
            promoters={promoters}
            onSave={handleSave}
            onClose={() => setEditing(false)}
            onPromoterCreated={(p) => setPromoters((prev) => [...prev, p].sort((a, b) => a.name.localeCompare(b.name)))}
            agencyDefaults={agencyDefaults}
          />
        </div>
      </div>
    );
  }

  // Detail mode
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white text-sm flex items-center gap-1">
            ← Retour
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              Modifier
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{booking.venue}</h1>
            <p className="text-gray-400 capitalize">{dateStr}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusColors[booking.status] || ""}`}>
              {statusLabels[booking.status] || booking.status}
            </span>
            <p className="text-xl font-semibold font-mono mt-2">
              {booking.fee.toLocaleString("fr-FR")} €
              {booking.allInclusive && <span className="ml-2 text-xs text-emerald-400">(AI)</span>}
            </p>
          </div>
        </div>

        {/* Proposal actions */}
        {booking.status === "proposal" && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowValidateModal(true)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Valider la proposition
            </button>
            <button
              onClick={handleDecline}
              disabled={declining}
              className="flex-1 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 text-red-400 font-medium px-4 py-2 rounded-lg text-sm transition-colors border border-red-600/30"
            >
              {declining ? "Refus..." : "Refuser"}
            </button>
          </div>
        )}

        {/* Validate modal */}
        {showValidateModal && (
          <div className="rounded-xl bg-gray-900 border border-gray-700 p-5 space-y-4">
            <h3 className="text-sm font-semibold">Valider la proposition</h3>
            <p className="text-xs text-gray-400">Vous pouvez joindre le contrat signé (optionnel).</p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setContractFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-600 file:text-sm file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600"
            />
            <div className="flex gap-2">
              <button
                onClick={handleValidate}
                disabled={validating}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm"
              >
                {validating ? "Validation..." : contractFile ? "Valider avec contrat" : "Valider sans contrat"}
              </button>
              <button
                onClick={() => { setShowValidateModal(false); setContractFile(null); }}
                className="text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm border border-gray-700"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Event Info */}
        <Section title="Événement">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <Field label="Salle" value={booking.venue} />
            {booking.venueAddress && <Field label="Adresse" value={booking.venueAddress} />}
            <Field label="Ville" value={`${booking.city}, ${booking.country}`} />
            <div>
              <p className="text-xs text-gray-500">Promoteur</p>
              <p className="text-sm font-medium text-white">{booking.promoter}</p>
              {booking.promoterRel && (
                <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-gray-700 text-xs text-gray-400">
                  {booking.promoterRel.company && <p>Société : {booking.promoterRel.company}</p>}
                  {booking.promoterRel.email && <p>Email : {booking.promoterRel.email}</p>}
                  {booking.promoterRel.phone && <p>Tél : {booking.promoterRel.phone}</p>}
                </div>
              )}
            </div>
            {booking.venueWebsite && (
              <div>
                <p className="text-xs text-gray-500">Site web</p>
                <a href={booking.venueWebsite} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline">{booking.venueWebsite}</a>
              </div>
            )}
          </div>
        </Section>

        {/* Proposal details */}
        {(booking.status === "proposal" || booking.status === "declined") && (
          <Section title="Détails de la proposition">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {booking.format && <Field label="Format" value={formatLabels[booking.format] || booking.format} />}
              {booking.setDuration && <Field label="Durée du set" value={`${booking.setDuration} min`} />}
              {booking.lineup && <Field label="Programme" value={booking.lineup} />}
              {booking.ticketPrice && <Field label="Prix d'entrée" value={booking.ticketPrice} />}
              {booking.announcementDate && <Field label="Date d'annonce" value={new Date(booking.announcementDate).toLocaleDateString("fr-FR")} />}
              {booking.numberOfInvitations != null && <Field label="Invitations" value={`${booking.numberOfInvitations} pax`} />}
              {booking.exclusivity && <Field label="Exclusivité" value={booking.exclusivity} />}
              {booking.commissionPercent != null && <Field label="Commission" value={`${booking.commissionPercent}%`} />}
              {booking.paymentTerms && <Field label="Conditions de paiement" value={booking.paymentTerms} />}
            </div>
          </Section>
        )}

        {/* Contract */}
        <Section title="Contrat">
          {booking.contractFileUrl ? (
            <button
              onClick={() => api.downloadFile(`/api/bookings/${booking.id}/contract`, booking.contractOriginalName || "contrat")}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              {booking.contractOriginalName || "Télécharger le contrat"}
            </button>
          ) : (
            <p className="text-sm text-gray-500 italic">Aucun contrat joint</p>
          )}
        </Section>

        {/* Checklist */}
        <Section title="Checklist">
          <div className="space-y-2">
            <CheckItem label="Contrat signé" checked={booking.contractSigned} />
            <CheckItem label="Fees agence payés" checked={booking.agencyFeesPaid} />
            <CheckItem label="Fees artiste payés" checked={booking.artistFeesPaid} />
          </div>
        </Section>

        {/* Hotel */}
        <Section title="Logement">
          {booking.hotel?.booked ? (
            <div className="space-y-3 text-sm">
              {booking.hotel.name && <Field label="Hôtel" value={booking.hotel.name} />}
              {booking.hotel.address && (
                <div>
                  <p className="text-xs text-gray-500">Adresse</p>
                  <p className="text-sm text-gray-300">{booking.hotel.address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.hotel.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    Voir sur Google Maps
                  </a>
                </div>
              )}
              {booking.hotel.bookingNumber && <Field label="N° de réservation" value={booking.hotel.bookingNumber} mono />}
              {booking.hotel.checkIn && (
                <Field label="Check-in" value={new Date(booking.hotel.checkIn).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
              )}
              <div className="flex gap-3">
                <Tag active={booking.hotel.breakfast} label="Petit-déjeuner" />
                <Tag active={booking.hotel.lateCheckout} label="Late checkout" />
              </div>
              {booking.hotel.notes && <Field label="Notes" value={booking.hotel.notes} />}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Aucun logement réservé</p>
          )}
        </Section>

        {/* Transport */}
        {["outbound", "return"].map((type) => {
          const transport = booking.transports?.find(t => t.type === type);
          const label = type === "outbound" ? "Transport aller" : "Transport retour";
          return (
            <Section key={type} title={label}>
              {transport?.booked ? (
                <div className="space-y-3">
                  {transport.legs.map((leg, i) => (
                    <div key={leg.id || i} className="rounded-lg bg-gray-800/30 border border-gray-800 p-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        {leg.mode && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                            {MODE_LABELS[leg.mode] || leg.mode}
                          </span>
                        )}
                        {leg.carrier && <span className="text-xs text-gray-400">{leg.carrier}</span>}
                      </div>
                      {(leg.departureLocation || leg.arrivalLocation) && (
                        <p className="text-gray-300">{leg.departureLocation || "?"} → {leg.arrivalLocation || "?"}</p>
                      )}
                      {(leg.departureTime || leg.arrivalTime) && (
                        <p className="text-xs text-gray-400">
                          {leg.departureTime && new Date(leg.departureTime).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                          {leg.departureTime && leg.arrivalTime && " → "}
                          {leg.arrivalTime && new Date(leg.arrivalTime).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                      )}
                      {leg.bookingReference && <Field label="Réf." value={leg.bookingReference} mono />}
                      {leg.notes && <p className="text-xs text-gray-500 italic">{leg.notes}</p>}
                      {leg.ticketFileName && leg.id && (
                        <button
                          onClick={() => api.downloadFile(`/api/transport-legs/${leg.id}/ticket`, leg.ticketOriginalName || "ticket")}
                          className="text-xs text-purple-400 hover:text-purple-300"
                        >
                          📎 {leg.ticketOriginalName || "Télécharger billet"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Aucun transport réservé</p>
              )}
            </Section>
          );
        })}

        {/* Notes */}
        {booking.notes && (
          <Section title="Notes">
            <p className="text-sm text-gray-400 whitespace-pre-wrap">{booking.notes}</p>
          </Section>
        )}

        {/* Roadsheet + Advancing */}
        <Section title="Feuille de route & Advancing">
          <div className="space-y-3">
            <button
              onClick={handleSendRoadsheet}
              disabled={sendingRoadsheet}
              className="w-full text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {roadsheetSent ? "Feuille de route envoyée !" : sendingRoadsheet ? "Envoi..." : "Envoyer feuille de route à l'artiste"}
            </button>
            <AdvancingReview bookingId={booking.id} />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm text-white ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function Tag({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${active ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-600"}`}>
      {active ? "✓" : "–"} {label}
    </span>
  );
}

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block w-4 h-4 rounded text-center text-[10px] leading-4 ${checked ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-600"}`}>
        {checked ? "✓" : "–"}
      </span>
      <span className={`text-sm ${checked ? "text-gray-300" : "text-gray-600"}`}>{label}</span>
    </div>
  );
}
