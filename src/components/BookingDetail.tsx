"use client";

import { useEffect, useState } from "react";
import type { Booking } from "./types";
import { api } from "@/lib/api-client";
import AdvancingReview from "./AdvancingReview";

const statusColors: Record<string, string> = {
  proposal: "bg-blue-500/20 text-blue-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
  declined: "bg-red-500/20 text-red-400",
};

const statusLabels: Record<string, string> = {
  proposal: "Proposition",
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  declined: "Refusée",
};

const formatLabels: Record<string, string> = {
  djset: "DJ Set",
  live: "Live",
};

export default function BookingDetail({
  bookingId,
  onClose,
  onEdit,
  onBookingChanged,
  role,
}: {
  bookingId: string;
  onClose: () => void;
  onEdit?: (b: Booking) => void;
  onBookingChanged?: () => void;
  role?: "artist" | "booker";
}) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [validating, setValidating] = useState(false);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    api.get<Booking>(`/api/bookings/${bookingId}`)
      .then(setBooking)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [bookingId]);

  async function handleValidate() {
    if (!booking) return;
    setValidating(true);
    try {
      const updated = await api.post<Booking>(`/api/bookings/${booking.id}/validate`);
      setBooking(updated);
      onBookingChanged?.();
    } catch (err) {
      console.error("Failed to validate proposal:", err);
    } finally {
      setValidating(false);
    }
  }

  async function handleDecline() {
    if (!booking || !confirm("Refuser cette proposition ?")) return;
    setDeclining(true);
    try {
      const updated = await api.post<Booking>(`/api/bookings/${booking.id}/decline`);
      setBooking(updated);
      onBookingChanged?.();
    } catch (err) {
      console.error("Failed to decline proposal:", err);
    } finally {
      setDeclining(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-60 flex justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-full max-w-md bg-gray-900 border-l border-gray-800 h-full flex items-center justify-center animate-slide-in">
          <div className="text-gray-400">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="fixed inset-0 z-60 flex justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-full max-w-md bg-gray-900 border-l border-gray-800 h-full flex items-center justify-center animate-slide-in">
          <div className="text-red-400">Erreur lors du chargement</div>
        </div>
      </div>
    );
  }

  const dateStr = new Date(booking.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-60 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-900 border-l border-gray-800 h-full overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-lg font-bold truncate">{booking.venue}</h2>
          <div className="flex items-center gap-2">
            {onEdit && (
            <button
              onClick={() => onEdit(booking)}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              Modifier
            </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors text-xl ml-2"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status + Fee highlight */}
          <div className="flex items-center justify-between">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status] || ""}`}>
              {statusLabels[booking.status] || booking.status}
            </span>
            <span className="text-lg font-semibold font-mono text-white">
              {booking.fee.toLocaleString("fr-FR")} €
              {booking.allInclusive && <span className="ml-2 text-xs font-medium text-emerald-400">(All Inclusive)</span>}
            </span>
          </div>

          {/* Proposal actions */}
          {booking.status === "proposal" && role === "booker" && (
            <div className="flex gap-3">
              <button
                onClick={handleValidate}
                disabled={validating}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {validating ? "Validation..." : "Valider la proposition"}
              </button>
              <button
                onClick={handleDecline}
                disabled={declining}
                className="flex-1 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 font-medium px-4 py-2 rounded-lg text-sm transition-colors border border-red-600/30"
              >
                {declining ? "Refus..." : "Refuser"}
              </button>
            </div>
          )}

          {/* Event info */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Événement</h3>
            <div className="rounded-xl bg-gray-800/50 border border-gray-800 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium capitalize">{dateStr}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Salle</p>
                <p className="text-sm font-medium">{booking.venue}</p>
              </div>
              {booking.venueAddress && (
                <div>
                  <p className="text-xs text-gray-500">Adresse</p>
                  <p className="text-sm text-gray-300">{booking.venueAddress}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Ville</p>
                  <p className="text-sm text-gray-300">{booking.city}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pays</p>
                  <p className="text-sm text-gray-300">{booking.country}</p>
                </div>
              </div>
              {booking.venueWebsite && (
                <div>
                  <p className="text-xs text-gray-500">Site web</p>
                  <a href={booking.venueWebsite} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline truncate block">{booking.venueWebsite}</a>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Promoteur</p>
                <p className="text-sm text-gray-300">{booking.promoter}</p>
                {booking.promoterRel && (
                  <div className="mt-2 space-y-1 pl-2 border-l-2 border-gray-700">
                    {booking.promoterRel.company && (
                      <p className="text-xs text-gray-400">Société : {booking.promoterRel.company}</p>
                    )}
                    {booking.promoterRel.email && (
                      <p className="text-xs text-gray-400">Email : {booking.promoterRel.email}</p>
                    )}
                    {booking.promoterRel.phone && (
                      <p className="text-xs text-gray-400">Tél : {booking.promoterRel.phone}</p>
                    )}
                    {booking.promoterRel.address1 && (
                      <p className="text-xs text-gray-400">Adresse : {booking.promoterRel.address1}</p>
                    )}
                    {booking.promoterRel.vatNumber && (
                      <p className="text-xs text-gray-400">TVA : {booking.promoterRel.vatNumber}</p>
                    )}
                    {booking.promoterRel.siret && (
                      <p className="text-xs text-gray-400">SIRET : {booking.promoterRel.siret}</p>
                    )}
                    {booking.promoterRel.signatory && (
                      <p className="text-xs text-gray-400">
                        Signataire : {booking.promoterRel.signatory}
                        {booking.promoterRel.signatoryRole && ` (${booking.promoterRel.signatoryRole})`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Proposal details */}
          {(booking.status === "proposal" || booking.status === "declined") && (
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Détails de la proposition</h3>
              <div className="rounded-xl bg-gray-800/50 border border-gray-800 p-4 space-y-3">
                {booking.format && (
                  <div>
                    <p className="text-xs text-gray-500">Format</p>
                    <p className="text-sm font-medium">{formatLabels[booking.format] || booking.format}</p>
                  </div>
                )}
                {booking.setDuration && (
                  <div>
                    <p className="text-xs text-gray-500">Durée du set</p>
                    <p className="text-sm text-gray-300">{booking.setDuration} mins</p>
                  </div>
                )}
                {booking.lineup && (
                  <div>
                    <p className="text-xs text-gray-500">Programme</p>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{booking.lineup}</p>
                  </div>
                )}
                {booking.ticketPrice && (
                  <div>
                    <p className="text-xs text-gray-500">Prix d&apos;entrée</p>
                    <p className="text-sm text-gray-300">{booking.ticketPrice}</p>
                  </div>
                )}
                {booking.announcementDate && (
                  <div>
                    <p className="text-xs text-gray-500">Date d&apos;annonce</p>
                    <p className="text-sm text-gray-300">
                      {new Date(booking.announcementDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  </div>
                )}
                {booking.numberOfInvitations != null && (
                  <div>
                    <p className="text-xs text-gray-500">Invitations</p>
                    <p className="text-sm text-gray-300">{booking.numberOfInvitations} pax</p>
                  </div>
                )}
                {booking.exclusivity && (
                  <div>
                    <p className="text-xs text-gray-500">Exclusivité</p>
                    <p className="text-sm text-gray-300">{booking.exclusivity}</p>
                  </div>
                )}
                {booking.commissionPercent != null && (
                  <div>
                    <p className="text-xs text-gray-500">Commission</p>
                    <p className="text-sm text-gray-300">{booking.commissionPercent}%</p>
                  </div>
                )}
                {booking.paymentTerms && (
                  <div>
                    <p className="text-xs text-gray-500">Conditions de paiement</p>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{booking.paymentTerms}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Contract */}
          {booking.contractFileUrl && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contrat</h3>
              <div className="rounded-xl bg-gray-800/50 border border-gray-800 p-4">
                <a href={booking.contractFileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                  Voir le contrat
                </a>
              </div>
            </section>
          )}

          {/* Checklist */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Checklist</h3>
            <div className="rounded-xl bg-gray-800/50 border border-gray-800 p-4 space-y-2">
              <CheckItem label="Contrat signé" checked={booking.contractSigned} />
              <CheckItem label="Fees agence payés" checked={booking.agencyFeesPaid} />
              <CheckItem label="Fees artiste payés" checked={booking.artistFeesPaid} />
            </div>
          </section>

          {/* Logement */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Logement</h3>
            {booking.hotel?.booked ? (
              <div className="rounded-xl bg-gray-800/50 border border-gray-800 p-4 space-y-3">
                {booking.hotel.name && (
                  <div>
                    <p className="text-xs text-gray-500">Hôtel</p>
                    <p className="text-sm font-medium">{booking.hotel.name}</p>
                  </div>
                )}
                {booking.hotel.address && (
                  <div>
                    <p className="text-xs text-gray-500">Adresse</p>
                    <p className="text-sm text-gray-300">{booking.hotel.address}</p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.hotel.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors mt-1 inline-block"
                    >
                      Voir sur Google Maps
                    </a>
                  </div>
                )}
                {booking.hotel.bookingNumber && (
                  <div>
                    <p className="text-xs text-gray-500">N° de réservation</p>
                    <p className="text-sm font-mono text-gray-300">{booking.hotel.bookingNumber}</p>
                  </div>
                )}
                {booking.hotel.checkIn && (
                  <div>
                    <p className="text-xs text-gray-500">Check-in</p>
                    <p className="text-sm text-gray-300">
                      {new Date(booking.hotel.checkIn).toLocaleString("fr-FR", {
                        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                )}
                <div className="flex gap-4 pt-1">
                  <Tag active={booking.hotel.breakfast} label="Petit-déjeuner" />
                  <Tag active={booking.hotel.lateCheckout} label="Late checkout" />
                </div>
                {booking.hotel.notes && (
                  <div>
                    <p className="text-xs text-gray-500">Informations supplémentaires</p>
                    <p className="text-sm text-gray-400 whitespace-pre-wrap">{booking.hotel.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600 italic">Aucun logement réservé</p>
            )}
          </section>

          {/* Transport */}
          {["outbound", "return"].map((type) => {
            const transport = booking.transports?.find(t => t.type === type);
            const label = type === "outbound" ? "Transport aller" : "Transport retour";
            return (
              <section key={type} className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</h3>
                {transport?.booked ? (
                  <div className="space-y-2">
                    {transport.legs.map((leg, i) => (
                      <div key={leg.id || i} className="rounded-xl bg-gray-800/50 border border-gray-800 p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          {leg.mode && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 capitalize">
                              {leg.mode === "plane" ? "Avion" : leg.mode === "train" ? "Train" : leg.mode === "bus" ? "Bus" : leg.mode === "car" ? "Voiture" : leg.mode === "taxi" ? "Taxi/VTC" : leg.mode === "ferry" ? "Ferry" : leg.mode}
                            </span>
                          )}
                          {leg.carrier && <span className="text-xs text-gray-400">{leg.carrier}</span>}
                        </div>
                        {(leg.departureLocation || leg.arrivalLocation) && (
                          <p className="text-sm text-gray-300">
                            {leg.departureLocation || "?"} → {leg.arrivalLocation || "?"}
                          </p>
                        )}
                        {(leg.departureTime || leg.arrivalTime) && (
                          <p className="text-xs text-gray-400">
                            {leg.departureTime && new Date(leg.departureTime).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                            {leg.departureTime && leg.arrivalTime && " → "}
                            {leg.arrivalTime && new Date(leg.arrivalTime).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                          </p>
                        )}
                        {leg.bookingReference && (
                          <div>
                            <p className="text-xs text-gray-500">N° réservation</p>
                            <p className="text-sm font-mono text-gray-300">{leg.bookingReference}</p>
                          </div>
                        )}
                        {leg.ticketFileName && leg.id && (
                          <div>
                            <p className="text-xs text-gray-500">Billet</p>
                            <button
                              onClick={() => api.downloadFile(`/api/transport-legs/${leg.id}/ticket`, leg.ticketOriginalName || "ticket")}
                              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              {leg.ticketOriginalName || "Télécharger"}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 italic">Aucun transport réservé</p>
                )}
              </section>
            );
          })}

          {/* Notes */}
          {booking.notes && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</h3>
              <div className="rounded-xl bg-gray-800/50 border border-gray-800 p-4">
                <p className="text-sm text-gray-400 whitespace-pre-wrap">{booking.notes}</p>
              </div>
            </section>
          )}

          {/* Advancing (booker only) */}
          {role === "booker" && (
            <section className="space-y-2">
              <AdvancingReview bookingId={booking.id} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Tag({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${
        active
          ? "bg-green-500/20 text-green-400"
          : "bg-gray-800 text-gray-600"
      }`}
    >
      {active ? "✓" : "–"} {label}
    </span>
  );
}

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block w-4 h-4 rounded text-center text-[10px] leading-4 ${
          checked ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-600"
        }`}
      >
        {checked ? "✓" : "–"}
      </span>
      <span className={`text-sm ${checked ? "text-gray-300" : "text-gray-600"}`}>{label}</span>
    </div>
  );
}
