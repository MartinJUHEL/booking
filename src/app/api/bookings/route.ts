import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncBookingToCalendar } from "@/lib/google-calendar";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  let targetUserId: string;

  if (user?.role === "booker") {
    // Booker can view a specific artist's bookings
    const artistId = req.nextUrl.searchParams.get("artistId");
    if (!artistId) {
      return NextResponse.json([]);
    }
    // Verify the booker manages this artist
    const relation = await prisma.bookerArtist.findUnique({
      where: { bookerId_artistId: { bookerId: session.user.id, artistId } },
    });
    if (!relation) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    targetUserId = artistId;
  } else {
    // Artist sees their own bookings
    targetUserId = session.user.id;
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: targetUserId },
    orderBy: { date: "asc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // Determine which user owns this booking
  let targetUserId = session.user.id;
  if (user?.role === "booker" && body.artistId) {
    // Verify the booker manages this artist
    const relation = await prisma.bookerArtist.findUnique({
      where: { bookerId_artistId: { bookerId: session.user.id, artistId: body.artistId } },
    });
    if (!relation) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    targetUserId = body.artistId;
  }

  const booking = await prisma.booking.create({
    data: {
      date: new Date(body.date),
      time: body.time || null,
      promoter: body.promoter,
      promoterId: body.promoterId || null,
      venue: body.venue,
      city: body.city,
      country: body.country,
      fee: parseFloat(body.fee) || 0,
      contractSigned: body.contractSigned || false,
      agencyFeesPaid: body.agencyFeesPaid || false,
      artistFeesPaid: body.artistFeesPaid || false,
      transportBooked: body.transportBooked || false,
      transportInfo: body.transportInfo || null,
      hotelBooked: body.hotelBooked || false,
      hotelInfo: body.hotelInfo || null,
      notes: body.notes || null,
      status: body.status || "pending",
      userId: targetUserId,
    },
  });

  // Sync to Google Calendar
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const appBaseUrl = `${protocol}://${host}`;

  const eventId = await syncBookingToCalendar(
    session.user.id,
    booking,
    appBaseUrl
  );

  if (eventId) {
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { googleCalendarEventId: eventId },
    });
    return NextResponse.json(updated, { status: 201 });
  }

  return NextResponse.json(booking, { status: 201 });
}
