import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      googleCalendarEnabled: true,
      googleCalendarId: true,
    },
  });

  return NextResponse.json(user ?? { googleCalendarEnabled: false, googleCalendarId: null });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      googleCalendarEnabled: body.googleCalendarEnabled ?? undefined,
      googleCalendarId: body.googleCalendarId ?? undefined,
    },
    select: {
      googleCalendarEnabled: true,
      googleCalendarId: true,
    },
  });

  return NextResponse.json(user);
}
