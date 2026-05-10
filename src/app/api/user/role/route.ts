import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role, artistName } = await req.json();

  if (role !== "artist" && role !== "booker") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (role === "artist" && !artistName?.trim()) {
    return NextResponse.json({ error: "Artist name is required" }, { status: 400 });
  }

  const data: { role: string; artistName?: string } = { role };
  if (role === "artist") {
    data.artistName = artistName.trim();
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return NextResponse.json({ role: user.role, artistName: user.artistName });
}
