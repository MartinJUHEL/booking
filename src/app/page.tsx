"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import Dashboard from "@/components/Dashboard";
import BookerDashboard from "@/components/BookerDashboard";
import type { BookingListItem, Promoter } from "@/components/types";

interface Artist {
  id: string;
  name: string | null;
  email: string;
  artistName: string | null;
}

interface PromoterWithCount extends Promoter {
  bookingsCount?: number;
  _count?: { bookings: number };
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
  const [promoters, setPromoters] = useState<PromoterWithCount[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Add artist form state
  const [addArtistEmail, setAddArtistEmail] = useState("");
  const [addingArtist, setAddingArtist] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

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
          const [b, p, inv, bookers] = await Promise.all([
            api.get<BookingListItem[]>("/api/bookings"),
            api.get<PromoterWithCount[]>("/api/promoters"),
            api.get<Array<{ id: string; token: string; bookerName: string; bookerEmail: string; createdAt: string }>>("/api/artists/invitations"),
            api.get<Array<{ id: string; name: string | null; email: string; image: string | null; linkedAt: string }>>("/api/artists/bookers"),
          ]);
          setBookings(b);
          setPromoters(p.map(pr => ({ ...pr, _count: { bookings: pr.bookingsCount || 0 } })));
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

  async function handleAddArtist(e: React.FormEvent) {
    e.preventDefault();
    if (!addArtistEmail) return;
    setAddingArtist(true);
    setInviteMessage(null);
    setInviteError(null);
    try {
      await api.post("/api/artists", { email: addArtistEmail });
      setInviteMessage(`Invitation envoyee a ${addArtistEmail}. L'artiste doit accepter l'invitation.`);
      setAddArtistEmail("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'envoi de l'invitation";
      setInviteError(message);
    } finally {
      setAddingArtist(false);
    }
  }

  async function handleRemoveArtist(artistId: string, artistName: string) {
    if (!confirm(`Retirer ${artistName} de votre liste ?`)) return;
    try {
      await api.delete(`/api/artists/${artistId}`);
      setArtists(prev => prev.filter(a => a.id !== artistId));
      if (selectedArtistId === artistId) setSelectedArtistId(null);
    } catch (err) {
      console.error("Failed to remove artist:", err);
    }
  }

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
        <HeaderBar user={user} isBooker={isBooker} onLogout={logout} />
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
        <HeaderBar user={user} isBooker={isBooker} onLogout={logout} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎵</div>
            <h2 className="text-xl font-bold mb-2">Aucun artiste</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Ajoutez un artiste pour commencer a gerer ses bookings. L&apos;artiste doit avoir un compte sur la plateforme.
            </p>
            <form onSubmit={handleAddArtist} className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                value={addArtistEmail}
                onChange={(e) => setAddArtistEmail(e.target.value)}
                placeholder="Email de l'artiste"
                required
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={addingArtist}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
              >
                {addingArtist ? "..." : "Inviter"}
              </button>
            </form>
            {inviteMessage && (
              <p className="text-green-400 text-sm mt-4">{inviteMessage}</p>
            )}
            {inviteError && (
              <p className="text-red-400 text-sm mt-4">{inviteError}</p>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <HeaderBar user={user} isBooker={isBooker} onLogout={logout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {isBooker ? (
          <>
            {/* Artist management bar */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <form onSubmit={handleAddArtist} className="flex gap-2">
                <input
                  type="email"
                  value={addArtistEmail}
                  onChange={(e) => setAddArtistEmail(e.target.value)}
                  placeholder="Email de l'artiste"
                  required
                  className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={addingArtist}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {addingArtist ? "..." : "Inviter un artiste"}
                </button>
              </form>
              {inviteMessage && <span className="text-green-400 text-sm">{inviteMessage}</span>}
              {inviteError && <span className="text-red-400 text-sm">{inviteError}</span>}
            </div>

            {/* Artist chips with remove */}
            <div className="mb-4 flex flex-wrap gap-2">
              {artists.map(a => (
                <span key={a.id} className="inline-flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-full px-3 py-1 text-sm">
                  <span className="text-purple-400 font-medium">{a.artistName || a.name || a.email}</span>
                  <button
                    onClick={() => handleRemoveArtist(a.id, a.artistName || a.name || a.email)}
                    className="text-gray-500 hover:text-red-400 transition-colors ml-1"
                    title="Retirer cet artiste"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>

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
              initialPromoters={promoters}
              role="artist"
            />
          </>
        )}
      </main>
    </div>
  );
}

function HeaderBar({
  user,
  isBooker,
  onLogout,
}: {
  user: { name: string | null; email: string; role: string | null };
  isBooker: boolean;
  onLogout: () => void;
}) {
  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Gigflow</h1>
          {isBooker && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
              Booker
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!isBooker && (
            <Link href="/settings" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">
              Configuration
            </Link>
          )}
          <span className="text-sm text-gray-400">{user.name || user.email}</span>
          <button
            onClick={onLogout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Deconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
