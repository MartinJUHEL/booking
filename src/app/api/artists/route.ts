import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET: List artists managed by the current booker
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "booker") {
    return NextResponse.json({ error: "Booker only" }, { status: 403 });
  }

  const relations = await prisma.bookerArtist.findMany({
    where: { bookerId: session.user.id },
    include: {
      artist: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          artistName: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const artists = relations.map((r) => r.artist);
  return NextResponse.json(artists);
}

// POST: Add an artist by email
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "booker") {
    return NextResponse.json({ error: "Booker only" }, { status: 403 });
  }

  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  // Find the artist user
  const artist = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, image: true, artistName: true, role: true },
  });

  if (!artist) {
    return NextResponse.json(
      { error: "Aucun utilisateur trouve avec cet email" },
      { status: 404 }
    );
  }

  if (artist.role !== "artist") {
    return NextResponse.json(
      { error: "Cet utilisateur n'est pas un artiste" },
      { status: 400 }
    );
  }

  if (artist.id === session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas vous ajouter vous-meme" },
      { status: 400 }
    );
  }

  // Create the relation (upsert to avoid duplicates)
  await prisma.bookerArtist.upsert({
    where: {
      bookerId_artistId: {
        bookerId: session.user.id,
        artistId: artist.id,
      },
    },
    create: {
      bookerId: session.user.id,
      artistId: artist.id,
    },
    update: {},
  });

  return NextResponse.json(artist, { status: 201 });
}
