import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  let targetUserId: string;

  if (user?.role === "booker") {
    const artistId = req.nextUrl.searchParams.get("artistId");
    if (!artistId) {
      return NextResponse.json([]);
    }
    const relation = await prisma.bookerArtist.findUnique({
      where: { bookerId_artistId: { bookerId: session.user.id, artistId } },
    });
    if (!relation) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    targetUserId = artistId;
  } else {
    targetUserId = session.user.id;
  }

  const promoters = await prisma.promoter.findMany({
    where: { userId: targetUserId },
    orderBy: { name: "asc" },
    include: { _count: { select: { bookings: true } } },
  });

  return NextResponse.json(promoters);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const data = await request.json();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  let targetUserId = session.user.id;
  if (user?.role === "booker" && data.artistId) {
    const relation = await prisma.bookerArtist.findUnique({
      where: { bookerId_artistId: { bookerId: session.user.id, artistId: data.artistId } },
    });
    if (!relation) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    targetUserId = data.artistId;
  }

  const promoter = await prisma.promoter.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      headquarters: data.headquarters || null,
      siret: data.siret || null,
      ape: data.ape || null,
      vatNumber: data.vatNumber || null,
      signatory: data.signatory || null,
      signatoryRole: data.signatoryRole || null,
      notes: data.notes || null,
      userId: targetUserId,
    },
  });

  return NextResponse.json(promoter, { status: 201 });
}
