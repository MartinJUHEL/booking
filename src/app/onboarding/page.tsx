import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // If user already has a role, go to dashboard
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role) {
    redirect("/");
  }

  return <OnboardingClient userName={session.user.name || ""} />;
}
