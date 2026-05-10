import { auth } from "@/lib/auth";
import { listUserCalendars } from "@/lib/google-calendar";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const calendars = await listUserCalendars(session.user.id);

  if (!calendars) {
    return NextResponse.json(
      { error: "Impossible de recuperer les calendriers. Reconnectez-vous pour autoriser l'acces." },
      { status: 400 }
    );
  }

  return NextResponse.json(calendars);
}
