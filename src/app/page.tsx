"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import Dashboard from "@/components/Dashboard";
import BookerDashboard from "@/components/BookerDashboard";
import HeaderBar from "@/components/HeaderBar";
import type { BookingListItem } from "@/components/types";

interface Artist {
  id: string;
  name: string | null;
  email: string;
  artistName: string | null;
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Chargement...</div></div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Pending invitations for artists
  const [pendingInvitations, setPendingInvitations] = useState<Array<{
    id: string; token: string; bookerName: string; bookerEmail: string; createdAt: string;
  }>>([]);

  // Bookers managing the current artist
  const [myBookers, setMyBookers] = useState<Array<{
    id: string; name: string | null; email: string; image: string | null; linkedAt: string;
  }>>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    if (!loading && user && !user.role) {
      router.replace("/onboarding");
    }
    if (!loading && user && user.role === "booker" && !user.agencyId) {
      router.replace("/onboarding");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const isBooker = user?.role === "booker";

  // Load data
  useEffect(() => {
    if (!user || !user.role) return;

    async function loadData() {
      setDataLoading(true);
      try {
        if (isBooker) {
          // Booker dashboard only needs artists list; BookerDashboard handles its own data
          const artistsData = await api.get<Artist[]>("/api/artists");
          setArtists(artistsData);
        } else {
          const [b, inv, bookers] = await Promise.all([
            api.get<BookingListItem[]>("/api/bookings"),
            api.get<Array<{ id: string; token: string; bookerName: string; bookerEmail: string; createdAt: string }>>("/api/artists/invitations"),
            api.get<Array<{ id: string; name: string | null; email: string; image: string | null; linkedAt: string }>>("/api/artists/bookers"),
          ]);
          setBookings(b);
          setPendingInvitations(inv);
          setMyBookers(bookers);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setDataLoading(false);
      }
    }

    loadData();
  }, [user, isBooker]);

  async function handleRespondInvitation(token: string, accept: boolean) {
    try {
      await api.post(`/api/artists/invitations/${token}/${accept ? "accept" : "reject"}`);
      setPendingInvitations(prev => prev.filter(i => i.token !== token));
    } catch (err) {
      console.error("Failed to respond to invitation:", err);
    }
  }

  async function handleRemoveBooker(bookerId: string, bookerName: string) {
    if (!confirm(`Retirer ${bookerName} de vos bookers ? Il ne pourra plus gerer vos bookings.`)) return;
    try {
      await api.delete(`/api/artists/bookers/${bookerId}`);
      setMyBookers(prev => prev.filter(b => b.id !== bookerId));
    } catch (err) {
      console.error("Failed to remove booker:", err);
    }
  }

  if (loading || !user || !user.role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen">
        <HeaderBar />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400">Chargement des donnees...</div>
        </div>
      </div>
    );
  }

  // Booker with no artists
  if (isBooker && artists.length === 0) {
    return (
      <div className="min-h-screen">
        <HeaderBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center py-20">
            <h2 className="text-xl font-bold mb-2">Aucun artiste</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Ajoutez des artistes depuis la page Agence pour commencer a gerer leurs bookings.
            </p>
            <Link
              href="/agency"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors inline-block"
            >
              Gerer mes artistes
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <HeaderBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {isBooker ? (
          <>
            <BookerDashboard artists={artists} />
          </>
        ) : (
          <>
            {/* Pending invitations for artists */}
            {pendingInvitations.length > 0 && (
              <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <h3 className="text-sm font-semibold text-purple-400 mb-3">
                  Invitations en attente ({pendingInvitations.length})
                </h3>
                <div className="space-y-2">
                  {pendingInvitations.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between bg-gray-900/50 rounded-lg px-4 py-3">
                      <div>
                        <span className="font-medium">{inv.bookerName}</span>
                        <span className="text-gray-500 text-sm ml-2">({inv.bookerEmail})</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespondInvitation(inv.token, true)}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => handleRespondInvitation(inv.token, false)}
                          className="bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
                        >
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My bookers */}
            {myBookers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  Mes bookers ({myBookers.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {myBookers.map(b => (
                    <span key={b.id} className="inline-flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-full px-3 py-1 text-sm">
                      <span className="text-blue-400 font-medium">{b.name || b.email}</span>
                      <button
                        onClick={() => handleRemoveBooker(b.id, b.name || b.email)}
                        className="text-gray-500 hover:text-red-400 transition-colors ml-1"
                        title="Retirer ce booker"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Dashboard
              initialBookings={bookings}
            />
          </>
        )}
      </main>
    </div>
  );
}
