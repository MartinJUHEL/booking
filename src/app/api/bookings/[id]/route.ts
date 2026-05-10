import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  syncBookingToCalendar,
  deleteBookingFromCalendar,
} from "@/lib/google-calendar";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/bookings/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();

  const booking = await prisma.booking.update({
    where: { id },
    data: {
      date: body.date ? new Date(body.date) : undefined,
      time: body.time,
      promoter: body.promoter,
      venue: body.venue,
      city: body.city,
      country: body.country,
      fee: body.fee !== undefined ? parseFloat(body.fee) : undefined,
      contractSigned: body.contractSigned,
      agencyFeesPaid: body.agencyFeesPaid,
      artistFeesPaid: body.artistFeesPaid,
      transportBooked: body.transportBooked,
      transportInfo: body.transportInfo,
      hotelBooked: body.hotelBooked,
      hotelInfo: body.hotelInfo,
      notes: body.notes,
      status: body.status,
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

  if (eventId && eventId !== booking.googleCalendarEventId) {
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { googleCalendarEventId: eventId },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json(booking);
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/bookings/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  // Get booking first for calendar cleanup
  const booking = await prisma.booking.findUnique({ where: { id } });

  if (booking?.googleCalendarEventId) {
    await deleteBookingFromCalendar(
      session.user.id,
      booking.googleCalendarEventId
    );
  }

  await prisma.booking.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
