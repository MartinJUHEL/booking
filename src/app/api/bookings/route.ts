import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
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

  const booking = await prisma.booking.create({
    data: {
      date: new Date(body.date),
      time: body.time || null,
      promoter: body.promoter,
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
      userId: session.user.id,
    },
  });

  return NextResponse.json(booking, { status: 201 });
}
