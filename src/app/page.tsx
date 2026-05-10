import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Dashboard from "@/components/Dashboard";
import ArtistSelector from "@/components/ArtistSelector";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ artistId?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true, email: true, artistName: true },
  });

  // Redirect to onboarding if no role set
  if (!user?.role) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const isBooker = user.role === "booker";

  // Determine the target artist
  let targetUserId: string;
  let artists: { id: string; name: string | null; email: string; artistName: string | null }[] = [];
  let selectedArtistId: string | null = null;

  if (isBooker) {
    // Load managed artists
    const relations = await prisma.bookerArtist.findMany({
      where: { bookerId: session.user.id },
      include: {
        artist: { select: { id: true, name: true, email: true, artistName: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    artists = relations.map((r) => r.artist);

    if (artists.length === 0) {
      // No artists yet — show empty state
      return (
        <div className="min-h-screen">
          <Header userName={user.name || user.email} role="booker" />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <AddArtistEmptyState />
          </main>
        </div>
      );
    }

    // Use selected artist or default to first
    selectedArtistId = params.artistId && artists.some((a) => a.id === params.artistId)
      ? params.artistId!
      : artists[0].id;
    targetUserId = selectedArtistId;
  } else {
    // Artist sees their own data
    targetUserId = session.user.id;
  }

  const [bookings, promoters] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: targetUserId },
      orderBy: { date: "asc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.promoter.findMany({
      where: { userId: targetUserId },
      orderBy: { name: "asc" },
      include: { _count: { select: { bookings: true } } },
    }),
  ]);

  const selectedArtist = isBooker
    ? artists.find((a) => a.id === selectedArtistId)
    : null;

  return (
    <div className="min-h-screen">
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
            {isBooker && artists.length > 0 && (
              <ArtistSelector
                artists={artists.map((a) => ({
                  id: a.id,
                  label: a.artistName || a.name || a.email,
                }))}
                selectedId={selectedArtistId!}
              />
            )}
            <a
              href="/settings"
              className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
            >
              Configuration
            </a>
            <span className="text-sm text-gray-400">
              {user.name || user.email}
            </span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Deconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      {isBooker && selectedArtist && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="text-sm text-gray-400">
            Artiste : <span className="text-white font-medium">{selectedArtist.artistName || selectedArtist.name || selectedArtist.email}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Dashboard
          initialBookings={JSON.parse(JSON.stringify(bookings))}
          initialPromoters={JSON.parse(JSON.stringify(promoters))}
          role={user.role as "artist" | "booker"}
          artistId={isBooker ? selectedArtistId! : undefined}
        />
      </main>
    </div>
  );
}

function Header({ userName, role }: { userName: string; role: string }) {
  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎧</span>
          <h1 className="text-xl font-bold">DJ Booking Manager</h1>
          {role === "booker" && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
              Booker
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/settings"
            className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
          >
            Configuration
          </a>
          <span className="text-sm text-gray-400">{userName}</span>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Deconnexion
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function AddArtistEmptyState() {
  return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">🎵</div>
      <h2 className="text-xl font-bold mb-2">Aucun artiste</h2>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        Ajoutez un artiste pour commencer a gerer ses bookings. L&apos;artiste doit avoir un compte sur la plateforme.
      </p>
      <AddArtistForm />
    </div>
  );
}

function AddArtistForm() {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        const email = formData.get("email") as string;
        if (!email) return;
        
        const session = await auth();
        if (!session?.user?.id) return;

        const artist = await prisma.user.findUnique({
          where: { email },
          select: { id: true, role: true },
        });

        if (!artist || artist.role !== "artist") return;

        await prisma.bookerArtist.upsert({
          where: {
            bookerId_artistId: {
              bookerId: session.user.id,
              artistId: artist.id,
            },
          },
          create: { bookerId: session.user.id, artistId: artist.id },
          update: {},
        });

        const { redirect } = await import("next/navigation");
        redirect(`/?artistId=${artist.id}`);
      }}
      className="flex gap-2 max-w-md mx-auto"
    >
      <input
        type="email"
        name="email"
        placeholder="Email de l'artiste"
        required
        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500"
      />
      <button
        type="submit"
        className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors"
      >
        Ajouter
      </button>
    </form>
  );
}
