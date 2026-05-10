import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncBookingToCalendar } from "@/lib/google-calendar";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const appBaseUrl = `${protocol}://${host}`;

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id, status: { not: "cancelled" } },
  });

  let synced = 0;

  for (const booking of bookings) {
    const eventId = await syncBookingToCalendar(
      session.user.id,
      { ...booking, date: booking.date },
      appBaseUrl
    );

    if (eventId) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { googleCalendarEventId: eventId },
      });
      synced++;
    }
  }

  return NextResponse.json({ synced, total: bookings.length });
}
