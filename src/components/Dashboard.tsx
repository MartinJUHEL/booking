"use client";

import { useState, useMemo } from "react";
import BookingTable from "./BookingTable";
import BookingForm from "./BookingForm";
import BookingDetail from "./BookingDetail";
import CalendarView from "./CalendarView";
import PromoterList from "./PromoterList";
import PromoterForm from "./PromoterForm";
import type { Booking, BookingListItem, Promoter } from "./types";
import { api } from "@/lib/api-client";

type ViewMode = "table" | "calendar" | "promoters";

interface PromoterWithCount extends Promoter {
  _count?: { bookings: number };
}

export default function Dashboard({
  initialBookings,
  initialPromoters,
  role = "artist",
  artistId,
}: {
  initialBookings: BookingListItem[];
  initialPromoters: PromoterWithCount[];
  role?: "artist" | "booker";
  artistId?: string;
}) {
  const [bookings, setBookings] = useState<BookingListItem[]>(initialBookings);
  const [promoters, setPromoters] = useState<PromoterWithCount[]>(initialPromoters);
  const [view, setView] = useState<ViewMode>("table");
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [showPromoterForm, setShowPromoterForm] = useState(false);
  const [editingPromoter, setEditingPromoter] = useState<Promoter | null>(null);
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

  async function handleSave(data: Partial<Booking>) {
    if (editingBooking) {
      const updated = await api.put<Booking>(`/api/bookings/${editingBooking.id}`, data);
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
      );
      // Refresh detail panel if open
      if (selectedBookingId === updated.id) {
        setSelectedBookingId(null);
        setTimeout(() => setSelectedBookingId(updated.id), 0);
      }
    } else {
      const payload = artistId ? { ...data, artistId } : data;
      const created = await api.post<BookingListItem>("/api/bookings", payload);
      setBookings((prev) => [...prev, created].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
    }
    setShowForm(false);
    setEditingBooking(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette date ?")) return;
    await api.delete(`/api/bookings/${id}`);
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }

  async function handleToggleField(id: string, field: "agencyFeesPaid" | "artistFeesPaid", value: boolean) {
    try {
      await api.put(`/api/bookings/${id}`, { [field]: value });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
      );
    } catch (err) {
      console.error("Failed to update booking:", err);
    }
  }

  function handleEdit(booking: Booking) {
    setEditingBooking(booking);
    setShowForm(true);
  }

  async function handleEditById(id: string) {
    try {
      const booking = await api.get<Booking>(`/api/bookings/${id}`);
      handleEdit(booking);
    } catch (err) {
      console.error("Failed to load booking for editing:", err);
    }
  }

  // Promoter CRUD
  async function handleSavePromoter(data: Partial<Promoter>) {
    if (editingPromoter) {
      const updated = await api.put<Promoter>(`/api/promoters/${editingPromoter.id}`, data);
      setPromoters((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
    } else {
      const payload = artistId ? { ...data, artistId } : data;
      const created = await api.post<Promoter>("/api/promoters", payload);
      setPromoters((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setShowPromoterForm(false);
    setEditingPromoter(null);
  }

  async function handleDeletePromoter(id: string) {
    if (!confirm("Supprimer ce promoteur ? Les dates associées conserveront le nom du promoteur.")) return;
    await api.delete(`/api/promoters/${id}`);
    setPromoters((prev) => prev.filter((p) => p.id !== id));
  }

  function handleEditPromoter(promoter: Promoter) {
    setEditingPromoter(promoter);
    setShowPromoterForm(true);
  }

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
        {view !== "promoters" && (
          <>
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
          </>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setView("table")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "table"
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Table
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
          <button
            onClick={() => setView("promoters")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "promoters"
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Promoteurs
          </button>
        </div>
        {view === "promoters" ? (
          <button
            onClick={() => {
              setEditingPromoter(null);
              setShowPromoterForm(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
          >
            + Nouveau promoteur
          </button>
        ) : (
          <button
            onClick={() => {
              setEditingBooking(null);
              setShowForm(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
          >
            + Nouvelle date
          </button>
        )}
      </div>

      {/* Content */}
      {view === "table" ? (
        <BookingTable
          bookings={filtered}
          onEdit={handleEditById}
          onDelete={handleDelete}
          onSelect={(b) => setSelectedBookingId(b.id)}
          onToggleField={handleToggleField}
        />
      ) : view === "calendar" ? (
        <CalendarView bookings={filtered} onSelect={(b) => setSelectedBookingId(b.id)} />
      ) : (
        <PromoterList
          promoters={promoters}
          onEdit={handleEditPromoter}
          onDelete={handleDeletePromoter}
        />
      )}

      {/* Booking Modal */}
      {showForm && (
        <BookingForm
          booking={editingBooking}
          promoters={promoters}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingBooking(null);
          }}
          onPromoterCreated={(p) => {
            setPromoters((prev) => [...prev, p].sort((a, b) => a.name.localeCompare(b.name)));
          }}
          artistId={artistId}
        />
      )}

      {/* Promoter Modal */}
      {showPromoterForm && (
        <PromoterForm
          promoter={editingPromoter}
          onSave={handleSavePromoter}
          onClose={() => {
            setShowPromoterForm(false);
            setEditingPromoter(null);
          }}
        />
      )}

      {/* Booking Detail Panel */}
      {selectedBookingId && (
        <BookingDetail
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          onEdit={(b) => {
            setSelectedBookingId(null);
            handleEdit(b);
          }}
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
