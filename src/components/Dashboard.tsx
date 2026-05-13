"use client";

import { useState, useMemo } from "react";
import BookingTable from "./BookingTable";
import BookingDetail from "./BookingDetail";
import CalendarView from "./CalendarView";
import type { BookingListItem } from "./types";

type ViewMode = "table" | "calendar";

export default function Dashboard({
  initialBookings,
}: {
  initialBookings: BookingListItem[];
}) {
  const [bookings] = useState<BookingListItem[]>(initialBookings);
  const [view, setView] = useState<ViewMode>("table");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchesText =
        !filter ||
        [b.venue, b.city, b.country, b.promoter]
          .join(" ")
          .toLowerCase()
          .includes(filter.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || b.status === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [bookings, filter, statusFilter]);

  const stats = useMemo(() => {
    const upcoming = bookings.filter(
      (b) => new Date(b.date) >= new Date() && b.status !== "cancelled"
    );
    const totalFees = upcoming.reduce((sum, b) => sum + b.fee, 0);
    const unsigned = upcoming.filter((b) => !b.contractSigned).length;
    const unpaidArtist = upcoming.filter((b) => !b.artistFeesPaid).length;
    return { upcoming: upcoming.length, totalFees, unsigned, unpaidArtist };
  }, [bookings]);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Dates à venir" value={stats.upcoming} />
        <StatCard
          label="Fees total"
          value={`${stats.totalFees.toLocaleString("fr-FR")} €`}
        />
        <StatCard
          label="Contrats non signés"
          value={stats.unsigned}
          alert={stats.unsigned > 0}
        />
        <StatCard
          label="Fees artiste impayés"
          value={stats.unpaidArtist}
          alert={stats.unpaidArtist > 0}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm flex-1 focus:outline-none focus:border-purple-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmé</option>
          <option value="cancelled">Annulé</option>
        </select>
        <div className="flex gap-2">
          <button
            onClick={() => setView("table")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "table"
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Liste
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "calendar"
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Calendrier
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "table" ? (
        <BookingTable
          bookings={filtered}
          onSelect={(b) => setSelectedBookingId(b.id)}
          readOnly
        />
      ) : (
        <CalendarView bookings={filtered} onSelect={(b) => setSelectedBookingId(b.id)} />
      )}

      {/* Booking Detail Panel (read-only) */}
      {selectedBookingId && (
        <BookingDetail
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          role="artist"
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  alert,
}: {
  label: string;
  value: string | number;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        alert
          ? "border-red-500/30 bg-red-500/5"
          : "border-gray-800 bg-gray-900/50"
      }`}
    >
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div
        className={`text-2xl font-bold ${alert ? "text-red-400" : "text-white"}`}
      >
        {value}
      </div>
    </div>
  );
}
