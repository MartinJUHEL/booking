"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import HeaderBar from "@/components/HeaderBar";
import PromoterList from "@/components/PromoterList";
import PromoterForm from "@/components/PromoterForm";
import PromoterDetail from "@/components/PromoterDetail";
import type { Promoter } from "@/components/types";

interface PromoterWithCount extends Promoter {
  _count?: { bookings: number };
  bookingsCount?: number;
}

export default function PromotersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [promoters, setPromoters] = useState<PromoterWithCount[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromoter, setEditingPromoter] = useState<Promoter | null>(null);
  const [selectedPromoter, setSelectedPromoter] = useState<PromoterWithCount | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && !user.role) router.replace("/onboarding");
    if (!loading && user && user.role !== "booker") router.replace("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const fetchPromoters = useCallback(async () => {
    setDataLoading(true);
    try {
      const data = await api.get<PromoterWithCount[]>("/api/promoters");
      setPromoters(data.map(p => ({ ...p, _count: { bookings: p.bookingsCount || 0 } })));
    } catch (err) {
      console.error("Failed to load promoters:", err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "booker") {
      fetchPromoters();
    }
  }, [user, fetchPromoters]);

  async function handleSave(data: Partial<Promoter>) {
    if (editingPromoter) {
      const updated = await api.put<Promoter>(`/api/promoters/${editingPromoter.id}`, data);
      setPromoters(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    } else {
      const created = await api.post<Promoter>("/api/promoters", data);
      setPromoters(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setShowForm(false);
    setEditingPromoter(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce promoteur ? Les dates associées conserveront le nom du promoteur.")) return;
    await api.delete(`/api/promoters/${id}`);
    setPromoters(prev => prev.filter(p => p.id !== id));
  }

  function handleEdit(promoter: Promoter) {
    setEditingPromoter(promoter);
    setShowForm(true);
  }

  const filtered = promoters.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [p.name, p.company, p.email, p.city, p.country]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  if (loading || !user || user.role !== "booker") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <HeaderBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Promoteurs</h1>
            {!dataLoading && (
              <span className="text-sm text-gray-500">
                {filtered.length} promoteur{filtered.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            onClick={() => { setEditingPromoter(null); setShowForm(true); }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
          >
            + Nouveau promoteur
          </button>
        </div>

        {/* Search */}
        {!dataLoading && promoters.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher un promoteur..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600"
              />
            </div>
          </div>
        )}

        {/* Content */}
        {dataLoading ? (
          <div className="text-center py-16 text-gray-500">Chargement...</div>
        ) : (
          <PromoterList
            promoters={filtered}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSelect={p => setSelectedPromoter(p)}
          />
        )}
      </main>

      {/* Promoter Form Modal */}
      {showForm && (
        <PromoterForm
          promoter={editingPromoter}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingPromoter(null); }}
        />
      )}

      {/* Promoter Detail Panel */}
      {selectedPromoter && (
        <PromoterDetail
          promoter={selectedPromoter}
          onClose={() => setSelectedPromoter(null)}
          onEdit={p => { setSelectedPromoter(null); handleEdit(p); }}
        />
      )}
    </div>
  );
}
