"use client";

import { useEffect, useState } from "react";
import type { Booking } from "./types";
import { api } from "@/lib/api-client";
import AdvancingReview from "./AdvancingReview";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
};

export default function BookingDetail({
  bookingId,
  onClose,
  onEdit,
  role,
}: {
  bookingId: string;
  onClose: () => void;
  onEdit?: (b: Booking) => void;
  role?: "artist" | "booker";
}) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    api.get<Booking>(`/api/bookings/${bookingId}`)
      .then(setBooking)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [bookingId]);

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
            <span className="text-lg font-semibold font-mono text-white">{booking.fee.toLocaleString("fr-FR")} €</span>
          </div>

          {/* Event info */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Événement</h3>
            <div className="rounded-xl bg-gray-800/50 border border-gray-800 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium capitalize">{dateStr}</p>
                </div>
                {booking.time && (
                  <div>
                    <p className="text-xs text-gray-500">Heure</p>
                    <p className="text-sm font-medium">{booking.time}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Salle</p>
                <p className="text-sm font-medium">{booking.venue}</p>
              </div>
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
                    {booking.promoterRel.headquarters && (
                      <p className="text-xs text-gray-400">Siège : {booking.promoterRel.headquarters}</p>
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
                <div className="flex gap-4 pt-1">
                  <Tag active={booking.hotel.breakfast} label="Petit-déjeuner" />
                  <Tag active={booking.hotel.lateCheckout} label="Late checkout" />
                </div>
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
