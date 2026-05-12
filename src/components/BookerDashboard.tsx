"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import BookingDetail from "./BookingDetail";
import BookingForm from "./BookingForm";
import CalendarView from "./CalendarView";
import PromoterList from "./PromoterList";
import PromoterForm from "./PromoterForm";
import PromoterDetail from "./PromoterDetail";
import type { Booking, DashboardBookingItem, DashboardResponse, Promoter } from "./types";

type ViewMode = "table" | "calendar" | "promoters";

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

interface Artist {
  id: string;
  name: string | null;
  email: string;
  artistName: string | null;
}

interface PromoterWithCount extends Promoter {
  _count?: { bookings: number };
  bookingsCount?: number;
}

function Check({ checked, onClick }: { checked: boolean; onClick?: () => void }) {
  if (onClick) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`inline-block w-5 h-5 rounded text-center text-xs leading-5 transition-colors ${
          checked
            ? "bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400"
            : "bg-gray-800 text-gray-600 hover:bg-green-500/10 hover:text-green-500"
        }`}
        title={checked ? "Marquer comme non payé" : "Marquer comme payé"}
      >
        {checked ? "✓" : "–"}
      </button>
    );
  }
  return (
    <span
      className={`inline-block w-5 h-5 rounded text-center text-xs leading-5 ${
        checked ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-600"
      }`}
    >
      {checked ? "✓" : "–"}
    </span>
  );
}

