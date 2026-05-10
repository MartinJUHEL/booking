import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();

  const promoter = await prisma.promoter.update({
    where: { id },
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
    },
  });

  return NextResponse.json(promoter);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.promoter.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
