import { NextRequest, NextResponse } from "next/server";
import { getVenueProvider } from "@/lib/venue-providers";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const provider = getVenueProvider();
    const results = await provider.search(q);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