export default function BookerDashboard({ artists }: { artists: Artist[] }) {
  const [bookings, setBookings] = useState<DashboardBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([year]);
  const [artistFilter, setArtistFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("table");

  // Booking form state
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [createForArtistId, setCreateForArtistId] = useState<string>("");

  // Promoter state
  const [promoters, setPromoters] = useState<PromoterWithCount[]>([]);
  const [promotersLoading, setPromotersLoading] = useState(false);
  const [showPromoterForm, setShowPromoterForm] = useState(false);
  const [editingPromoter, setEditingPromoter] = useState<Promoter | null>(null);
  const [selectedPromoter, setSelectedPromoter] = useState<PromoterWithCount | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("year", String(year));
      if (artistFilter) params.set("artistId", artistFilter);
      if (statusFilter) params.set("status", statusFilter);

      const data = await api.get<DashboardResponse>(
        `/api/dashboard/bookings?${params.toString()}`
      );
      setBookings(data.items);
      setAvailableYears(data.availableYears ?? [year]);
    } catch (err) {
      console.error("Failed to load dashboard bookings:", err);
    } finally {
      setLoading(false);
    }
  }, [year, artistFilter, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Load promoters when switching to promoters view
  const fetchPromoters = useCallback(async () => {
    setPromotersLoading(true);
    try {
      const data = await api.get<PromoterWithCount[]>(`/api/promoters`);
      setPromoters(data.map(p => ({ ...p, _count: { bookings: p.bookingsCount || 0 } })));
    } catch (err) {
      console.error("Failed to load promoters:", err);
    } finally {
      setPromotersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "promoters") {
      fetchPromoters();
    }
  }, [view, fetchPromoters]);

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

  async function handleEdit(booking: Booking) {
    // Load promoters for the booking form
    try {
      const data = await api.get<PromoterWithCount[]>(`/api/promoters`);
      setPromoters(data.map(p => ({ ...p, _count: { bookings: p.bookingsCount || 0 } })));
    } catch (err) {
      console.error("Failed to load promoters:", err);
    }
    setEditingBooking(booking);
    setShowForm(true);
  }

  async function handleSave(data: Partial<Booking>) {
    if (editingBooking) {
      const updated = await api.put<Booking>(`/api/bookings/${editingBooking.id}`, data);
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
      );
      setSelectedBookingId(null);
      setTimeout(() => setSelectedBookingId(updated.id), 0);
    } else {
      // Create new booking for the selected artist
      const artistId = createForArtistId;
      if (!artistId) return;
      const payload = { ...data, artistId };
      const created = await api.post<Booking>("/api/bookings", payload);
      // Refresh bookings list
      fetchBookings();
      setSelectedBookingId(created.id);
    }
    setShowForm(false);
    setEditingBooking(null);
    setCreateForArtistId("");
  }

  // Promoter CRUD
  async function handleSavePromoter(data: Partial<Promoter>) {
    if (editingPromoter) {
      const updated = await api.put<Promoter>(`/api/promoters/${editingPromoter.id}`, data);
      setPromoters((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );
    } else {
      const payload = { ...data };
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

  // Resolve artistId for the booking being edited (from the dashboard item)
  function getArtistIdForBooking(bookingId: string): string | undefined {
    const item = bookings.find(b => b.id === bookingId);
    return item?.artistId;
  }

  return (
    <div>
      {/* Filters + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {view === "promoters" ? (
          <div />
        ) : (
          <>
            <select
              value={artistFilter}
              onChange={(e) => setArtistFilter(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="">Tous les artistes</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.artistName || a.name || a.email}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="">Tous les statuts</option>
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

        <div className="flex-1" />

        {view === "promoters" ? (
          <button
            onClick={() => {
              setEditingPromoter(null);
              setShowPromoterForm(true);
            }}
            disabled={false}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
          >
            + Nouveau promoteur
          </button>
        ) : (
          <>
            {/* Year navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setYear((y) => y - 1)}
                disabled={availableYears.length === 0 || (!availableYears.includes(year - 1) && year - 1 < Math.min(...availableYears))}
                className="px-2 py-1 rounded-lg text-sm bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                &larr;
              </button>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-purple-500"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={() => setYear((y) => y + 1)}
                disabled={availableYears.length === 0 || (!availableYears.includes(year + 1) && year + 1 > Math.max(...availableYears))}
                className="px-2 py-1 rounded-lg text-sm bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                &rarr;
              </button>
            </div>

            <div className="text-sm text-gray-400 self-center">
              {bookings.length} date{bookings.length !== 1 ? "s" : ""}
            </div>

            <button
              onClick={async () => {
                setEditingBooking(null);
                setCreateForArtistId(artists.length === 1 ? artists[0].id : "");
                setShowForm(true);
                try {
                  const data = await api.get<PromoterWithCount[]>(`/api/promoters`);
                  setPromoters(data.map(p => ({ ...p, _count: { bookings: p.bookingsCount || 0 } })));
                } catch (err) {
                  console.error("Failed to load promoters:", err);
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
            >
              + Nouvelle date
            </button>
          </>
        )}
      </div>

      {/* Content */}
      {view === "promoters" ? (
        promotersLoading ? (
          <div className="text-center py-16 text-gray-500">Chargement...</div>
        ) : (
          <PromoterList
            promoters={promoters}
            onEdit={handleEditPromoter}
            onDelete={handleDeletePromoter}
            onSelect={(p) => setSelectedPromoter(p)}
          />
        )
      ) : loading ? (
        <div className="text-center py-16 text-gray-500">Chargement...</div>
      ) : view === "calendar" ? (
        <CalendarView
          bookings={bookings}
          onSelect={(b) => setSelectedBookingId(b.id)}
          renderLabel={(b) => `${b.artistName} - ${b.venue}`}
        />
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">Aucune date en {year}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900/80 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Artiste</th>
                <th className="px-4 py-3 font-medium">Venue</th>
                <th className="px-4 py-3 font-medium">Ville</th>
                <th className="px-4 py-3 font-medium">Promoter</th>
                <th className="px-4 py-3 font-medium text-right">Cachet</th>
                <th className="px-4 py-3 font-medium text-center">Statut</th>
                <th className="px-4 py-3 font-medium text-center">Contrat</th>
                <th className="px-4 py-3 font-medium text-center">Fees Ag.</th>
                <th className="px-4 py-3 font-medium text-center">Fees Art.</th>
                <th className="px-4 py-3 font-medium text-center">Transport</th>
                <th className="px-4 py-3 font-medium text-center">Hotel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {bookings.map((b) => {
                const isPast = new Date(b.date) < new Date();
                return (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBookingId(b.id)}
                    className={`hover:bg-gray-900/50 transition-colors cursor-pointer ${
                      isPast ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium">
                        {new Date(b.date).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      {b.time && (
                        <div className="text-xs text-gray-500">{b.time}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                        {b.artistName}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{b.venue}</td>
                    <td className="px-4 py-3">
                      <span className="text-gray-300">{b.city}</span>
                      <span className="text-gray-600 ml-1">({b.country})</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{b.promoter}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {b.fee.toLocaleString("fr-FR")} €
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[b.status] || ""
                        }`}
                      >
                        {statusLabels[b.status] || b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Check checked={b.contractSigned} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Check checked={b.agencyFeesPaid} onClick={() => handleToggleField(b.id, "agencyFeesPaid", !b.agencyFeesPaid)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Check checked={b.artistFeesPaid} onClick={() => handleToggleField(b.id, "artistFeesPaid", !b.artistFeesPaid)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Check checked={b.transportBooked} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Check checked={b.hotelBooked} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
          role="booker"
        />
      )}

      {/* Booking Form Modal */}
      {showForm && (
        <>
          {/* Artist selector for new bookings */}
          {!editingBooking && !createForArtistId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => { setShowForm(false); setCreateForArtistId(""); }} />
              <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
                <h2 className="text-lg font-bold mb-4">Nouvelle date</h2>
                <p className="text-gray-400 text-sm mb-4">Pour quel artiste ?</p>
                <div className="space-y-2">
                  {artists.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setCreateForArtistId(a.id)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-700 bg-gray-800/50 hover:border-purple-500 transition-colors"
                    >
                      <span className="font-medium">{a.artistName || a.name || a.email}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { setShowForm(false); setCreateForArtistId(""); }}
                  className="mt-4 w-full text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
          {/* Actual booking form (edit or create with artist selected) */}
          {(editingBooking || createForArtistId) && (
            <BookingForm
              booking={editingBooking}
              promoters={promoters}
              onSave={handleSave}
              onClose={() => {
                setShowForm(false);
                setEditingBooking(null);
                setCreateForArtistId("");
              }}
              onPromoterCreated={(p) => {
                setPromoters((prev) => [...prev, p].sort((a, b) => a.name.localeCompare(b.name)));
              }}
              artistId={editingBooking ? getArtistIdForBooking(editingBooking.id) : createForArtistId}
            />
          )}
        </>
      )}

      {/* Promoter Form Modal */}
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

      {/* Promoter Detail Panel */}
      {selectedPromoter && (
        <PromoterDetail
          promoter={selectedPromoter}
          onClose={() => setSelectedPromoter(null)}
          onEdit={(p) => {
            setSelectedPromoter(null);
            handleEditPromoter(p);
          }}
        />
      )}
    </div>
  );
}
