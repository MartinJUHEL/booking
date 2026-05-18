"use client";

import { use } from "react";
import ArtistBookingDetail from "@/components/ArtistBookingDetail";

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ArtistBookingDetail bookingId={id} />;
}
