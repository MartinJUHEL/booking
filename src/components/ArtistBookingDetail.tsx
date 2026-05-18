"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { ArtistBooking, Transport, TransportLeg } from "./types";

interface TimetableSlot {
  artist: string;
  startTime: string;
  endTime: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timeStr: string | null) {
  if (!timeStr) return null;
  // Handle both "HH:mm" and ISO datetime
  if (timeStr.includes("T")) {
    return new Date(timeStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return timeStr;
}

function formatDateTime(value: string | null) {
  if (!value) return null;
  if (value.includes("T")) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString("fr-FR", { weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }
  }
  return value;
}

const MODE_ICONS: Record<string, string> = {
  plane: "✈️",
  train: "🚆",
  bus: "🚌",
  car: "🚗",
  taxi: "🚕",
  ferry: "⛴️",
  other: "🚐",
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
    proposal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    cancelled: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    declined: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const labels: Record<string, string> = {
    confirmed: "Confirmé",
    proposal: "Proposition",
    cancelled: "Annulé",
    declined: "Refusée",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status] || "bg-gray-700 text-gray-300"}`}>
      {labels[status] || status}
    </span>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 print:border-gray-300 print:bg-white">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 print:text-black">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function TransportTimeline({ transport }: { transport: Transport }) {
  if (!transport.legs || transport.legs.length === 0) return null;
  const sortedLegs = [...transport.legs].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      {sortedLegs.map((leg, i) => (
        <TransportLegCard key={leg.id || i} leg={leg} />
      ))}
    </div>
  );
}

function TransportLegCard({ leg }: { leg: TransportLeg }) {
  const icon = MODE_ICONS[leg.mode || "other"] || "🚐";
  return (
    <div className="flex gap-3 items-start">
      <span className="text-xl mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm text-white font-medium">
          {formatTime(leg.departureTime) && (
            <span>{formatTime(leg.departureTime)}</span>
          )}
          {leg.departureLocation && <span className="text-gray-400">{leg.departureLocation}</span>}
          <span className="text-gray-600">→</span>
          {formatTime(leg.arrivalTime) && (
            <span>{formatTime(leg.arrivalTime)}</span>
          )}
          {leg.arrivalLocation && <span className="text-gray-400">{leg.arrivalLocation}</span>}
        </div>
        <div className="text-xs text-gray-500 mt-1 space-x-3">
          {leg.carrier && <span>{leg.carrier}</span>}
          {leg.bookingReference && <span>Réf: {leg.bookingReference}</span>}
        </div>
        {leg.notes && <p className="text-xs text-gray-500 mt-1 italic">{leg.notes}</p>}
        {leg.ticketFileName && (
          <button
            onClick={() => api.downloadFile(`/api/transport-legs/${leg.id}/ticket`, leg.ticketOriginalName || "ticket")}
            className="text-xs text-purple-400 hover:text-purple-300 mt-1 inline-flex items-center gap-1"
          >
            📎 Télécharger billet
          </button>
        )}
      </div>
    </div>
  );
}

export default function ArtistBookingDetail({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<ArtistBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    api.get<ArtistBooking>(`/api/bookings/${bookingId}`).then((data) => {
      setBooking(data);
      setLoading(false);
    }).catch(() => {
      router.push("/");
    });
  }, [bookingId, user, router]);

  const handleSendRoadsheet = async () => {
    setSending(true);
    try {
      await api.post(`/api/bookings/${bookingId}/send-roadsheet`, {});
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch {
      alert("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  if (loading || !booking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    );
  }

  const outbound = booking.transports.find((t) => t.type === "outbound" && t.booked);
  const returnTransport = booking.transports.find((t) => t.type === "return" && t.booked);
  const timetable: TimetableSlot[] = booking.timetable ? JSON.parse(booking.timetable) : [];
  const hasContacts = booking.tourManager || booking.technician || booking.artistHandler || booking.stageManager;
  const hasDinner = booking.restaurant || booking.dinnerPickUpTime || booking.dinnerMeetingPoint || booking.dinnerDriver;
  const hasTimeline = booking.doorsOpen || booking.doorsClose || booking.soundcheckRequired || timetable.length > 0;
  const hasArrival = booking.arrivalTime || booking.arrivalLocation || booking.arrivalMeetingPoint || booking.arrivalDriver || booking.arrivalDuration;
  const hasShowTransfers = booking.transferToVenuePickup || booking.transferToVenueMeetingPoint || booking.transferToVenueDriver || booking.transferToVenueDuration || booking.transferToHotelPickup || booking.transferToHotelMeetingPoint || booking.transferToHotelDriver;
  const hasDeparture = booking.departurePickup || booking.departureMeetingPoint || booking.departureDriver || booking.departureLocation;

  return (
    <div className="min-h-screen bg-black text-white print:bg-white print:text-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800 print:static print:bg-white print:border-gray-300">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-1 print:hidden"
          >
            ← Retour
          </button>
          <div className="flex items-center gap-3">
            <StatusBadge status={booking.status} />
            <button
              onClick={handleSendRoadsheet}
              disabled={sending}
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed print:hidden"
            >
              {sent ? "Envoyé !" : sending ? "Envoi..." : "Envoyer par email"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Hero / Summary */}
        <Section title={booking.eventName || booking.venue} icon="📍">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Date</span>
              <p className="text-white font-medium capitalize">{formatDate(booking.date)}</p>
            </div>
            <div>
              <span className="text-gray-400">Venue</span>
              <p className="text-white font-medium">{booking.venue}</p>
              {booking.venueAddress && <p className="text-gray-500 text-xs">{booking.venueAddress}</p>}
              {booking.venueWebsite && (
                <a href={booking.venueWebsite} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-xs hover:underline">
                  Site web
                </a>
              )}
            </div>
            <div>
              <span className="text-gray-400">Ville</span>
              <p className="text-white font-medium">{booking.city}, {booking.country}</p>
            </div>
            <div>
              <span className="text-gray-400">Promoteur</span>
              <p className="text-white font-medium">{booking.promoter}</p>
            </div>
            <div>
              <span className="text-gray-400">Cachet</span>
              <p className="text-white font-medium">
                {booking.fee.toLocaleString("fr-FR")} €
                {booking.allInclusive && <span className="ml-2 text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">All Inclusive</span>}
              </p>
            </div>
            {booking.format && (
              <div>
                <span className="text-gray-400">Format</span>
                <p className="text-white font-medium">{booking.format === "djset" ? "DJ Set" : "Live"}{booking.setDuration ? ` — ${booking.setDuration} min` : ""}</p>
              </div>
            )}
          </div>
        </Section>

        {/* Transport Aller */}
        {outbound && (
          <Section title="Transport Aller" icon="🛫">
            <TransportTimeline transport={outbound} />
          </Section>
        )}

        {/* Arrival */}
        {hasArrival && (
          <Section title="Arrivée" icon="📍">
            <div className="space-y-2 text-sm">
              {booking.arrivalTime && (
                <div>
                  <span className="text-gray-400">Heure d&apos;arrivée:</span>
                  <span className="text-white ml-2">{formatDateTime(booking.arrivalTime)}</span>
                </div>
              )}
              {booking.arrivalLocation && (
                <div>
                  <span className="text-gray-400">Lieu d&apos;arrivée:</span>
                  <span className="text-white ml-2">{booking.arrivalLocation}</span>
                </div>
              )}
              {booking.arrivalMeetingPoint && (
                <div>
                  <span className="text-gray-400">Point de rencontre:</span>
                  <span className="text-white ml-2">{booking.arrivalMeetingPoint}</span>
                </div>
              )}
              {booking.arrivalDriver && (
                <div>
                  <span className="text-gray-400">Driver:</span>
                  <span className="text-white ml-2">{booking.arrivalDriver}</span>
                </div>
              )}
              {booking.arrivalDuration && (
                <div>
                  <span className="text-gray-400">Durée:</span>
                  <span className="text-white ml-2">{booking.arrivalDuration}</span>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Hotel */}
        {booking.hotel.booked && (
          <Section title="Hôtel" icon="🏨">
            <div className="space-y-2 text-sm">
              {booking.hotel.name && <p className="text-white font-medium text-base">{booking.hotel.name}</p>}
              {booking.hotel.address && (
                <div>
                  <p className="text-gray-400">{booking.hotel.address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.hotel.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 text-xs hover:underline"
                  >
                    📍 Voir sur Google Maps
                  </a>
                </div>
              )}
              {booking.hotel.checkIn && (
                <div className="flex gap-4">
                  <span className="text-gray-400">Check-in:</span>
                  <span className="text-white">{new Date(booking.hotel.checkIn).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              )}
              {booking.hotel.bookingNumber && (
                <div className="flex gap-4">
                  <span className="text-gray-400">Réservation:</span>
                  <span className="text-white font-mono">#{booking.hotel.bookingNumber}</span>
                </div>
              )}
              <div className="flex gap-3 mt-2">
                {booking.hotel.breakfast && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">☑ Petit-déjeuner</span>
                )}
                {booking.hotel.lateCheckout && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">☑ Late checkout</span>
                )}
              </div>
              {booking.hotel.notes && <p className="text-gray-500 italic mt-2">{booking.hotel.notes}</p>}
            </div>
          </Section>
        )}

        {/* Dinner */}
        {hasDinner && (
          <Section title="Dîner" icon="🍽️">
            <div className="space-y-2 text-sm">
              {booking.restaurant && (
                <div>
                  <span className="text-gray-400">Restaurant:</span>
                  <span className="text-white ml-2 font-medium">{booking.restaurant}</span>
                </div>
              )}
              {booking.dinnerPickUpTime && (
                <div>
                  <span className="text-gray-400">Heure:</span>
                  <span className="text-white ml-2">{formatDateTime(booking.dinnerPickUpTime)}</span>
                </div>
              )}
              {booking.dinnerMeetingPoint && (
                <div>
                  <span className="text-gray-400">Point de rencontre:</span>
                  <span className="text-white ml-2">{booking.dinnerMeetingPoint}</span>
                </div>
              )}
              {booking.dinnerDriver && (
                <div>
                  <span className="text-gray-400">Driver:</span>
                  <span className="text-white ml-2">{booking.dinnerDriver}</span>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Show Transfers */}
        {hasShowTransfers && (
          <Section title="Transferts" icon="🚗">
            <div className="space-y-4 text-sm">
              {/* Hotel → Venue */}
              {(booking.transferToVenuePickup || booking.transferToVenueMeetingPoint || booking.transferToVenueDriver || booking.transferToVenueDuration) && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Hôtel → Venue</h3>
                  <div className="space-y-1">
                    {booking.transferToVenuePickup && (
                      <div>
                        <span className="text-gray-400">Départ:</span>
                        <span className="text-white ml-2">{formatDateTime(booking.transferToVenuePickup)}</span>
                      </div>
                    )}
                    {booking.transferToVenueMeetingPoint && (
                      <div>
                        <span className="text-gray-400">Point de rencontre:</span>
                        <span className="text-white ml-2">{booking.transferToVenueMeetingPoint}</span>
                      </div>
                    )}
                    {booking.transferToVenueDriver && (
                      <div>
                        <span className="text-gray-400">Driver:</span>
                        <span className="text-white ml-2">{booking.transferToVenueDriver}</span>
                      </div>
                    )}
                    {booking.transferToVenueDuration && (
                      <div>
                        <span className="text-gray-400">Durée:</span>
                        <span className="text-white ml-2">{booking.transferToVenueDuration}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Venue → Hotel */}
              {(booking.transferToHotelPickup || booking.transferToHotelMeetingPoint || booking.transferToHotelDriver) && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Venue → Hôtel</h3>
                  <div className="space-y-1">
                    {booking.transferToHotelPickup && (
                      <div>
                        <span className="text-gray-400">Départ:</span>
                        <span className="text-white ml-2">{formatDateTime(booking.transferToHotelPickup)}</span>
                      </div>
                    )}
                    {booking.transferToHotelMeetingPoint && (
                      <div>
                        <span className="text-gray-400">Point de rencontre:</span>
                        <span className="text-white ml-2">{booking.transferToHotelMeetingPoint}</span>
                      </div>
                    )}
                    {booking.transferToHotelDriver && (
                      <div>
                        <span className="text-gray-400">Driver:</span>
                        <span className="text-white ml-2">{booking.transferToHotelDriver}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Feuille de Route / Timeline */}
        {hasTimeline && (
          <Section title="Feuille de route" icon="📋">
            <div className="space-y-4">
              {/* Timetable */}
              {timetable.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Running Order</h3>
                  <div className="space-y-1">
                    {timetable.map((slot, i) => {
                      const isMe = user?.artistName && slot.artist.toLowerCase().includes(user.artistName.toLowerCase());
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 text-sm py-1.5 px-3 rounded ${
                            isMe ? "bg-purple-500/20 border border-purple-500/30" : ""
                          }`}
                        >
                          <span className="text-gray-400 font-mono w-28">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span className={`font-medium ${isMe ? "text-purple-300" : "text-white"}`}>
                            {slot.artist} {isMe && "←"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Key times */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Horaires clés</h3>
                <div className="space-y-1 text-sm">
                  {booking.soundcheckRequired === "Yes" && (
                    <div className="flex gap-3">
                      <span className="text-gray-400 font-mono w-28">Soundcheck</span>
                      <span className="text-white">Oui</span>
                    </div>
                  )}
                  {booking.doorsOpen && (
                    <div className="flex gap-3">
                      <span className="text-gray-400 font-mono w-28">{booking.doorsOpen}</span>
                      <span className="text-white">Doors open</span>
                    </div>
                  )}
                  {booking.doorsClose && (
                    <div className="flex gap-3">
                      <span className="text-gray-400 font-mono w-28">{booking.doorsClose}</span>
                      <span className="text-white">Doors close</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Venue info */}
              {(booking.capacity || booking.ageRestrictions || booking.stageFloor) && (
                <div className="border-t border-gray-800 pt-3 text-sm space-y-1">
                  {booking.capacity && (
                    <div className="text-gray-400">Capacité: <span className="text-white">{booking.capacity} pers.</span></div>
                  )}
                  {booking.ageRestrictions && (
                    <div className="text-gray-400">Restrictions: <span className="text-white">{booking.ageRestrictions}</span></div>
                  )}
                  {booking.stageFloor && (
                    <div className="text-gray-400">Stage / Floor: <span className="text-white">{booking.stageFloor}</span></div>
                  )}
                </div>
              )}

              {booking.furtherDetails && (
                <div className="border-t border-gray-800 pt-3">
                  <p className="text-sm text-gray-400 italic">{booking.furtherDetails}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Contacts */}
        {hasContacts && (
          <Section title="Contacts sur place" icon="👥">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {booking.tourManager && (
                <div>
                  <span className="text-gray-400">Tour Manager</span>
                  <p className="text-white">{booking.tourManager}</p>
                </div>
              )}
              {booking.technician && (
                <div>
                  <span className="text-gray-400">Technicien</span>
                  <p className="text-white">{booking.technician}</p>
                </div>
              )}
              {booking.artistHandler && (
                <div>
                  <span className="text-gray-400">Artist Handler</span>
                  <p className="text-white">{booking.artistHandler}</p>
                </div>
              )}
              {booking.stageManager && (
                <div>
                  <span className="text-gray-400">Stage Manager</span>
                  <p className="text-white">{booking.stageManager}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Departure */}
        {hasDeparture && (
          <Section title="Départ" icon="🚪">
            <div className="space-y-2 text-sm">
              {booking.departurePickup && (
                <div>
                  <span className="text-gray-400">Heure de départ:</span>
                  <span className="text-white ml-2">{formatDateTime(booking.departurePickup)}</span>
                </div>
              )}
              {booking.departureMeetingPoint && (
                <div>
                  <span className="text-gray-400">Point de rencontre:</span>
                  <span className="text-white ml-2">{booking.departureMeetingPoint}</span>
                </div>
              )}
              {booking.departureDriver && (
                <div>
                  <span className="text-gray-400">Driver:</span>
                  <span className="text-white ml-2">{booking.departureDriver}</span>
                </div>
              )}
              {booking.departureLocation && (
                <div>
                  <span className="text-gray-400">Lieu de départ:</span>
                  <span className="text-white ml-2">{booking.departureLocation}</span>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Transport Retour */}
        {returnTransport && (
          <Section title="Transport Retour" icon="🛬">
            <TransportTimeline transport={returnTransport} />
          </Section>
        )}

        {/* Notes */}
        {booking.notes && (
          <Section title="Notes" icon="📝">
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{booking.notes}</p>
          </Section>
        )}
      </div>
    </div>
  );
}
