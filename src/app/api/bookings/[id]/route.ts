import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

  await prisma.booking.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
