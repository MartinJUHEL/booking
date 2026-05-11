"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import Dashboard from "@/components/Dashboard";
import ArtistSelector from "@/components/ArtistSelector";
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
  const searchParams = useSearchParams();

  const [artists, setArtists] = useState<Artist[]>([]);
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [promoters, setPromoters] = useState<PromoterWithCount[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Add artist form state
  const [addArtistEmail, setAddArtistEmail] = useState("");
  const [addingArtist, setAddingArtist] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    if (!loading && user && !user.role) {
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
          const artistsData = await api.get<Artist[]>("/api/artists");
          setArtists(artistsData);

          const paramArtistId = searchParams.get("artistId");
          const targetId = paramArtistId && artistsData.some(a => a.id === paramArtistId)
            ? paramArtistId
            : artistsData[0]?.id || null;
          setSelectedArtistId(targetId);

          if (targetId) {
            const [b, p] = await Promise.all([
              api.get<BookingListItem[]>(`/api/bookings?artistId=${targetId}`),
              api.get<PromoterWithCount[]>(`/api/promoters?artistId=${targetId}`),
            ]);
            setBookings(b);
            // Map bookingsCount to _count for compatibility
            setPromoters(p.map(pr => ({ ...pr, _count: { bookings: pr.bookingsCount || 0 } })));
          }
        } else {
          const [b, p] = await Promise.all([
            api.get<BookingListItem[]>("/api/bookings"),
            api.get<PromoterWithCount[]>("/api/promoters"),
          ]);
          setBookings(b);
          setPromoters(p.map(pr => ({ ...pr, _count: { bookings: pr.bookingsCount || 0 } })));
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setDataLoading(false);
      }
    }

    loadData();
  }, [user, isBooker, searchParams]);

  // Reload when artist changes
  useEffect(() => {
    if (!isBooker || !selectedArtistId || !user) return;

    async function loadArtistData() {
      try {
        const [b, p] = await Promise.all([
          api.get<BookingListItem[]>(`/api/bookings?artistId=${selectedArtistId}`),
          api.get<PromoterWithCount[]>(`/api/promoters?artistId=${selectedArtistId}`),
        ]);
        setBookings(b);
        setPromoters(p.map(pr => ({ ...pr, _count: { bookings: pr.bookingsCount || 0 } })));
      } catch (err) {
        console.error("Failed to load artist data:", err);
      }
    }

    loadArtistData();
  }, [selectedArtistId, isBooker, user]);

  async function handleAddArtist(e: React.FormEvent) {
    e.preventDefault();
    if (!addArtistEmail) return;
    setAddingArtist(true);
    try {
      const artist = await api.post<Artist>("/api/artists", { email: addArtistEmail });
      setArtists(prev => [...prev, artist]);
      setSelectedArtistId(artist.id);
      setAddArtistEmail("");
      router.push(`/?artistId=${artist.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingArtist(false);
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
        <HeaderBar user={user} isBooker={isBooker} artists={artists} selectedArtistId={selectedArtistId} onLogout={logout} />
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
        <HeaderBar user={user} isBooker={isBooker} artists={[]} selectedArtistId={null} onLogout={logout} />
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
                {addingArtist ? "..." : "Ajouter"}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  const selectedArtist = isBooker ? artists.find(a => a.id === selectedArtistId) : null;

  return (
    <div className="min-h-screen">
      <HeaderBar user={user} isBooker={isBooker} artists={artists} selectedArtistId={selectedArtistId} onLogout={logout} />

      {isBooker && selectedArtist && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="text-sm text-gray-400">
            Artiste : <span className="text-white font-medium">{selectedArtist.artistName || selectedArtist.name || selectedArtist.email}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Dashboard
          initialBookings={bookings}
          initialPromoters={promoters}
          role={user.role as "artist" | "booker"}
          artistId={isBooker ? selectedArtistId! : undefined}
        />
      </main>
    </div>
  );
}

function HeaderBar({
  user,
  isBooker,
  artists,
  selectedArtistId,
  onLogout,
}: {
  user: { name: string | null; email: string; role: string | null };
  isBooker: boolean;
  artists: Artist[];
  selectedArtistId: string | null;
  onLogout: () => void;
}) {
  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎧</span>
          <h1 className="text-xl font-bold">DJ Booking Manager</h1>
          {isBooker && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
              Booker
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {isBooker && artists.length > 0 && selectedArtistId && (
            <ArtistSelector
              artists={artists.map(a => ({
                id: a.id,
                label: a.artistName || a.name || a.email,
              }))}
              selectedId={selectedArtistId}
            />
          )}
          <Link href="/settings" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">
            Configuration
          </Link>
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
