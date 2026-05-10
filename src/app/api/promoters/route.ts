import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const promoters = await prisma.promoter.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { bookings: true } } },
  });

  return NextResponse.json(promoters);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const data = await request.json();

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
      userId: session.user.id,
    },
  });

  return NextResponse.json(promoter, { status: 201 });
}
