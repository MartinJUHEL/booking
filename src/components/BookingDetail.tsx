"use client";

import type { Booking } from "./types";
import { api } from "@/lib/api-client";

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
  booking,
  onClose,
  onEdit,
}: {
  booking: Booking;
  onClose: () => void;
  onEdit: (b: Booking) => void;
}) {
  const dateStr = new Date(booking.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-900 border-l border-gray-800 h-full overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h2 className="text-lg font-bold truncate">{booking.venue}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(booking)}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              Modifier
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors text-xl ml-2"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Event info */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Evenement</h3>
            <div className="space-y-1">
              <p className="text-sm capitalize">{dateStr}</p>
              {booking.time && <p className="text-sm text-gray-400">{booking.time}</p>}
              <p className="text-sm text-gray-300">{booking.city}, {booking.country}</p>
              <p className="text-sm text-gray-400">{booking.promoter}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status] || ""}`}>
                  {statusLabels[booking.status] || booking.status}
                </span>
                <span className="text-sm font-mono text-gray-300">{booking.fee.toLocaleString("fr-FR")} €</span>
              </div>
            </div>
          </section>

          {/* Logement */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Logement</h3>
            {booking.hotel?.booked ? (
              <div className="rounded-xl bg-gray-800/50 border border-gray-800 p-4 space-y-3">
                {booking.hotel.name && (
                  <div>
                    <p className="text-xs text-gray-500">Hotel</p>
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

          {/* Checklist */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Checklist</h3>
            <div className="space-y-1">
              <CheckItem label="Contrat signé" checked={booking.contractSigned} />
              <CheckItem label="Fees agence payés" checked={booking.agencyFeesPaid} />
              <CheckItem label="Fees artiste payés" checked={booking.artistFeesPaid} />
            </div>
          </section>

          {/* Notes */}
          {booking.notes && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</h3>
              <p className="text-sm text-gray-400 whitespace-pre-wrap">{booking.notes}</p>
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
