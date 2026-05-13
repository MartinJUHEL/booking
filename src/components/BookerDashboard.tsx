"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/api-client";
import BookingDetail from "./BookingDetail";
import BookingForm from "./BookingForm";
import CalendarView from "./CalendarView";
import type { Booking, DashboardBookingItem, DashboardResponse, Promoter } from "./types";

type ViewMode = "table" | "calendar";
type SortField = "date" | "artist" | "venue" | "city" | "fee" | "status";
type SortDir = "asc" | "desc";

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

// --- Icon components ---

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 8L7.2 9.7L10.5 6.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmptyCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 8H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 4H11.5M5 4V3C5 2.448 5.448 2 6 2H8C8.552 2 9 2.448 9 3V4M9.5 4V11.5C9.5 12.052 9.052 12.5 8.5 12.5H5.5C4.948 12.5 4.5 12.052 4.5 11.5V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SortIcon({ active, direction }: { active: boolean; direction: SortDir }) {
  return (
    <svg className={`inline-block ml-1 ${active ? "text-purple-400" : "text-gray-600"}`} width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      {direction === "asc" ? (
        <path d="M2 6.5L5 3.5L8 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function CalendarEmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="10" width="36" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M16 6V14M32 6V14M6 20H42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 30L28 30M24 26V34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// --- Check component with icon ---
function Check({ checked, onClick, tooltip }: { checked: boolean; onClick?: () => void; tooltip?: string }) {
  if (onClick) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`inline-flex items-center justify-center w-6 h-6 rounded-md transition-all ${
          checked
            ? "text-green-400 hover:text-red-400"
            : "text-gray-600 hover:text-green-400"
        }`}
        title={tooltip || (checked ? "Marquer comme non fait" : "Marquer comme fait")}
      >
        {checked ? <CheckCircleIcon /> : <EmptyCircleIcon />}
      </button>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${
        checked ? "text-green-400" : "text-gray-600"
      }`}
      title={tooltip}
    >
      {checked ? <CheckCircleIcon /> : <EmptyCircleIcon />}
    </span>
  );
}

// --- Stats Card ---
function StatCard({ label, value, alert, icon }: { label: string; value: string | number; alert?: boolean; icon?: React.ReactNode }) {
  return (
    <div className={`rounded-xl border p-4 ${alert ? "border-red-500/30 bg-red-500/5" : "border-gray-800 bg-gray-900/50"}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className={alert ? "text-red-400" : "text-gray-500"}>{icon}</span>}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${alert ? "text-red-400" : "text-white"}`}>{value}</div>
    </div>
  );
}

export default function BookerDashboard({ artists }: { artists: Artist[] }) {
  const [bookings, setBookings] = useState<DashboardBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([year]);
  const [artistFilter, setArtistFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("table");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Booking form state
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [createForArtistId, setCreateForArtistId] = useState<string>("");

  // Promoters (for booking form)
  const [promoters, setPromoters] = useState<Promoter[]>([]);

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

  // --- Filtered + sorted bookings ---
  const filteredBookings = useMemo(() => {
    let result = bookings;

    // Text search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((b) =>
        [b.venue, b.city, b.country, b.promoter, b.artistName]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "artist":
          cmp = (a.artistName || "").localeCompare(b.artistName || "");
          break;
        case "venue":
          cmp = a.venue.localeCompare(b.venue);
          break;
        case "city":
          cmp = a.city.localeCompare(b.city);
          break;
        case "fee":
          cmp = a.fee - b.fee;
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [bookings, search, sortField, sortDir]);

  // --- Stats ---
  const stats = useMemo(() => {
    const upcoming = bookings.filter(
      (b) => new Date(b.date) >= new Date() && b.status !== "cancelled"
    );
    const unpaidAgency = upcoming.filter((b) => !b.agencyFeesPaid).length;
    const unpaidArtist = upcoming.filter((b) => !b.artistFeesPaid).length;
    return { upcoming: upcoming.length, unpaidAgency, unpaidArtist };
  }, [bookings]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
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

  async function handleDeleteBooking(id: string) {
    if (!confirm("Supprimer cette date ?")) return;
    try {
      await api.delete(`/api/bookings/${id}`);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      if (selectedBookingId === id) setSelectedBookingId(null);
    } catch (err) {
      console.error("Failed to delete booking:", err);
    }
  }

  async function handleEdit(booking: Booking) {
    try {
      const data = await api.get<Promoter[]>(`/api/promoters`);
      setPromoters(data);
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
      const artistId = createForArtistId;
      if (!artistId) return;
      const payload = { ...data, artistId };
      const created = await api.post<Booking>("/api/bookings", payload);
      fetchBookings();
      setSelectedBookingId(created.id);
    }
    setShowForm(false);
    setEditingBooking(null);
    setCreateForArtistId("");
  }

  function getArtistIdForBooking(bookingId: string): string | undefined {
    const item = bookings.find(b => b.id === bookingId);
    return item?.artistId;
  }

  // --- Sortable column header ---
  function SortableHeader({ field, label, align }: { field: SortField; label: string; align?: string }) {
    return (
      <th
        className={`px-4 py-3 font-medium cursor-pointer hover:text-gray-200 transition-colors select-none ${align || "text-left"}`}
        onClick={() => handleSort(field)}
      >
        {label}
        <SortIcon active={sortField === field} direction={sortField === field ? sortDir : "asc"} />
      </th>
    );
  }

  return (
    <div>
      {/* Stats Cards */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="Dates à venir" value={stats.upcoming} />

          <StatCard label="Fees agence impayés" value={stats.unpaidAgency} alert={stats.unpaidAgency > 0} />
          <StatCard label="Fees artiste impayés" value={stats.unpaidArtist} alert={stats.unpaidArtist > 0} />
        </div>
      )}

      {/* Row 1: Title + Action button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">Dates</h2>
          {!loading && (
            <span className="text-sm text-gray-500">
              {filteredBookings.length} date{filteredBookings.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <button
          onClick={async () => {
            setEditingBooking(null);
            setCreateForArtistId(artists.length === 1 ? artists[0].id : "");
            setShowForm(true);
            try {
              const data = await api.get<Promoter[]>(`/api/promoters`);
              setPromoters(data);
            } catch (err) {
              console.error("Failed to load promoters:", err);
            }
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
        >
          + Nouvelle date
        </button>
      </div>

      {/* Row 2: Filters | View toggle | Year nav */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        {/* Left: filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm w-48 focus:outline-none focus:border-purple-500 placeholder-gray-600"
            />
          </div>

          <select
            value={artistFilter}
            onChange={(e) => setArtistFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
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
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmé</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>

        <div className="flex-1" />

        {/* Center: view toggle */}
        <div className="inline-flex rounded-lg border border-gray-700 overflow-hidden">
          {(
            [
              { key: "table", label: "Liste" },
              { key: "calendar", label: "Calendrier" },
            ] as { key: ViewMode; label: string }[]
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                view === item.key
                  ? "bg-purple-600 text-white"
                  : "bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right: year nav */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYear((y) => y - 1)}
            disabled={availableYears.length === 0 || (!availableYears.includes(year - 1) && year - 1 < Math.min(...availableYears))}
            className="px-2 py-1.5 rounded-lg text-sm bg-gray-900 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            &larr;
          </button>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-purple-500"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={() => setYear((y) => y + 1)}
            disabled={availableYears.length === 0 || (!availableYears.includes(year + 1) && year + 1 > Math.max(...availableYears))}
            className="px-2 py-1.5 rounded-lg text-sm bg-gray-900 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            &rarr;
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">Chargement...</div>
      ) : view === "calendar" ? (
        <CalendarView
          bookings={filteredBookings}
          onSelect={(b) => setSelectedBookingId(b.id)}
          renderLabel={(b) => `${b.artistName} - ${b.venue}`}
        />
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-20">
          <CalendarEmptyIcon className="mx-auto text-gray-700 mb-4" />
          {search || artistFilter || statusFilter ? (
            <>
              <p className="text-lg text-gray-400 font-medium mb-2">Aucun résultat</p>
              <p className="text-sm text-gray-600 mb-4">Essayez de modifier vos filtres de recherche</p>
              <button
                onClick={() => { setSearch(""); setArtistFilter(""); setStatusFilter(""); }}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </>
          ) : (
            <>
              <p className="text-lg text-gray-400 font-medium mb-2">Aucune date en {year}</p>
              <p className="text-sm text-gray-600 mb-4">Créez votre première date pour commencer</p>
              <button
                onClick={async () => {
                  setEditingBooking(null);
                  setCreateForArtistId(artists.length === 1 ? artists[0].id : "");
                  setShowForm(true);
                  try {
                    const data = await api.get<Promoter[]>(`/api/promoters`);
                    setPromoters(data);
                  } catch (err) {
                    console.error("Failed to load promoters:", err);
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
              >
                + Nouvelle date
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900/80 text-gray-400 text-left">
                <SortableHeader field="date" label="Date" />
                <SortableHeader field="artist" label="Artiste" />
                <SortableHeader field="venue" label="Venue" />
                <SortableHeader field="city" label="Ville" />
                <th className="px-4 py-3 font-medium">Promoteur</th>
                <SortableHeader field="fee" label="Cachet" align="text-right" />
                <SortableHeader field="status" label="Statut" align="text-center" />
                <th className="px-4 py-3 font-medium text-center" title="Contrat signé">Contrat</th>
                <th className="px-4 py-3 font-medium text-center" title="Fees agence payés">Fees Ag.</th>
                <th className="px-4 py-3 font-medium text-center" title="Fees artiste payés">Fees Art.</th>
                <th className="px-4 py-3 font-medium text-center" title="Transport réservé">Transport</th>
                <th className="px-4 py-3 font-medium text-center" title="Hôtel réservé">Hôtel</th>
                <th className="px-4 py-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredBookings.map((b, index) => {
                const isPast = new Date(b.date) < new Date();
                return (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBookingId(b.id)}
                    className={`transition-colors cursor-pointer ${
                      isPast ? "opacity-50" : ""
                    } ${index % 2 === 0 ? "bg-gray-950" : "bg-gray-900/30"} hover:bg-gray-800/50`}
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
                      <Check checked={b.contractSigned} tooltip="Contrat signé" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Check checked={b.agencyFeesPaid} onClick={() => handleToggleField(b.id, "agencyFeesPaid", !b.agencyFeesPaid)} tooltip="Fees agence" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Check checked={b.artistFeesPaid} onClick={() => handleToggleField(b.id, "artistFeesPaid", !b.artistFeesPaid)} tooltip="Fees artiste" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Check checked={b.transportBooked} tooltip="Transport réservé" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Check checked={b.hotelBooked} tooltip="Hôtel réservé" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteBooking(b.id); }}
                        className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-500/10"
                        title="Supprimer cette date"
                      >
                        <TrashIcon />
                      </button>
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
    </div>
  );
}
